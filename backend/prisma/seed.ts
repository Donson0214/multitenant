import {
  PrismaClient,
  DataSourceType,
  UserRole,
  AutomationStatus,
  Prisma,
} from '@prisma/client';

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
      product: 'string',
      channel: 'string',
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
    const now = new Date();
    const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
    const channels = ['Web', 'Sales', 'Partner'];
    const salesRecords: Prisma.DatasetRecordCreateManyInput[] = [];

    for (let dayIndex = 0; dayIndex < 45; dayIndex += 1) {
      const eventTime = new Date(now);
      eventTime.setDate(now.getDate() - (44 - dayIndex));
      eventTime.setHours(12, 0, 0, 0);
      products.forEach((product, productIndex) => {
        const amount = 3200 + dayIndex * 120 + productIndex * 280 + (dayIndex % 6) * 90;
        salesRecords.push({
          tenantId: tenant.id,
          datasetId: dataset.id,
          eventTime,
          data: {
            date: eventTime.toISOString(),
            amount,
            category: productIndex % 2 === 0 ? 'sales' : 'ops',
            product,
            channel: channels[productIndex % channels.length],
          } as Prisma.JsonObject,
        });
      });
    }

    await prisma.datasetRecord.createMany({ data: salesRecords });
  }

  const engagementSchema = {
    dateField: 'date',
    fields: {
      date: 'date',
      activeUsers: 'number',
      signups: 'number',
      plan: 'string',
    },
  };

  let engagementDataset = await prisma.dataset.findFirst({
    where: { tenantId: tenant.id, name: 'Engagement Dataset' },
  });
  if (!engagementDataset) {
    engagementDataset = await prisma.dataset.create({
      data: {
        tenantId: tenant.id,
        name: 'Engagement Dataset',
        schema: engagementSchema,
      },
    });
  }

  const engagementRecord = await prisma.datasetRecord.findFirst({
    where: { tenantId: tenant.id, datasetId: engagementDataset.id },
  });
  if (!engagementRecord) {
    const now = new Date();
    const plans = ['Basic', 'Pro', 'Enterprise'];
    const engagementRecords: Prisma.DatasetRecordCreateManyInput[] = [];

    for (let dayIndex = 0; dayIndex < 45; dayIndex += 1) {
      const eventTime = new Date(now);
      eventTime.setDate(now.getDate() - (44 - dayIndex));
      eventTime.setHours(10, 0, 0, 0);
      engagementRecords.push({
        tenantId: tenant.id,
        datasetId: engagementDataset.id,
        eventTime,
        data: {
          date: eventTime.toISOString(),
          activeUsers: 32000 + dayIndex * 140 + (dayIndex % 5) * 260,
          signups: 180 + (dayIndex % 7) * 12,
          plan: plans[dayIndex % plans.length],
        } as Prisma.JsonObject,
      });
    }

    await prisma.datasetRecord.createMany({ data: engagementRecords });
  }

  const usageSchema = {
    dateField: 'date',
    fields: {
      date: 'date',
      product: 'string',
      sessions: 'number',
      region: 'string',
    },
  };

  let usageDataset = await prisma.dataset.findFirst({
    where: { tenantId: tenant.id, name: 'Product Usage Dataset' },
  });
  if (!usageDataset) {
    usageDataset = await prisma.dataset.create({
      data: {
        tenantId: tenant.id,
        name: 'Product Usage Dataset',
        schema: usageSchema,
      },
    });
  }

  const usageRecord = await prisma.datasetRecord.findFirst({
    where: { tenantId: tenant.id, datasetId: usageDataset.id },
  });
  if (!usageRecord) {
    const now = new Date();
    const products = ['Product A', 'Product B', 'Product C', 'Product D'];
    const regions = ['NA', 'EMEA', 'APAC'];
    const usageRecords: Prisma.DatasetRecordCreateManyInput[] = [];

    for (let dayIndex = 0; dayIndex < 45; dayIndex += 1) {
      const eventTime = new Date(now);
      eventTime.setDate(now.getDate() - (44 - dayIndex));
      eventTime.setHours(9, 0, 0, 0);
      products.forEach((product, productIndex) => {
        usageRecords.push({
          tenantId: tenant.id,
          datasetId: usageDataset.id,
          eventTime,
          data: {
            date: eventTime.toISOString(),
            product,
            sessions: 900 + dayIndex * 25 + productIndex * 160 + (dayIndex % 4) * 40,
            region: regions[(dayIndex + productIndex) % regions.length],
          } as Prisma.JsonObject,
        });
      });
    }

    await prisma.datasetRecord.createMany({ data: usageRecords });
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
    where: { tenantId: tenant.id, name: 'Total Revenue' },
  });
  let revenueMetricId = existingMetric?.id;
  if (!existingMetric) {
    const metric = await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        name: 'Total Revenue',
        datasetId: dataset.id,
        definition: {
          aggregation: 'sum',
          field: 'amount',
        },
      },
    });
    revenueMetricId = metric.id;
  }

  const existingActiveUsers = await prisma.metric.findFirst({
    where: { tenantId: tenant.id, name: 'Active Users' },
  });
  let activeUsersMetricId = existingActiveUsers?.id;
  if (!existingActiveUsers) {
    const metric = await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        name: 'Active Users',
        datasetId: engagementDataset.id,
        definition: {
          aggregation: 'sum',
          field: 'activeUsers',
        },
      },
    });
    activeUsersMetricId = metric.id;
  }

  const existingSignups = await prisma.metric.findFirst({
    where: { tenantId: tenant.id, name: 'New Signups' },
  });
  let signupsMetricId = existingSignups?.id;
  if (!existingSignups) {
    const metric = await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        name: 'New Signups',
        datasetId: engagementDataset.id,
        definition: {
          aggregation: 'sum',
          field: 'signups',
        },
      },
    });
    signupsMetricId = metric.id;
  }

  const existingUsage = await prisma.metric.findFirst({
    where: { tenantId: tenant.id, name: 'Product Usage' },
  });
  let usageMetricId = existingUsage?.id;
  if (!existingUsage) {
    const metric = await prisma.metric.create({
      data: {
        tenantId: tenant.id,
        name: 'Product Usage',
        datasetId: usageDataset.id,
        definition: {
          aggregation: 'sum',
          field: 'sessions',
        },
      },
    });
    usageMetricId = metric.id;
  }

  const existingDashboard = await prisma.dashboard.findFirst({
    where: { tenantId: tenant.id, name: 'Revenue Overview' },
  });
  if (!existingDashboard && revenueMetricId) {
    await prisma.dashboard.create({
      data: {
        tenantId: tenant.id,
        name: 'Revenue Overview',
        layout: {
          visibility: 'private',
          widgets: [
            {
              type: 'kpi',
              metricId: revenueMetricId,
              title: 'Total Revenue',
              description: 'Live revenue across all products',
            },
            {
              type: 'line',
              metricId: revenueMetricId,
              title: 'Revenue Trend',
            },
            {
              type: 'bar',
              metricId: revenueMetricId,
              title: 'Revenue by Product',
            },
          ],
        },
      },
    });
  }

  const existingEngagementDashboard = await prisma.dashboard.findFirst({
    where: { tenantId: tenant.id, name: 'User Engagement' },
  });
  if (!existingEngagementDashboard && activeUsersMetricId) {
    await prisma.dashboard.create({
      data: {
        tenantId: tenant.id,
        name: 'User Engagement',
        layout: {
          visibility: 'public',
          widgets: [
            {
              type: 'kpi',
              metricId: activeUsersMetricId,
              title: 'Active Users',
              description: 'Daily active users in the selected range',
            },
            {
              type: 'line',
              metricId: activeUsersMetricId,
              title: 'User Growth',
            },
            {
              type: 'table',
              datasetId: engagementDataset.id,
              title: 'Engagement Log',
            },
          ],
        },
      },
    });
  }

  const existingProductDashboard = await prisma.dashboard.findFirst({
    where: { tenantId: tenant.id, name: 'Product Analytics' },
  });
  if (!existingProductDashboard && usageMetricId) {
    await prisma.dashboard.create({
      data: {
        tenantId: tenant.id,
        name: 'Product Analytics',
        layout: {
          widgets: [
            {
              type: 'kpi',
              metricId: usageMetricId,
              title: 'Product Usage',
            },
            {
              type: 'bar',
              metricId: usageMetricId,
              title: 'Usage by Product',
            },
            {
              type: 'line',
              metricId: usageMetricId,
              title: 'Usage Trend',
            },
          ],
        },
      },
    });
  }

  const existingRule = await prisma.automationRule.findFirst({
    where: { tenantId: tenant.id, name: 'High Sales Alert' },
  });
  if (!existingRule && revenueMetricId) {
    await prisma.automationRule.create({
      data: {
        tenantId: tenant.id,
        name: 'High Sales Alert',
        metricId: revenueMetricId,
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
