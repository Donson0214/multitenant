import { z } from 'zod';
import { DataSourceType } from '@prisma/client';

export const tenantCreateSchema = z.object({
  name: z.string().min(1).max(120),
});

export const tenantRoleSchema = z.enum(['OWNER', 'ANALYST', 'VIEWER']);

export const addUserSchema = z.object({
  email: z.string().email(),
  role: tenantRoleSchema,
});

export const changeRoleSchema = z.object({
  role: tenantRoleSchema,
});

export const datasetFieldTypeSchema = z.enum([
  'string',
  'number',
  'date',
  'boolean',
]);

export const datasetSchemaSchema = z
  .object({
    dateField: z.string().min(1),
    fields: z.record(datasetFieldTypeSchema),
  })
  .superRefine((value, ctx) => {
    if (!value.fields[value.dateField]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateField must exist in fields',
      });
    }
    if (value.fields[value.dateField] !== 'date') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateField must be of type date',
      });
    }
  });

export const datasetCreateSchema = z.object({
  name: z.string().min(1).max(120),
  schema: datasetSchemaSchema,
});

export const dataSourceConfigSchema = z.object({
  datasetId: z.string().min(1),
  fieldMapping: z.record(z.string()),
  dateField: z.string().optional(),
  webhookSecret: z.string().min(8).optional(),
  restEndpoint: z.string().url().optional(),
});

export const dataSourceCreateSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.nativeEnum(DataSourceType),
  config: dataSourceConfigSchema,
});

export const dataSourceUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  config: dataSourceConfigSchema.optional(),
});

export const metricFilterSchema = z.object({
  field: z.string().min(1),
  op: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte']),
  value: z.unknown(),
});

export const metricDefinitionSchema = z
  .object({
    expression: z.string().min(1).optional(),
    aggregation: z.enum(['sum', 'avg', 'count']).optional(),
    field: z.string().optional(),
    filters: z.array(metricFilterSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.expression && !value.aggregation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide expression or aggregation',
      });
    }
    if (
      value.aggregation &&
      value.aggregation !== 'count' &&
      !value.field
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Aggregation requires field',
      });
    }
  });

export const metricCreateSchema = z.object({
  name: z.string().min(1).max(120),
  datasetId: z.string().min(1),
  definition: metricDefinitionSchema,
});

export const dashboardCreateSchema = z.object({
  name: z.string().min(1).max(120),
  layout: z.unknown().optional(),
});

export const dashboardUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  layout: z.unknown().optional(),
});

export const dashboardShareSchema = z.object({
  userId: z.string().min(1),
  canEdit: z.boolean().optional(),
});

export const automationConditionSchema = z.object({
  operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq']),
  threshold: z.number(),
  range: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const automationActionSchema = z
  .object({
    type: z.enum(['EMAIL', 'IN_APP', 'WEBHOOK']),
    target: z.string().url().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'WEBHOOK' && !value.target) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Webhook action requires target URL',
      });
    }
  });

export const automationCreateSchema = z.object({
  name: z.string().min(1).max(120),
  metricId: z.string().min(1),
  condition: automationConditionSchema,
  action: automationActionSchema,
});

export function validateSchema<T>(schema: z.ZodSchema<T>, payload: unknown) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      success: false as const,
      issues: result.error.issues,
    };
  }

  return { success: true as const, data: result.data };
}
