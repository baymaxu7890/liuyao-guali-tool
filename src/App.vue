<template>
  <div class="app-container">
    <!-- 顶部 Header -->
    <div class="header">
      <div class="header-left cursor-pointer" @click="goHome">
        <span class="brand-mark" aria-hidden="true">易</span>
        <div>
          <h1>术数综合排盘</h1>
          <div class="subtitle">观象 · 取时 · 存验</div>
        </div>
      </div>
      
      <div class="header-right-group">
        <!-- 外观控制区 -->
        <div class="appearance-tools">
            <div class="tool-item">
              <label>字体:</label>
              <select v-model="currentFont" @change="updateTheme" class="appearance-select">
                <option value="'Songti SC', 'STSong', 'SimSun', serif">宋体</option>
                <option value="'KaiTi', '楷体', 'STKaiti', serif">楷书</option>
                <option value="'FangSong', '仿宋', 'STFangsong', serif">仿宋</option>
                <option value="'Microsoft YaHei', 'PingFang SC', sans-serif">黑体</option>
              </select>
            </div>

            <div class="tool-item">
              <label>意境:</label>
              <select v-model="currentPalette" @change="updateTheme" class="appearance-select palette-select">
                <option v-for="(palette, key) in themePalettes" :key="key" :value="key">{{ palette.label }}</option>
              </select>
              <span class="palette-dot" :style="{ background: activePalette.primary }" aria-hidden="true"></span>
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
        <span class="module-nav-icon" aria-hidden="true">{{ item.icon }}</span>
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
import { initializeDesktopBackup, queueDesktopBackup } from './services/desktopBackup'

const guaLiStore = useGuaLiStore()
const router = useRouter()
const route = useRoute()

const totalCount = ref(0)
const todayCount = ref(0)
const searchKeyword = ref('')

const moduleNavItems = [
  { key: 'liuyao', label: '六爻', icon: '爻', path: '/' },
  { key: 'calendar', label: '日历', icon: '历', path: '/calendar' },
  { key: 'meihua', label: '梅花', icon: '梅', path: '/meihua', reserved: true },
  { key: 'bazi', label: '八字', icon: '八', path: '/bazi', reserved: true },
  { key: 'qimen', label: '奇门', icon: '门', path: '/qimen', reserved: true },
  { key: 'songs', label: '歌诀', icon: '诀', path: '/songs' },
  { key: 'backup', label: '备份', icon: '存', path: '/backup' }
]

const activeModule = computed(() => String(route.meta.module || 'liuyao'))
const isLiuYaoModule = computed(() => activeModule.value === 'liuyao')

type ThemePalette = {
  label: string
  primary: string
  primaryHover: string
  primarySoft: string
  canvas: string
  paper: string
  paperStrong: string
  surface: string
  border: string
  borderSoft: string
  ink: string
  secondary: string
  muted: string
  danger: string
  success: string
  gold: string
  shadow: string
}

const themePalettes: Record<string, ThemePalette> = {
  xuanzhi: {
    label: '宣纸', primary: '#31564B', primaryHover: '#27483F', primarySoft: '#E5ECE6',
    canvas: '#E7E0D4', paper: '#F8F3E8', paperStrong: '#FFFCF6', surface: '#F1E9DA',
    border: '#D8CDBB', borderSoft: '#E7DFD2', ink: '#29322F', secondary: '#56605B',
    muted: '#8B918C', danger: '#A84D46', success: '#527D62', gold: '#A8864B', shadow: 'rgba(49,43,34,0.12)'
  },
  qingci: {
    label: '青瓷', primary: '#416C68', primaryHover: '#345A57', primarySoft: '#E2ECE9',
    canvas: '#DDE5DF', paper: '#F3F5EE', paperStrong: '#FBFCF7', surface: '#E8EEE8',
    border: '#C7D2C8', borderSoft: '#DEE5DE', ink: '#263633', secondary: '#52635F',
    muted: '#84918D', danger: '#9D4E49', success: '#4E7560', gold: '#998058', shadow: 'rgba(35,57,52,0.12)'
  },
  yuebai: {
    label: '月白', primary: '#455F73', primaryHover: '#374E60', primarySoft: '#E4EAF0',
    canvas: '#E4E7E8', paper: '#F5F5F1', paperStrong: '#FDFDF9', surface: '#EBEDEA',
    border: '#CCD2D4', borderSoft: '#E0E4E4', ink: '#293438', secondary: '#58666B',
    muted: '#899398', danger: '#A2524B', success: '#557565', gold: '#9A825B', shadow: 'rgba(38,50,57,0.12)'
  },
  mushan: {
    label: '暮山', primary: '#5B5366', primaryHover: '#494252', primarySoft: '#ECE7EE',
    canvas: '#E5DFE2', paper: '#F7F2EE', paperStrong: '#FEFAF6', surface: '#EEE7E5',
    border: '#D4C9CD', borderSoft: '#E5DCDE', ink: '#352F37', secondary: '#625A64',
    muted: '#918890', danger: '#A34E49', success: '#5B7663', gold: '#9C8052', shadow: 'rgba(55,43,57,0.13)'
  }
}

const currentPalette = ref('xuanzhi')
const currentFont = ref("'Songti SC', 'STSong', 'SimSun', serif")
const activePalette = computed(() => themePalettes[currentPalette.value] || themePalettes.xuanzhi)

const THEME_PALETTE_KEY = 'user-theme-palette'
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
  const root = document.documentElement
  const palette = activePalette.value
  root.style.setProperty('--primary-color', palette.primary)
  root.style.setProperty('--primary-hover', palette.primaryHover)
  root.style.setProperty('--primary-soft', palette.primarySoft)
  root.style.setProperty('--canvas-bg', palette.canvas)
  root.style.setProperty('--card-bg', palette.paper)
  root.style.setProperty('--paper-strong', palette.paperStrong)
  root.style.setProperty('--surface-muted', palette.surface)
  root.style.setProperty('--border-color', palette.border)
  root.style.setProperty('--border-soft', palette.borderSoft)
  root.style.setProperty('--text-color', palette.ink)
  root.style.setProperty('--text-secondary', palette.secondary)
  root.style.setProperty('--text-muted', palette.muted)
  root.style.setProperty('--danger-color', palette.danger)
  root.style.setProperty('--success-color', palette.success)
  root.style.setProperty('--gold-color', palette.gold)
  root.style.setProperty('--shadow-color', palette.shadow)
  root.style.setProperty('--custom-font', currentFont.value)
  localStorage.setItem(THEME_PALETTE_KEY, currentPalette.value)
  localStorage.setItem(FONT_FAMILY_KEY, currentFont.value)
}

onMounted(() => {
  guaLiStore.loadFromLocalStorage()
  totalCount.value = guaLiStore.totalCount
  todayCount.value = guaLiStore.todayCount
  
  const savedPalette = localStorage.getItem(THEME_PALETTE_KEY)
  if (savedPalette && themePalettes[savedPalette]) currentPalette.value = savedPalette
  
  const savedFont = localStorage.getItem(FONT_FAMILY_KEY)
  if (savedFont) currentFont.value = savedFont

  updateTheme()

  void initializeLocalBackup().then(() => {
    queueLocalBackup(() => guaLiStore.createBackup(), 1200)
  })
  void initializeDesktopBackup().then(() => {
    queueDesktopBackup(() => guaLiStore.createBackup(), 700)
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

<style>
/* 东方极简主题：宣纸为底、墨色为骨、单一传统色点睛。 */
body {
  padding: 16px;
  color: var(--text-color);
  background:
    radial-gradient(circle at 8% 12%, color-mix(in srgb, var(--paper-strong) 55%, transparent) 0, transparent 28%),
    radial-gradient(circle at 92% 88%, color-mix(in srgb, var(--primary-color) 9%, transparent) 0, transparent 34%),
    var(--canvas-bg);
}

.app-container {
  position: relative;
  max-width: 1480px;
  height: calc(100vh - 32px);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border-color) 86%, white);
  border-radius: 14px;
  background: color-mix(in srgb, var(--card-bg) 96%, white);
  box-shadow: 0 18px 52px var(--shadow-color);
}

.header {
  min-height: 92px;
  padding: 16px 26px;
  color: var(--text-color);
  background: color-mix(in srgb, var(--paper-strong) 94%, transparent);
  border-bottom: 1px solid var(--border-soft);
}

.header-left { display: flex; align-items: center; gap: 13px; }
.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border: 1px solid var(--primary-color);
  border-radius: 50%;
  color: var(--paper-strong);
  background: var(--primary-color);
  font-family: var(--custom-font);
  font-size: 22px;
  line-height: 1;
  box-shadow: inset 0 0 0 3px var(--paper-strong);
}
.header h1 {
  margin: 0;
  color: var(--text-color);
  font-family: var(--custom-font);
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.header .subtitle { margin-top: 4px; color: var(--text-muted); font-size: 12px; letter-spacing: 0.28em; }
.header-right-group { gap: 16px; }
.appearance-tools {
  gap: 13px;
  padding: 7px 11px;
  border: 1px solid var(--border-soft);
  border-radius: 9px;
  color: var(--text-secondary);
  background: var(--surface-muted);
}
.tool-item { position: relative; gap: 6px; color: var(--text-secondary); font-size: 12px; }
.tool-item label { color: var(--text-muted); font-weight: 500; }
.appearance-select {
  min-width: 74px;
  padding: 4px 24px 4px 7px;
  border: 0;
  border-radius: 4px;
  outline: 0;
  color: var(--text-color);
  background: var(--paper-strong);
  font-size: 12px;
  cursor: pointer;
}
.palette-select { min-width: 68px; padding-left: 22px; }
.palette-dot {
  position: absolute;
  left: 52px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--paper-strong);
  pointer-events: none;
}
.stats { gap: 9px; }
.stat-item {
  min-width: 78px;
  padding: 9px 13px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: var(--paper-strong);
  box-shadow: none;
}
.stat-item .label { color: var(--text-muted); font-size: 11px; }
.stat-item .value { margin-top: 1px; color: var(--text-color); font-family: var(--custom-font); font-size: 19px; }

.module-nav {
  gap: 2px;
  padding: 0 22px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--paper-strong);
}
.module-nav-item {
  min-width: 88px;
  padding: 11px 13px 10px;
  border-bottom-width: 2px;
  color: var(--text-secondary);
  font-size: 14px;
}
.module-nav-item:hover { color: var(--primary-color); background: var(--primary-soft); }
.module-nav-item.active { color: var(--primary-color); background: transparent; }
.module-nav-icon {
  display: inline-grid;
  place-items: center;
  width: 21px;
  height: 21px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  color: var(--text-secondary);
  font-family: var(--custom-font);
  font-size: 11px;
}
.module-nav-item.active .module-nav-icon { border-color: var(--primary-color); color: var(--paper-strong); background: var(--primary-color); }
.module-nav-item small { background: var(--surface-muted); color: var(--text-muted); }

.search-box { padding: 0 24px; border-bottom: 1px solid var(--border-soft); background: var(--surface-muted); }
.search-input {
  width: 100%;
  margin: 9px 0;
  padding: 11px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-color);
  background: var(--paper-strong);
  box-shadow: 0 3px 12px color-mix(in srgb, var(--shadow-color) 58%, transparent);
}
.search-input::placeholder { color: var(--text-muted); }
.search-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px var(--primary-soft); outline: 0; }

.main-layout { background: var(--surface-muted); }
.sidebar-wrapper {
  width: 304px;
  min-width: 304px;
  max-width: 304px;
  border-right: 1px solid var(--border-soft);
  background: var(--paper-strong);
}
.main-content { background: var(--card-bg); }
.main-content.module-content { background: var(--surface-muted); }

@media (max-width: 900px) {
  body { padding: 0; }
  .app-container { height: 100vh; border: 0; border-radius: 0; }
  .header { min-height: 70px; padding: 10px 14px; }
  .brand-mark { width: 36px; height: 36px; flex-basis: 36px; font-size: 18px; }
  .header h1 { font-size: 19px; }
  .header .subtitle { font-size: 10px; }
  .appearance-tools, .stats { display: none; }
  .module-nav { padding: 0 6px; }
  .module-nav-item { min-width: 72px; padding: 9px 7px 8px; font-size: 13px; }
  .sidebar-wrapper { width: 260px; min-width: 260px; max-width: 260px; }
}
</style>
