import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据概览', icon: 'BarChartOutline' },
  },
  {
    path: '/stations',
    name: 'Stations',
    component: () => import('../views/StationManagement.vue'),
    meta: { title: '基站管理与停电告警', icon: 'BusinessOutline' },
  },
  {
    path: '/generators',
    name: 'Generators',
    component: () => import('../views/GeneratorManagement.vue'),
    meta: { title: '油机与油桶管理', icon: 'FlashOutline' },
  },
  {
    path: '/dispatch',
    name: 'Dispatch',
    component: () => import('../views/DispatchManagement.vue'),
    meta: { title: '派单与执行', icon: 'PaperPlaneOutline' },
  },
  {
    path: '/fuel',
    name: 'Fuel',
    component: () => import('../views/FuelManagement.vue'),
    meta: { title: '燃油消耗与异常', icon: 'WaterOutline' },
  },
  {
    path: '/recovery',
    name: 'Recovery',
    component: () => import('../views/RecoveryManagement.vue'),
    meta: { title: '恢复确认', icon: 'CheckmarkCircleOutline' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
