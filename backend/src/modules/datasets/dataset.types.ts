export type FieldType = 'string' | 'number' | 'date' | 'boolean';

export type DatasetSchema = {
  dateField: string;
  fields: Record<string, FieldType>;
};
