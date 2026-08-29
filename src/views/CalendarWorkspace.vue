<template>
  <section class="workspace-page">
    <div class="workspace-heading">
      <div>
        <span class="workspace-kicker">综合排盘 · 日历模块</span>
        <h2><span class="heading-mark" aria-hidden="true">历</span>日历与干支反查</h2>
        <p>公历、农历、节气、日课信息，以及遵循历法关系的年、月、日干支反查。</p>
      </div>
      <span class="ready-badge">可用</span>
    </div>
    <WanNianLiPanel />
  </section>
</template>

<script setup lang="ts">
import WanNianLiPanel from '@/components/WanNianLiPanel.vue'
</script>

<style scoped>
.workspace-page { max-width: 1080px; margin: 0 auto; padding: 24px; }
.workspace-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 16px; padding: 20px 22px; border: 1px solid rgba(102, 126, 234, 0.16); border-radius: 10px; background: rgba(255, 255, 255, 0.82); }
.workspace-kicker { color: var(--primary-color); font-size: 13px; font-weight: bold; }
.workspace-heading h2 { margin: 5px 0 6px; color: #2d3748; font-size: 25px; }
.workspace-heading p { margin: 0; color: #718096; font-size: 14px; line-height: 1.6; }
.ready-badge { flex-shrink: 0; padding: 4px 10px; border-radius: 999px; background: #e6fffa; color: #2f855a; font-size: 12px; font-weight: bold; }
</style>

<style scoped>
.workspace-page { max-width: 1120px; padding: 26px; }
.workspace-heading { margin-bottom: 18px; padding: 22px 24px; border-color: var(--border-soft); border-radius: 9px; background: var(--card-bg); box-shadow: 0 6px 18px color-mix(in srgb, var(--shadow-color) 34%, transparent); }
.workspace-kicker { color: var(--gold-color); font-size: 12px; letter-spacing: 0.12em; }
.workspace-heading h2 { display: flex; align-items: center; gap: 10px; color: var(--text-color); font-family: var(--custom-font); font-size: 24px; letter-spacing: 0.05em; }
.heading-mark { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: var(--paper-strong); background: var(--primary-color); font-size: 12px; }
.workspace-heading p { color: var(--text-secondary); }
.ready-badge { color: var(--success-color); background: color-mix(in srgb, var(--success-color) 10%, var(--paper-strong)); }
</style>
