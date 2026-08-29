<template>
  <div class="sidebar-container">
    <h2 class="sidebar-title"><span class="section-seal" aria-hidden="true">册</span>卦例库</h2>
    
    <!-- 标签筛选区 -->
    <div class="tag-filter">
      <button 
        v-for="tag in ['全部', '财运', '感情', '事业', '健康', '学业']" 
        :key="tag" 
        :class="['tag-btn', { active: store.filterTag === tag }]"
        @click="handleTagFilter(tag)"
      >
        {{ tag }}
      </button>
    </div>

    <!-- 卦例列表区 -->
    <div class="guali-list">
      <div 
        v-for="guaLi in store.filteredList" 
        :key="guaLi.id" 
        :class="['guali-item', { active: route.params.id === guaLi.id }]"
        @click="handleLoadGuaLi(guaLi.id)"
      >
        <div class="item-header">
          <span class="date">{{ formatDate(guaLi.time) }}</span>
          <button class="delete-btn" @click.stop="handleDelete(guaLi.id)" title="删除">×</button>
        </div>
        
        <!-- 核心修改：限制行数为2行，多余显示省略号 -->
        <div class="reason" :title="guaLi.reason">
          {{ guaLi.reason || '未命名卦例' }}
        </div>
        
        <div class="gua-name">
          {{ guaLi.benGua.name }} <span v-if="guaLi.bianGua">→ {{ guaLi.bianGua.name }}</span>
        </div>
        <div class="tags">
          <span v-for="tag in guaLi.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="store.filteredList.length === 0" class="empty-list">
        暂无符合条件的卦例
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="sidebar-actions">
      <button class="btn btn-primary" @click="openImportModal">
        导入卦例
      </button>
      <button class="btn btn-secondary" @click="handleExportAll">
        导出所有
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useGuaLiStore } from '@/stores/guaLiStore'

const store = useGuaLiStore()
const router = useRouter()
const route = useRoute()

const handleTagFilter = (tag: string) => {
  store.setFilterTag(tag)
}

const handleLoadGuaLi = (id: string) => {
  router.push(`/gua/${id}`)
}

const handleDelete = (id: string) => {
  if (confirm('确定要删除这条卦例吗？')) {
    store.deleteGuaLi(id)
    if (route.params.id === id) {
      router.push('/')
    }
  }
}

const openImportModal = () => { store.setShowImportModal(true) }

const handleExportAll = () => {
  const backup = store.createBackup()
  const jsonStr = JSON.stringify(backup, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `六爻卦例备份_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const formatDate = (dateInput: Date | string | number) => {
  const date = new Date(dateInput)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}
</script>

<style scoped>
/* 容器 */
.sidebar-container { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  background-color: var(--paper-strong);
  padding: 18px 16px 14px;
  box-sizing: border-box; 
  overflow: hidden; 
}
.sidebar-title { display: flex; align-items: center; gap: 9px; font-family: var(--custom-font); font-size: 18px; font-weight: 700; letter-spacing: 0.08em; margin: 0 0 17px; color: var(--text-color); }
.section-seal { display: inline-grid; place-items: center; width: 25px; height: 25px; border: 1px solid var(--primary-color); border-radius: 50%; color: var(--primary-color); font-size: 12px; font-weight: 400; }

/* 标签 */
.tag-filter { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 17px; }
.tag-btn { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border-soft); background: transparent; color: var(--text-secondary); font-size: 11px; cursor: pointer; transition: all 0.2s; }
.tag-btn:hover { border-color: var(--border-color); color: var(--primary-color); background: var(--primary-soft); }
.tag-btn.active { background: var(--primary-color); color: var(--paper-strong); border-color: var(--primary-color); }

/* 列表区 */
.guali-list { 
  flex: 1; 
  overflow-y: auto; 
  margin-bottom: 16px; 
  padding-right: 4px; 
}

.guali-item { 
  padding: 12px; 
  border-radius: 7px;
  border: 1px solid var(--border-soft);
  margin-bottom: 10px; 
  cursor: pointer; 
  transition: all 0.2s; 
  background: var(--paper-strong);
  position: relative; 
  overflow: hidden; 
}
.guali-item:hover { border-color: var(--border-color); transform: translateY(-1px); box-shadow: 0 4px 12px color-mix(in srgb, var(--shadow-color) 55%, transparent); }
.guali-item.active { border-color: color-mix(in srgb, var(--primary-color) 46%, var(--border-color)); background-color: var(--primary-soft); box-shadow: inset 3px 0 0 var(--primary-color); }

.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.date { font-size: 11px; color: var(--text-muted); }
.delete-btn { background: none; border: none; color: var(--border-color); font-size: 16px; cursor: pointer; padding: 0 4px; }
.delete-btn:hover { color: var(--danger-color); }

/* 
  === 修复重点 ===
  之前的代码这里有个 "!" 号导致错误
*/
.reason { 
  font-weight: bold; 
  color: var(--text-color);
  margin-bottom: 4px; 
  font-size: 14px; 
  
  /* 限制最多显示 2 行 */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 修正了这里的拼写 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  
  /* 强制长单词换行 */
  word-break: break-all; 
  white-space: normal;
}

.gua-name { font-family: var(--custom-font); font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }

.tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tag { background: var(--surface-muted); color: var(--text-muted); font-size: 10px; padding: 2px 6px; border-radius: 3px; }

.empty-list { text-align: center; color: var(--text-muted); padding: 20px 0; font-size: 13px; }

.sidebar-actions { display: flex; flex-direction: column; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border-soft); }
.btn { width: 100%; padding: 9px; border: 1px solid transparent; border-radius: 5px; cursor: pointer; font-size: 13px; letter-spacing: 0.06em; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.btn-primary { background-color: var(--primary-color); color: var(--paper-strong); }
.btn-primary:hover { background-color: var(--primary-hover); }
.btn-secondary { border-color: var(--border-soft); background-color: var(--surface-muted); color: var(--text-secondary); }
.btn-secondary:hover { border-color: var(--border-color); color: var(--primary-color); background-color: var(--paper-strong); }
</style>
