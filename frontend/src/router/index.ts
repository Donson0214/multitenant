import { createRouter, createWebHistory } from 'vue-router'
import analyticsRoutes from './analytics.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/analytics/dashboards' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/Register.vue'),
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../views/auth/Onboarding.vue'),
    },
    ...analyticsRoutes,
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
