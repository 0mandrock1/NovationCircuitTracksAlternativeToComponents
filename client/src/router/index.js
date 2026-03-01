import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/patches' },
  { path: '/patches', component: () => import('@/views/PatchesView.vue') },
  { path: '/samples', component: () => import('@/views/SamplesView.vue') },
  { path: '/sequencer', component: () => import('@/views/SequencerView.vue') },
  { path: '/mixer', component: () => import('@/views/MixerView.vue') },
  { path: '/midi', component: () => import('@/views/MidiView.vue') },
  { path: '/sessions', component: () => import('@/views/SessionsView.vue') },
  { path: '/device', component: () => import('@/views/DeviceView.vue') },
  { path: '/midi-ref', component: () => import('@/views/MidiRefView.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
