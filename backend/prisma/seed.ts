import { PrismaClient, DataSourceType, UserRole, AutomationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoEmail = 'demo@company.com';
  let user = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: 'demo-firebase-uid',
        email: demoEmail,
        name: 'Demo Owner',
      },
    });
  }

  let tenant = await prisma.tenant.findFirst({
    where: { name: 'Demo Company' },
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Demo Company' },
    });
  }

  const existingMembership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, userId: user.id },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: UserRole.OWNER,
      },
    });
  }

  const datasetSchema = {
    dateField: 'date',
    fields: {
      date: 'date',
      amount: 'number',
      category: 'string',
    },
  };

  let dataset = await prisma.dataset.findFirst({
    where: { tenantId: tenant.id, name: 'Sales Dataset' },
  });
  if (!dataset) {
    dataset = await prisma.dataset.create({
      data: {
        tenantId: tenant.id,
        name: 'Sales Dataset',
        schema: datasetSchema,
      },
    });
  }

  const existingRecord = await prisma.datasetRecord.findFirst({
    where: { tenantId: tenant.id, datasetId: dataset.id },
  });
  if (!existingRecord) {
    await prisma.datasetRecord.createMany({
      data: [
        {
          tenantId: tenant.id,
          datasetId: dataset.id,
          eventTime: new Date(),
          data: { date: new Date(), amount: 120, category: 'ops' },
        },
        {
          tenantId: tenant.id,
          datasetId: dataset.id,
          eventTime: new Date(),
          data: { date: new Date(), amount: 340, category: 'sales' },
        },
      ],
    });
  }

  const dataSourceConfig = {
    datasetId: dataset.id,
    fieldMapping: {
      date: 'date',
      amount: 'amount',
      category: 'category',
    },
  };

  const existingDataSource = await prisma.dataSource.findFirst({
    where: { tenantId: tenant.id, name: 'REST Poll Demo' },
  });
  if (!existingDataSource) {
    await prisma.dataSource.create({
      data: {
        tenantId: tenant.id,
        name: 'REST Poll Demo',
        type: DataSourceType.REST_POLL,
        config: dataSourceConfig,
      },
    });
  }

  const existingMetric = await prisma.metric.findFirst({
    where: { tenantId: tenant.id, name: 'Total Sales' },
  });
  let metricId = existingMetric?.id;
  if (!existingMetric) {
    const metric = await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        name: 'Total Sales',
        datasetId: dataset.id,
        definition: {
          aggregation: 'sum',
          field: 'amount',
        },
      },
    });
    metricId = metric.id;
  }

  const existingDashboard = await prisma.dashboard.findFirst({
    where: { tenantId: tenant.id, name: 'Executive Overview' },
  });
  if (!existingDashboard && metricId) {
    await prisma.dashboard.create({
      data: {
        tenantId: tenant.id,
        name: 'Executive Overview',
        layout: {
          widgets: [
            {
              type: 'kpi',
              metricId,
              title: 'Total Sales',
            },
          ],
        },
      },
    });
  }

  const existingRule = await prisma.automationRule.findFirst({
    where: { tenantId: tenant.id, name: 'High Sales Alert' },
  });
  if (!existingRule && metricId) {
    await prisma.automationRule.create({
      data: {
        tenantId: tenant.id,
        name: 'High Sales Alert',
        metricId,
        condition: {
          operator: 'gt',
          threshold: 1000,
          range: 'last30',
        },
        action: {
          type: 'IN_APP',
          title: 'Sales Threshold',
          message: 'Sales exceeded 1000 in the last 30 days.',
        },
        status: AutomationStatus.ENABLED,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
