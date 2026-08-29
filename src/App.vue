<template>
  <div class="app-container" :style="{ backgroundColor: cardBgColor }">
    <!-- 顶部 Header -->
    <div class="header">
      <div class="header-left cursor-pointer" @click="goHome">
        <h1>🔮 术数综合排盘工具</h1>
        <div class="subtitle">日历 · 六爻 · 多术数工作台</div>
      </div>
      
      <div class="header-right-group">
        <!-- 外观控制区 -->
        <div class="appearance-tools">
            <div class="tool-item">
              <label>字体:</label>
              <select v-model="currentFont" @change="updateTheme" class="font-select">
                <option value="'KaiTi', '楷体', 'STKaiti', serif">楷书</option>
                <option value="'Microsoft YaHei', sans-serif">默认黑体</option>
                <option value="'SimSun', '宋体', 'STSong', serif">宋体</option>
                <option value="'FangSong', '仿宋', 'STFangsong', serif">仿宋</option>
                <option value="'STXingkai', '华文行楷', 'Xingkai SC', cursive">行楷</option>
              </select>
            </div>

            <div class="tool-item">
              <label>主题:</label>
              <input type="color" v-model="primaryColor" @input="updateTheme" class="color-input">
            </div>
            <div class="tool-item">
              <label>底色:</label>
              <input type="color" v-model="cardBgColor" @input="updateTheme" class="color-input">
            </div>
        </div>
        
        <div class="stats">
          <div class="stat-item">
            <div class="label">总卦例</div>
            <div class="value">{{ totalCount }}</div>
          </div>
          <div class="stat-item">
            <div class="label">今日新增</div>
            <div class="value">{{ todayCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 综合排盘一级模块导航 -->
    <nav class="module-nav" aria-label="综合排盘模块">
      <button
        v-for="item in moduleNavItems"
        :key="item.key"
        :class="['module-nav-item', { active: activeModule === item.key }]"
        @click="router.push(item.path)"
      >
        <span class="module-nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <small v-if="item.reserved">预留</small>
      </button>
    </nav>

    <!-- 搜索栏 -->
    <div class="search-box" v-if="isLiuYaoModule">
      <input type="text" v-model="searchKeyword" placeholder="搜索卦例..." class="search-input" />
    </div>

    <!-- 核心布局：左侧列表 + 右侧内容 -->
    <div class="main-layout">
      <!-- 左侧边栏容器 -->
      <aside class="sidebar-wrapper" v-if="isLiuYaoModule">
        <GuaLiList />
      </aside>

      <!-- 右侧主内容 -->
      <main :class="['main-content', { 'module-content': !isLiuYaoModule }]">
        <router-view :key="$route.fullPath" />
      </main>
    </div>

    <ImportGuaLiModal />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuaLiStore } from './stores/guaLiStore'
import GuaLiList from './components/GuaLiList.vue'
import ImportGuaLiModal from './components/ImportGuaLiModal.vue'
import { initializeLocalBackup, queueLocalBackup } from './services/localBackup'
import { queueCloudBackup } from './services/cloudBackup'

const guaLiStore = useGuaLiStore()
const router = useRouter()
const route = useRoute()

const totalCount = ref(0)
const todayCount = ref(0)
const searchKeyword = ref('')

const moduleNavItems = [
  { key: 'liuyao', label: '六爻', icon: '☯', path: '/' },
  { key: 'calendar', label: '日历', icon: '📅', path: '/calendar' },
  { key: 'meihua', label: '梅花', icon: '🌸', path: '/meihua', reserved: true },
  { key: 'bazi', label: '八字', icon: '🧾', path: '/bazi', reserved: true },
  { key: 'qimen', label: '奇门', icon: '🧭', path: '/qimen', reserved: true },
  { key: 'songs', label: '歌诀', icon: '📜', path: '/songs' },
  { key: 'backup', label: '备份', icon: '☁️', path: '/backup' }
]

const activeModule = computed(() => String(route.meta.module || 'liuyao'))
const isLiuYaoModule = computed(() => activeModule.value === 'liuyao')

// 外观设置
const primaryColor = ref('#667eea') 
const cardBgColor = ref('#ffffff') 
// 默认字体修改为楷书
const currentFont = ref("'KaiTi', '楷体', 'STKaiti', serif")

// 定义持久化 Key
const THEME_COLOR_KEY = 'user-theme-color'
const CARD_BG_KEY = 'user-card-bg'
const FONT_FAMILY_KEY = 'user-font-family'

watch(searchKeyword, (newVal) => {
  guaLiStore.setSearchKeyword(newVal)
})

watch(() => guaLiStore.guaLiList.length, () => {
  totalCount.value = guaLiStore.totalCount
  todayCount.value = guaLiStore.todayCount
})

const goHome = () => { router.push('/') }

const updateTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', primaryColor.value)
  root.style.setProperty('--card-bg', cardBgColor.value)
  root.style.setProperty('--custom-font', currentFont.value)
  
  localStorage.setItem(THEME_COLOR_KEY, primaryColor.value)
  localStorage.setItem(CARD_BG_KEY, cardBgColor.value)
  localStorage.setItem(FONT_FAMILY_KEY, currentFont.value)

  // 简单的文字反色逻辑
  const hex = cardBgColor.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  if (brightness < 128) {
      root.style.setProperty('--text-color', '#f0f0f0');
  } else {
      root.style.setProperty('--text-color', '#333333');
  }
}

onMounted(() => {
  guaLiStore.loadFromLocalStorage()
  totalCount.value = guaLiStore.totalCount
  todayCount.value = guaLiStore.todayCount
  
  const savedPrimary = localStorage.getItem(THEME_COLOR_KEY)
  if (savedPrimary) primaryColor.value = savedPrimary
  
  const savedBg = localStorage.getItem(CARD_BG_KEY)
  if (savedBg) cardBgColor.value = savedBg
  
  const savedFont = localStorage.getItem(FONT_FAMILY_KEY)
  if (savedFont) currentFont.value = savedFont

  updateTheme()

  void initializeLocalBackup().then(() => {
    queueLocalBackup(() => guaLiStore.createBackup(), 1200)
  })
  queueCloudBackup(() => guaLiStore.createBackup(), 1500)
})
</script>

<style>
/* 
  全局样式重置 
  (保持原来的渐变背景和字体设置)
*/
* { margin: 0; padding: 0; box-sizing: border-box; }

body { 
  background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%); 
  min-height: 100vh; 
  padding: 20px; 
  color: var(--text-color); 
  font-family: var(--custom-font); 
  overflow: hidden; /* 防止body滚动 */
}

/* App 容器：悬浮卡片效果 */
.app-container { 
  max-width: 1400px; 
  margin: 0 auto; 
  background: var(--card-bg); 
  border-radius: 5px; 
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); 
  height: 90vh; /* 固定高度，占屏幕90% */
  display: flex; 
  flex-direction: column; 
  overflow: hidden; /* 防止容器溢出 */
  transition: background-color 0.3s;
}

/* 顶部 Header */
.header { 
  background: linear-gradient(135deg, var(--primary-color) 0%, #4c51bf 100%); 
  color: white; 
  padding: 20px 30px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  flex-shrink: 0; 
}
.header h1 { font-size: 28px; font-weight: bold; display: flex; align-items: center; gap: 10px; }
.cursor-pointer { cursor: pointer; }
.header .subtitle { font-size: 14px; opacity: 0.9; }
.header-right-group { display: flex; align-items: center; gap: 20px; }

/* 综合排盘模块导航 */
.module-nav { display: flex; align-items: stretch; gap: 4px; padding: 0 24px; border-bottom: 1px solid rgba(0,0,0,0.08); background: rgba(255,255,255,0.9); flex-shrink: 0; overflow-x: auto; }
.module-nav-item { position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; min-width: 92px; padding: 13px 14px 11px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: #718096; font-family: inherit; font-size: 15px; cursor: pointer; white-space: nowrap; transition: 0.2s; }
.module-nav-item:hover { color: var(--primary-color); background: rgba(102, 126, 234, 0.06); }
.module-nav-item.active { border-bottom-color: var(--primary-color); color: var(--primary-color); background: rgba(102, 126, 234, 0.09); font-weight: bold; }
.module-nav-icon { font-size: 16px; }
.module-nav-item small { padding: 1px 4px; border-radius: 3px; background: #edf2f7; color: #a0aec0; font-family: sans-serif; font-size: 9px; font-weight: normal; }
.module-nav-item.active small { background: rgba(102, 126, 234, 0.16); color: var(--primary-color); }

/* 外观工具栏 */
.appearance-tools { display: flex; gap: 10px; background: rgba(255,255,255,0.15); padding: 5px 15px; border-radius: 30px; }
.tool-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: white;}
.tool-item label { font-weight: bold; }
.color-input { border: none; width: 20px; height: 20px; cursor: pointer; background: none; padding: 0; border-radius: 4px;}
.font-select { background: rgba(255,255,255,0.9); border: none; border-radius: 4px; padding: 2px 5px; font-size: 12px; color: #333; cursor: pointer; outline: none;}

/* 统计数据 */
.stats { display: flex; gap: 20px; }
.stat-item { background: rgba(255,255,255,0.9); padding: 12px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }
.stat-item .label { font-size: 12px; color: #6c757d; }
.stat-item .value { font-size: 20px; font-weight: bold; color: var(--primary-color); }

/* 搜索栏 */
.search-box { padding: 0 30px; background: rgba(0,0,0,0.03); border-bottom: 1px solid rgba(0,0,0,0.05); flex-shrink: 0;}
.search-input { width: 100%; padding: 12px 20px; border-radius: 30px; border: none; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); transition: all 0.3s; width: calc(100% - 40px); margin: 10px 0; background: #fff; }
.search-input:focus { outline: none; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }

/* 
   === 核心布局修复 ===
   (这里是修复侧边栏无限变宽的关键代码) 
*/
.main-layout { 
  display: flex; 
  flex: 1; /* 占满剩余高度 */
  overflow: hidden; /* 防止整体出现滚动条 */
}

/* 左侧边栏：强制固定宽度 */
.sidebar-wrapper {
  width: 320px;      /* 强制宽度 */
  min-width: 320px;  /* 最小宽度 */
  max-width: 320px;  /* 最大宽度 */
  flex-shrink: 0;    /* 禁止压缩 */
  height: 100%;
  overflow: hidden;  /* 内部组件控制滚动 */
  border-right: 1px solid rgba(0,0,0,0.05);
}

/* 右侧内容：自适应剩余空间 */
.main-content { 
  flex: 1;           /* 占据剩余空间 */
  min-width: 0;      /* 防止flex子项溢出 */
  height: 100%;
  overflow-y: auto;  /* 允许垂直滚动 */
  position: relative; 
}
.main-content.module-content { background: rgba(247, 250, 252, 0.68); }

@media (max-width: 900px) {
  body { padding: 0; }
  .app-container { height: 100vh; border-radius: 0; }
  .header { padding: 14px 18px; }
  .header h1 { font-size: 22px; }
  .appearance-tools, .stats { display: none; }
  .module-nav { padding: 0 8px; }
  .module-nav-item { min-width: 78px; padding-left: 9px; padding-right: 9px; }
  .sidebar-wrapper { width: 270px; min-width: 270px; max-width: 270px; }
}
</style>
