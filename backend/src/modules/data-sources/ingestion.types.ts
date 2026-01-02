export type DataSourceConfig = {
  datasetId: string;
  fieldMapping: Record<string, string>;
  dateField?: string;
  webhookSecret?: string;
  restEndpoint?: string;
};
