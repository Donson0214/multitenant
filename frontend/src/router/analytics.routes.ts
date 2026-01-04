import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import Dashboards from '../views/analytics/dashboards/Dashboards.vue'
import DashboardDetail from '../views/analytics/dashboards/detail/DashboardDetail.vue'
import Metrics from '../views/analytics/metrics/Metrics.vue'
import DataSources from '../views/analytics/data-sources/DataSources.vue'
import Datasets from '../views/analytics/datasets/Datasets.vue'
import Automations from '../views/analytics/automations/Automations.vue'
import Notifications from '../views/analytics/notifications/Notifications.vue'
import UsersRoles from '../views/analytics/users/UsersRoles.vue'
import AuditLogs from '../views/analytics/audit-logs/AuditLogs.vue'
import Settings from '../views/analytics/settings/Settings.vue'
import AdminTenants from '../views/admin/AdminTenants.vue'

const analyticsRoutes: RouteRecordRaw[] = [
  {
    path: '/analytics',
    component: AppLayout,
    children: [
      { path: '', redirect: '/analytics/dashboards' },
      {
        path: 'dashboards',
        name: 'dashboards',
        component: Dashboards,
      },
      {
        path: 'dashboards/:id',
        name: 'dashboard-detail',
        component: DashboardDetail,
        props: true,
      },
      {
        path: 'metrics',
        name: 'metrics',
        component: Metrics,
      },
      {
        path: 'data-sources',
        name: 'data-sources',
        component: DataSources,
      },
      {
        path: 'datasets',
        name: 'datasets',
        component: Datasets,
      },
      {
        path: 'automations',
        name: 'automations',
        component: Automations,
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: Notifications,
      },
      {
        path: 'users',
        name: 'users',
        component: UsersRoles,
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: AuditLogs,
      },
      {
        path: 'settings',
        name: 'settings',
        component: Settings,
      },
    ],
  },
  {
    path: '/admin',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'admin',
        component: AdminTenants,
      },
    ],
  },
]

export default analyticsRoutes
