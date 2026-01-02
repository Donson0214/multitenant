import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { automationsQueue, etlQueue } from '@/queues';
import { DataSourceType } from '@prisma/client';
import { runWithRequestContext } from '@/lib/requestContext';

export async function scheduleAutomationForTenant(tenantId: string) {
  return automationsQueue.add(
    'evaluate',
    { tenantId },
    {
      repeat: { every: env.AUTOMATION_EVAL_INTERVAL_MS },
      jobId: `automation:${tenantId}`,
    }
  );
}

export async function scheduleEtlForDataSource(params: {
  tenantId: string;
  dataSourceId: string;
}) {
  return etlQueue.add(
    'poll',
    { tenantId: params.tenantId, dataSourceId: params.dataSourceId },
    {
      repeat: { every: env.ETL_POLL_INTERVAL_MS },
      jobId: `etl:${params.dataSourceId}`,
    }
  );
}

export async function removeEtlSchedule(dataSourceId: string) {
  await etlQueue.removeRepeatable(
    'poll',
    { every: env.ETL_POLL_INTERVAL_MS },
    `etl:${dataSourceId}`
  );
}

export async function registerRepeatableJobs() {
  return runWithRequestContext(
    { requestId: 'scheduler', isPlatformAdmin: true },
    async () => {
      const tenants = await prisma.tenant.findMany({
        select: { id: true },
      });

      await Promise.all(
        tenants.map((tenant) => scheduleAutomationForTenant(tenant.id))
      );

      const dataSources = await prisma.dataSource.findMany({
        where: { type: DataSourceType.REST_POLL },
        select: { id: true, tenantId: true },
      });

      await Promise.all(
        dataSources.map((dataSource) =>
          scheduleEtlForDataSource({
            tenantId: dataSource.tenantId,
            dataSourceId: dataSource.id,
          })
        )
      );
    }
  );
}
