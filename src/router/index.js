import { createRouter, createWebHistory } from 'vue-router'
import Upload from '../views/upload.vue'
import Result from '../views/result.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/upload' },
    { path: '/upload', name: 'upload', component: Upload },
    { path: '/result', name: 'result', component: Result }
  ]
})

export default router