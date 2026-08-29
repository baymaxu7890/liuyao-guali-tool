<template>
  <section class="reserved-page">
    <div class="reserved-card">
      <div class="module-icon">{{ moduleIcon }}</div>
      <span class="reserved-badge">功能接口已预留</span>
      <h2>{{ moduleTitle }}</h2>
      <p>{{ moduleDescription }}</p>

      <div class="reserved-structure">
        <div><strong>独立入口</strong><span>已建立专属路由，不会与六爻排盘互相耦合</span></div>
        <div><strong>共享能力</strong><span>可复用日历、干支反查、歌诀库与主题设置</span></div>
        <div><strong>后续扩展</strong><span>排盘表单、盘面计算与案例库可分别接入</span></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const moduleTitle = computed(() => String(route.meta.title || '术数模块'))
const moduleIcon = computed(() => String(route.meta.icon || '🧭'))
const moduleDescription = computed(() => String(route.meta.description || '该模块将在后续版本中接入。'))
</script>

<style scoped>
.reserved-page { display: flex; align-items: center; justify-content: center; min-height: 100%; padding: 32px; }
.reserved-card { width: min(720px, 100%); padding: 48px; border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 16px; background: rgba(255, 255, 255, 0.86); box-shadow: 0 15px 45px rgba(45, 55, 72, 0.08); text-align: center; }
.module-icon { margin-bottom: 12px; font-size: 54px; }
.reserved-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #edf2ff; color: var(--primary-color); font-size: 12px; font-weight: bold; }
.reserved-card h2 { margin: 14px 0 8px; color: #2d3748; font-size: 30px; }
.reserved-card > p { color: #718096; line-height: 1.7; }
.reserved-structure { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 30px; text-align: left; }
.reserved-structure div { padding: 16px; border-radius: 8px; background: #f7fafc; }
.reserved-structure strong, .reserved-structure span { display: block; }
.reserved-structure strong { margin-bottom: 6px; color: #4a5568; }
.reserved-structure span { color: #718096; font-size: 13px; line-height: 1.5; }
@media (max-width: 720px) { .reserved-card { padding: 28px 20px; } .reserved-structure { grid-template-columns: 1fr; } }
</style>
