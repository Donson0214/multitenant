import { Worker } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq';
import { DataSourceType, IngestionStatus } from '@prisma/client';
import {
  fetchRestData,
  mapRecords,
  resolveDataSourceContext,
} from '@/modules/data-sources/ingestion.service';
import { createIngestionLog, storeDatasetRecords } from '@/modules/data-sources/dataSource.service';
import { logger } from '@/lib/logger';
import { DatasetSchema } from '@/modules/datasets/dataset.types';
import { runWithRequestContext } from '@/lib/requestContext';

export const etlWorker = new Worker(
  'etl',
  async (job) => {
    const { tenantId, dataSourceId } = job.data as {
      tenantId: string;
      dataSourceId: string;
    };

    await runWithRequestContext(
      { requestId: `etl:${job.id}`, tenantId },
      async () => {
        const { dataSource, config, dataset } = await resolveDataSourceContext({
          tenantId,
          dataSourceId,
        });

        if (dataSource.type !== DataSourceType.REST_POLL) {
          return;
        }

        const rawRecords = await fetchRestData(config.restEndpoint);
        const mappingResult = mapRecords({
          rawRecords,
          mapping: config.fieldMapping ?? {},
          schema: dataset.schema as DatasetSchema,
          dateFieldOverride: config.dateField,
        });

        const writeResult = await storeDatasetRecords({
          tenantId: dataSource.tenantId,
          datasetId: dataset.id,
          records: mappingResult.records,
        });

        const status =
          mappingResult.records.length > 0
            ? IngestionStatus.SUCCESS
            : IngestionStatus.FAILED;

        await createIngestionLog({
          tenantId: dataSource.tenantId,
          dataSourceId: dataSource.id,
          status,
          message: mappingResult.errors.length
            ? 'ETL poll with errors'
            : 'ETL poll complete',
          rawPayload: {
            total: rawRecords.length,
            ingested: writeResult.count,
            errors: mappingResult.errors,
          },
        });
      }
    );
  },
  { ...bullmqConnection, concurrency: 5 }
);

etlWorker.on('failed', (job, err) => {
  logger.error('ETL job failed', { jobId: job?.id, error: err.message });
});
