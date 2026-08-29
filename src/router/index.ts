import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/components/GuaPan.vue'),
      meta: { module: 'liuyao' }
    },
    {
      path: '/gua/:id',
      name: 'GuaDetail',
      component: () => import('@/components/GuaPan.vue'), // 详情页和首页用同一个组件，但根据 Route 参数渲染不同内容
      props: true,
      meta: { module: 'liuyao' }
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('@/views/CalendarWorkspace.vue'),
      meta: { module: 'calendar' }
    },
    {
      path: '/songs',
      name: 'Songs',
      component: () => import('@/views/SongWorkspace.vue'),
      meta: { module: 'songs' }
    },
    {
      path: '/backup',
      name: 'Backup',
      component: () => import('@/views/BackupWorkspace.vue'),
      meta: { module: 'backup' }
    },
    {
      path: '/meihua',
      name: 'MeiHua',
      component: () => import('@/views/ReservedModuleWorkspace.vue'),
      meta: {
        module: 'meihua',
        title: '梅花易数',
        icon: '梅',
        description: '预留梅花起卦、互卦变卦、体用生克与案例管理能力。'
      }
    },
    {
      path: '/bazi',
      name: 'BaZi',
      component: () => import('@/views/ReservedModuleWorkspace.vue'),
      meta: {
        module: 'bazi',
        title: '八字排盘',
        icon: '八',
        description: '预留四柱、大运流年、十神旺衰与命例管理能力。'
      }
    },
    {
      path: '/qimen',
      name: 'QiMen',
      component: () => import('@/views/ReservedModuleWorkspace.vue'),
      meta: {
        module: 'qimen',
        title: '奇门遁甲',
        icon: '门',
        description: '预留阴阳遁、局数、九宫盘、九星八门八神与案例管理能力。'
      }
    }
  ]
})

export default router
