<template>
  <div class="gua-pan-container">
    
    <!-- =========================
         1. 起卦表单区 (Form Area)
         ========================= -->
    <div class="pan-header card" v-if="isFormMode && !isDemoMode">
      <div class="form-section">
        <h2 class="form-title-main"><span class="title-ornament" aria-hidden="true">爻</span>开始排盘</h2>
        
        <!-- 基础信息 -->
        <div class="form-group">
          <label class="form-label required">问念 (占卜事项)</label>
          <input type="text" v-model="reasonInput" class="form-input full-width" placeholder="请输入您想占卜的具体事情..." />
        </div>

        <div class="form-group">
          <label class="form-label">求测人性别</label>
          <div class="radio-group-styled">
            <label :class="['radio-btn', { active: genderInput === '男' }]">
              <input type="radio" v-model="genderInput" value="男" class="hidden-radio"> 
              男
            </label>
            <label :class="['radio-btn', { active: genderInput === '女' }]">
              <input type="radio" v-model="genderInput" value="女" class="hidden-radio"> 
              女
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">问念分类</label>
          <div class="select-wrapper">
            <select v-model="categoryInput" class="form-select full-width">
              <option value="">请选择...</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">起卦时间</label>
          <!-- 修改说明：添加了 max 属性限制最大年份为9999年 -->
          <input type="datetime-local" v-model="dateInput" class="form-input" max="9999-12-31T23:59" />
        </div>

        <!-- 起卦方式切换 -->
        <div class="form-group">
          <label class="form-label">起卦方式</label>
          <div class="mode-tabs">
            <button :class="['tab-btn', { active: castMode === 'coin' }]" @click="castMode = 'coin'">硬币背数</button>
            <button :class="['tab-btn', { active: castMode === 'manual' }]" @click="castMode = 'manual'">手动指定</button>
            <button :class="['tab-btn', { active: castMode === 'time' }]" @click="castMode = 'time'">时间起卦</button>
            <button :class="['tab-btn', { active: castMode === 'single_num' }]" @click="castMode = 'single_num'">单数</button>
            <button :class="['tab-btn', { active: castMode === 'double_num' }]" @click="castMode = 'double_num'">双数</button>
            <button :class="['tab-btn', { active: castMode === 'kanji' }]" @click="castMode = 'kanji'">汉字</button>
            <button :class="['tab-btn', { active: castMode === 'name' }]" @click="castMode = 'name'">卦名</button>
          </div>
        </div>

        <!-- 动态输入区域 -->
        <div class="method-input-area">
          <!-- 1. 硬币 -->
          <div v-if="castMode === 'coin'" class="method-box">
            <p class="tip">请输入6次硬币背面的数量（0, 1, 2, 3）。</p>
            <p class="tip-sm">说明：1背=少阳(—)，2背=少阴(--)，3背=老阳(O)，0背=老阴(X)</p>
            <input type="text" v-model="coinInput" placeholder="例如: 113032" class="form-input full-width input-lg" maxlength="6">
          </div>
          
          <!-- 2. 手动指定 -->
          <div v-if="castMode === 'manual'" class="method-box manual-selector">
            <div class="manual-preview-bar">
               <div class="preview-item">
                 <span class="p-label">本卦:</span>
                 <span class="p-value">{{ manualPreviewData.ben }}</span>
               </div>
               <div class="preview-item">
                 <span class="p-label">变卦:</span>
                 <span class="p-value">{{ manualPreviewData.bian }}</span>
               </div>
            </div>
            <div class="manual-row header-row">
              <span class="col-label">爻位</span>
              <span class="col-bar">阴阳 (点击切换)</span>
              <span class="col-check">变爻</span>
            </div>
            <div v-for="i in 6" :key="i" class="manual-row">
              <span class="col-label">{{ ['上', '五', '四', '三', '二', '初'][i-1] }}爻</span>
              <div class="col-bar" @click="toggleManualYao(6-i)">
                <!-- 阴阳条 -->
                <div :class="['bar-visual', manualYaos[6-i].type === 2 ? 'yin' : 'yang']"></div>
              </div>
              <div class="col-check">
                 <label class="check-container">
                    <input type="checkbox" v-model="manualYaos[6-i].isMoving">
                    <span class="checkmark"></span>
                    <span class="check-text">动</span>
                 </label>
              </div>
            </div>
          </div>

          <!-- 3. 时间/数字/汉字/卦名 -->
          <div v-if="castMode === 'time'" class="method-box">
            <p class="tip">使用设置的时间自动起卦。</p>
            <p style="font-size:13px; opacity: 0.8; background:rgba(0,0,0,0.05); padding:8px; border-radius:4px;">
              💡 提示：将根据年月日时计算梅花数。请确保上方“起卦时间”准确。
            </p>
          </div>
          <div v-if="castMode === 'single_num'" class="method-box"><input type="text" v-model="singleNumInput" placeholder="输入数字..." class="form-input full-width input-lg"></div>
          <div v-if="castMode === 'double_num'" class="method-box">
            <input type="text" v-model="doubleNum1" placeholder="上卦数" class="form-input input-lg" style="width:48%">
            <input type="text" v-model="doubleNum2" placeholder="下卦数" class="form-input input-lg" style="width:48%">
          </div>
          <div v-if="castMode === 'kanji'" class="method-box"><p class="tip">输入汉字（2字以上）。</p><input type="text" v-model="kanjiInput" placeholder="输入汉字..." class="form-input full-width input-lg"></div>
          <div v-if="castMode === 'name'" class="method-box">
            <div class="gua-select-row"><label>本卦:</label><select v-model="selectedBenGuaName" class="form-select"><option v-for="g in GUA_NAMES" :key="g" :value="g">{{ g }}</option></select></div>
            <div class="gua-select-row"><label>变卦:</label><select v-model="selectedBianGuaName" class="form-select"><option v-for="g in GUA_NAMES" :key="g" :value="g">{{ g }}</option></select></div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary btn-block-lg" @click="handleCast">开始排盘</button>
          <button class="btn btn-light btn-block-lg" @click="handleClear">清空</button>
        </div>
      </div>
    </div>

    <!-- =========================
         2. 排盘结果区 (Result Area)
         ========================= -->
    <div v-else-if="currentGuaLi" class="result-container card">
      <!-- 顶部操作栏 -->
      <div class="result-top-bar" v-if="!isDemoMode">
         <button class="btn btn-sm btn-subtle" @click="handleBackToHome">‹ 返回</button>
         <div class="right-actions">
           <button class="btn btn-sm btn-subtle" @click="handleResetView">↺ 重置视图</button>
           <button class="btn btn-sm btn-danger-soft" @click="handleDeleteCurrent">删除</button>
         </div>
      </div>

      <div v-if="isDemoMode" class="demo-exit-float" @click="isDemoMode = false" title="点击退出演示">❌</div>

      <!-- 信息头 (时间、干支、神煞) -->
      <div class="clean-info-box">
        <h3 class="reason-title">
           <span class="title-bar"></span>
           求测：<span class="reason-text">{{ currentGuaLi.reason }}</span>
           <span class="id-tag" v-if="!isDemoMode">#{{ currentGuaLi.id.slice(-4) }}</span>
        </h3>
        
        <div class="info-grid">
          <div class="info-item full-row">
            <span class="label">时间:</span>
            <span class="value">{{ formatDateFull(currentGuaLi.time) }}</span>
          </div>
          <div class="info-item" v-if="!isDemoMode">
             <span class="label">分类:</span>
             <span class="value">{{ currentGuaLi.category || '无' }}</span>
             <span class="value" style="margin-left:10px">{{ currentGuaLi.gender }}</span>
          </div>
          
          <div class="info-item full-row">
            <span class="label">干支:</span>
            <span class="value bazi">{{ currentGuaLi.bazi }}</span>
            <span class="value kongwang">(旬空: {{ currentGuaLi.xunkong }})</span>
          </div>

          <div class="info-item full-row shensha-wrapper">
            <span class="label">神煞:</span>
            <div class="shensha-list">
               <span v-for="ss in currentGuaLi.shenshaList" :key="ss" class="ss-tag clickable" @click="showExplanation(ss.split('-')[0])">{{ ss }}</span>
            </div>
          </div>
        </div>
      </div>

      <hr class="divider-light" />

      <!-- === 3. 卦象可视化核心区 === -->
      <div class="gua-visual-area">
        <div class="gua-visual-container">
            <!-- 卦名行 -->
            <div :class="['visual-header-row', { 'is-static-view': isStaticView }]">
                <div class="head-col head-liushen"></div> 
                <div class="head-col head-cangyao"></div> 
                
                <div class="head-col head-ben">
                    <div class="gua-title-wrap">
                        <span class="gua-name-lg clickable" @click="showExplanation(currentGuaLi.benGua.name)">{{ currentGuaLi.benGua.name }}</span>
                        <span class="gua-meta">
                           (<span class="clickable" @click="showExplanation(currentGuaLi.benGua.palace)">{{ currentGuaLi.benGua.palace }}</span>
                            -
                            <span class="clickable" @click="showExplanation(currentGuaLi.benGua.type)">{{ currentGuaLi.benGua.type }}</span>)
                        </span>
                    </div>
                </div>

                <div class="head-col head-spacer"></div>

                <div class="head-col head-bian" v-if="!isStaticView">
                    <div class="gua-title-wrap">
                        <span class="gua-name-lg clickable" @click="showExplanation((currentGuaLi.bianGua || currentGuaLi.benGua).name)">
                            {{ (currentGuaLi.bianGua || currentGuaLi.benGua).name }}
                        </span>
                        <span class="gua-meta">
                            (<span class="clickable" @click="showExplanation((currentGuaLi.bianGua || currentGuaLi.benGua).palace)">
                                {{ (currentGuaLi.bianGua || currentGuaLi.benGua).palace }}
                            </span>
                             - 
                             <span class="clickable" @click="showExplanation((currentGuaLi.bianGua || currentGuaLi.benGua).type)">
                                {{ (currentGuaLi.bianGua || currentGuaLi.benGua).type }}
                            </span>)
                        </span>
                    </div>
                </div>
            </div>

            <!-- 爻层堆叠 (Yao Stack) -->
            <div class="yao-stack">
                <div v-for="yao in [...currentGuaLi.benGua.yaos].reverse()" :key="yao.position" :class="['yao-row', { 'is-static-view': isStaticView }]">
                    
                    <!-- 列1: 六神 -->
                    <div class="col-fixed-liushen clickable" @click="showExplanation(yao.liushen)">{{ yao.liushen }}</div>

                    <!-- 列2: 伏神/藏爻 -->
                    <div class="col-fixed-cangyao">
                        <template v-if="currentGuaLi.cangYaoList[yao.position - 1]">
                             <span 
                               v-if="currentGuaLi.cangYaoList[yao.position - 1]?.isFu || (showHiddenYao && currentGuaLi.cangYaoList[yao.position - 1]?.show)"
                               :class="['cang-yao', { 'is-fu': currentGuaLi.cangYaoList[yao.position - 1]?.isFu }]"
                             >
                                <span class="clickable" @click.stop="showExplanation(currentGuaLi.cangYaoList[yao.position - 1]?.liuqin || '')">
                                    {{ currentGuaLi.cangYaoList[yao.position - 1]?.liuqin }}
                                </span>
                                <span class="gap-text">&nbsp;</span>
                                <span class="clickable" @click.stop="showExplanation(currentGuaLi.cangYaoList[yao.position - 1]?.dizhi || '')">
                                    <span class="dizhi-text">{{ currentGuaLi.cangYaoList[yao.position - 1]?.dizhi }}</span>{{ getWuXing(currentGuaLi.cangYaoList[yao.position - 1]?.dizhi || '') }}
                                </span>
                            </span>
                        </template>
                    </div>

                    <!-- 列3: 本卦 (爻条、地支、世应) -->
                    <div class="col-ben-group">
                        <div class="cell-text align-right">
                            <div class="main-text">
                                <span class="clickable" @click.stop="showExplanation(yao.liuqin)">{{ yao.liuqin }}</span>
                                <span class="gap-text">&nbsp;</span>
                                <span class="clickable" @click.stop="showExplanation(yao.dizhi)">
                                    <span class="dizhi-text">{{ yao.dizhi }}</span>{{ getWuXing(yao.dizhi) }}
                                </span>
                            </div>
                        </div>
                        <div class="cell-bar">
                            <div :class="['css-bar', (yao.type === 2 || (yao.type as number) === 0 || yao.type === 4) ? 'yin' : 'yang', (yao.type === 3 || (yao.type as number) === 0 || yao.type === 4) ? 'moving-red' : '' ]">
                                <template v-if="yao.type === 2 || (yao.type as number) === 0 || yao.type === 4">
                                   <div class="seg"></div>
                                   <div class="gap"></div>
                                   <div class="seg"></div>
                                </template>
                                <template v-else>
                                    <div class="seg full"></div>
                                </template>
                            </div>
                        </div>
                        
                        <!-- 标记区域 (世应、动爻符号、神煞标记) -->
                        <div class="cell-markers">
                            <div class="marker-primary-slot" v-if="yao.isShi || yao.isYing || yao.type === 3 || (yao.type as number) === 0 || yao.type === 4">
                                <span v-if="yao.isShi" class="badge badge-shi clickable" @click.stop="showExplanation('世')">世</span>
                                <span v-else-if="yao.isYing" class="badge badge-ying clickable" @click.stop="showExplanation('应')">应</span>
                                
                                <span v-if="yao.type === 3" class="move-symbol o"></span>
                                <span v-if="(yao.type as number) === 0 || yao.type === 4" class="move-symbol x">X</span>
                            </div>

                            <div class="marker-secondary-slot">
                                <span v-if="(yao as any).tags.includes('月破')" class="mini-txt-tag red clickable" @click.stop="showExplanation('月破')">月破</span>
                                <span v-if="(yao as any).tags.includes('暗动')" class="mini-txt-tag green clickable" @click.stop="showExplanation('暗动')">暗动</span>
                                <span v-if="(yao as any).tags.includes('日破')" class="mini-txt-tag orange clickable" @click.stop="showExplanation('日破')">日破</span>
                                <span v-if="(yao as any).tags.includes('空亡')" class="mini-txt-tag grey clickable" @click.stop="showExplanation('旬空')">旬空</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-spacer"></div>

                    <!-- 列4: 变卦 -->
                    <div class="col-bian-group" v-if="!isStaticView">
                        <template v-if="(currentGuaLi.bianGua && (showAllBianYao || isDongYaoPosition(yao.position))) || (isStaticGua && showAllBianYao)">
                            <div class="cell-text align-right">
                                <div class="main-text muted">
                                    <span class="clickable" @click.stop="showExplanation(getDisplayBianYao(yao).liuqin)">{{ getDisplayBianYao(yao).liuqin }}</span>
                                    <span class="gap-text">&nbsp;</span>
                                    <span class="clickable" @click.stop="showExplanation(getDisplayBianYao(yao).dizhi)">
                                        <span class="dizhi-text">{{ getDisplayBianYao(yao).dizhi }}</span>{{ getWuXing(getDisplayBianYao(yao).dizhi) }}
                                    </span>
                                </div>
                            </div>
                            <div class="cell-bar">
                                <div :class="['css-bar small', (getDisplayBianYao(yao).type === 2 || (getDisplayBianYao(yao).type as number) === 0 || getDisplayBianYao(yao).type === 4) ? 'yin' : 'yang']">
                                    <template v-if="getDisplayBianYao(yao).type === 2 || (getDisplayBianYao(yao).type as number) === 0 || getDisplayBianYao(yao).type === 4">
                                      <div class="seg"></div>
                                      <div class="gap"></div>
                                      <div class="seg"></div>
                                    </template>
                                    <template v-else>
                                      <div class="seg full"></div>
                                    </template>
                                </div>
                            </div>
                            <div class="cell-markers">
                                <div class="marker-primary-slot" v-if="getDisplayBianYao(yao).isShi || getDisplayBianYao(yao).isYing">
                                    <span v-if="getDisplayBianYao(yao).isShi" class="badge badge-shi clickable" @click.stop="showExplanation('世')">世</span>
                                    <span v-else-if="getDisplayBianYao(yao).isYing" class="badge badge-ying clickable" @click.stop="showExplanation('应')">应</span>
                                </div>
                                <!-- 【重要修复】：变卦的标记（月破、暗动、空亡）只有在本位是动爻时才显示 -->
                                <div class="marker-secondary-slot" v-if="isDongYaoPosition(yao.position)">
                                    <span v-if="(getDisplayBianYao(yao) as any).tags.includes('月破')" class="mini-txt-tag red clickable" @click.stop="showExplanation('月破')">月破</span>
                                    <span v-if="(getDisplayBianYao(yao) as any).tags.includes('暗动')" class="mini-txt-tag green clickable" @click.stop="showExplanation('暗动')">暗动</span>
                                    <span v-if="(getDisplayBianYao(yao) as any).tags.includes('日破')" class="mini-txt-tag orange clickable" @click.stop="showExplanation('日破')">日破</span>
                                    <span v-if="(getDisplayBianYao(yao) as any).tags.includes('空亡')" class="mini-txt-tag grey clickable" @click.stop="showExplanation('旬空')">旬空</span>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                           <div class="cell-text"></div><div class="cell-bar empty"></div><div class="cell-markers"></div>
                        </template>
                    </div>

                </div>
            </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="tool-bar-styled" v-if="!isDemoMode">
        <button class="tool-btn-simple" @click="handleCopyText">复制文本</button>
        <label class="check-label"><input type="checkbox" v-model="showHiddenYao"> 显示藏爻</label>
        <label class="check-label"><input type="checkbox" v-model="showAllBianYao"> 显示全部变爻</label>
        <label class="check-label"><input type="checkbox" v-model="showPositionInCopy"> 复制带爻位</label>
        <button class="tool-btn-simple" @click="showGuaCi = !showGuaCi" :class="{ active: showGuaCi }">
          {{ showGuaCi ? '隐藏卦辞' : '显示卦辞' }}
        </button>
        <button class="tool-btn-simple demo-btn" @click="isDemoMode = true">
           演示模式
        </button>
      </div>

      <!-- 卦辞区域 -->
      <div v-if="showGuaCi && !isDemoMode" class="guaci-box">
         <!-- 本卦 -->
         <div v-if="getGuaCiData(currentGuaLi.benGua.name)" class="guaci-section">
            <h4 class="gc-main-title">本卦 · {{ currentGuaLi.benGua.name }}</h4>
            <p class="gc-text">{{ getGuaCiData(currentGuaLi.benGua.name)?.guaci }}</p>
            <div v-for="(line, idx) in getGuaCiYaoLines(currentGuaLi.benGua.name)" :key="idx" class="yaoci-line">{{ line }}</div>
        </div>
        <!-- 变卦 -->
        <div v-if="!isStaticGua && currentGuaLi.bianGua && currentGuaLi.benGua.name !== currentGuaLi.bianGua.name" class="guaci-section mt-4">
            <div class="divider"></div>
            <h4 class="gc-main-title">变卦 · {{ currentGuaLi.bianGua.name }}</h4>
            <p class="gc-text">{{ getGuaCiData(currentGuaLi.bianGua.name)?.guaci }}</p>
            <div v-for="(line, idx) in getGuaCiYaoLines(currentGuaLi.bianGua.name)" :key="idx" class="yaoci-line">{{ line }}</div>
        </div>
      </div>

      <!-- 断语笔记 -->
      <div class="duan-box" v-if="!isDemoMode">
        <div class="duan-header">
           <h4>断卦记录 / 笔记</h4>
           <span v-if="isSavedInList" class="status-badge saved">已归档</span>
           <span v-else class="status-badge unsaved">未归档</span>
        </div>
        <textarea v-model="duanGuaContent" class="duan-area" placeholder="在此处记录断语..."></textarea>
        <div class="bottom-btns">
          <button v-if="!isSavedInList" class="btn btn-save" @click="handleSaveToLibrary">归档到卦例库</button>
          <button class="btn btn-update" @click="handleUpdateInfo">更新保存内容</button>
        </div>
      </div>
    </div>
    
    <div v-else class="loading-state">
       <p>正在加载或卦例不存在...</p>
       <button class="btn btn-primary" @click="router.push('/')">返回首页</button>
    </div>
    
    <!-- 弹窗说明 -->
    <div v-if="showExplanationModal" class="modal-overlay explanation-overlay" @click.self="closeExplanation">
      <div class="modal-dialog explanation-card">
        <div class="exp-header">{{ explanationData.title }}</div>
        <div class="exp-body">
          <p v-for="(line, i) in explanationData.content.split('\n')" :key="i">{{ line }}</p>
        </div>
        <div class="exp-footer">
          <button class="btn btn-light btn-block" @click="closeExplanation">好的</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * 核心逻辑层
 */
import { ref, watch, reactive, computed, onMounted } from 'vue' 
import { useRoute, useRouter } from 'vue-router' 
import { useGuaPan } from '@/composables/useGuaPan'
import { useGuaLiStore } from '@/stores/guaLiStore'
import { HEXAGRAM_TEXTS } from '@/data/guaCiData'
import { EXPLANATIONS } from '@/data/explanations'
import { GUA64 } from '@/types/gua'
import type { Yao } from '@/types'

// === Init & Router ===
const store = useGuaLiStore()
const { currentGuaLi, castGua, castGuaByTime, castGuaByNumber, castGuaByKanji, generateGuaText } = useGuaPan()
const route = useRoute()
const router = useRouter()

// === Constants ===
const categories = ['财运', '男问桃花/姻缘', '女问桃花/姻缘', '工作/事业', '考试/成绩', '找寻失物', '出行平安', '疾病/医药', '天气', '其他']
const GUA_NAMES = GUA64.map(g => g.name)
const WUXING_MAP: Record<string, string> = { '子': '水', '亥': '水', '寅': '木', '卯': '木', '巳': '火', '午': '火', '申': '金', '酉': '金', '辰': '土', '戌': '土', '丑': '土', '未': '土' }
const VIEW_SETTINGS_KEY = 'gua-pan-view-settings'
const USER_CARD_BG_KEY = 'user-card-bg'

// === State: Form Inputs (起卦表单) ===
const castMode = ref('coin')
const reasonInput = ref('')
const genderInput = ref('男')
const categoryInput = ref('')
const coinInput = ref('')
const singleNumInput = ref('')
const doubleNum1 = ref('')
const doubleNum2 = ref('')
const kanjiInput = ref('')
const selectedBenGuaName = ref(GUA_NAMES[0])
const selectedBianGuaName = ref(GUA_NAMES[0])
// 手动指定爻位: type 1=阳, 2=阴. manualYaos[0]是初爻(底部), manualYaos[5]是上爻(顶部)
const manualYaos = ref(Array(6).fill(null).map(() => ({ type: 1, isMoving: false })))
const getLocalNowStr = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
const dateInput = ref(getLocalNowStr())

// === State: UI Controls (界面控制) ===
const isDemoMode = ref(false)
const showPositionInCopy = ref(true)
const duanGuaContent = ref('')
const showGuaCi = ref(false)
const showExplanationModal = ref(false)
const explanationData = reactive({ title: '', content: '' })
const showHiddenYao = ref(true) 
const showAllBianYao = ref(true)

// === Computed Properties ===
const isFormMode = computed(() => !route.params.id)

const isSavedInList = computed(() => {
  if (!currentGuaLi.value) return false
  return store.guaLiList.some(g => g.id === currentGuaLi.value!.id)
})

const isStaticGua = computed(() => {
  if (!currentGuaLi.value) return false
  return currentGuaLi.value.dongYaoList.length === 0
})

const isStaticView = computed(() => {
  return isStaticGua.value && !showAllBianYao.value
})

// [Fixed] 手动起卦预览
const manualPreviewData = computed(() => {
  if (castMode.value !== 'manual') return { ben: '', bian: '' }
  // manualYaos存储顺序：[0]=初爻, [5]=上爻。
  const currentYaos = manualYaos.value 
  const benCode = currentYaos.map(y => y.type)
  const bianCode = benCode.map((type, idx) => {
    const isMoving = currentYaos[idx].isMoving
    if (!isMoving) return type 
    return type === 1 ? 2 : 1
  })
  const findName = (c: number[]) => {
    const s = c.join(',')
    const g = GUA64.find(gua => {
        const stdCode = gua.code.map(x => ((x as number) === 1 || (x as number) === 3) ? 1 : 2).join(',')
        return stdCode === s
    })
    return g ? g.name : '未知'
  }
  const benName = findName(benCode)
  const bianName = findName(bianCode)
  return { ben: benName, bian: bianName }
})

// === Lifecycle & Watchers ===
onMounted(() => {
  const saved = localStorage.getItem(VIEW_SETTINGS_KEY)
  if (saved) {
    try {
      const p = JSON.parse(saved)
      if (typeof p.showHiddenYao !== 'undefined') showHiddenYao.value = p.showHiddenYao
      if (typeof p.showAllBianYao !== 'undefined') showAllBianYao.value = p.showAllBianYao
      if (typeof p.showGuaCi !== 'undefined') showGuaCi.value = p.showGuaCi
    } catch(e) {}
  }
  // 旧版允许单独修改卡片底色，容易破坏整套配色。新版由意境主题统一控制。
  localStorage.removeItem(USER_CARD_BG_KEY)
  if (route.params.id) {
    loadDataFromRoute(route.params.id as string)
  } else {
    store.setCurrentGuaLi(null)
    currentGuaLi.value = null
  }
})

watch([showHiddenYao, showAllBianYao, showGuaCi], () => {
  localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify({
    showHiddenYao: showHiddenYao.value,
    showAllBianYao: showAllBianYao.value,
    showGuaCi: showGuaCi.value
  }))
})

watch(() => route.params.id, (newId) => {
  isDemoMode.value = false; 
  if (newId) {
    loadDataFromRoute(newId as string)
  } else {
    store.setCurrentGuaLi(null)
    currentGuaLi.value = null
    resetForm()
  }
})

// === Methods: Data Loading & Reset ===
const loadDataFromRoute = (id: string) => {
  const success = store.loadGuaLiById(id)
  if (success && store.currentGuaLi) {
    currentGuaLi.value = store.currentGuaLi
    duanGuaContent.value = store.currentGuaLi.duangua || ''
  } else {
    currentGuaLi.value = null
  }
}

const resetForm = () => {
    reasonInput.value = ''
    categoryInput.value = ''
    coinInput.value = ''
    dateInput.value = getLocalNowStr()
    manualYaos.value.forEach(y => { y.type = 1; y.isMoving = false })
}

const handleResetView = () => {
  showHiddenYao.value = false; 
  showAllBianYao.value = true;
  showGuaCi.value = false;
  localStorage.removeItem(VIEW_SETTINGS_KEY);
  localStorage.removeItem(USER_CARD_BG_KEY);
  location.reload();
}

// === Methods: Casting Logic (核心起卦) ===
const toggleManualYao = (idx: number) => { manualYaos.value[idx].type = manualYaos.value[idx].type === 1 ? 2 : 1 }

const handleCast = () => {
  if (!reasonInput.value.trim()) { alert('请填写“问念 (占卜事项)”'); return }
  const date = new Date(dateInput.value)
  const reason = reasonInput.value
  let res = null
  try {
    if (castMode.value === 'coin') {
      if (!/^[0-3]{6}$/.test(coinInput.value)) return alert('请输入6位数字(0-3)')
      const codes = coinInput.value.split('').map(Number)
      res = castGua(codes[0], codes[1], codes[2], codes[3], codes[4], codes[5], date, reason)
    } 
    else if (castMode.value === 'manual') {
      const codes = manualYaos.value.map(y => y.isMoving ? (y.type === 1 ? 3 : 0) : y.type)
      res = castGua(codes[0], codes[1], codes[2], codes[3], codes[4], codes[5], date, reason)
    } else if (castMode.value === 'time') {
      res = castGuaByTime(date, reason)
    } else if (castMode.value === 'single_num') {
      if (!singleNumInput.value) return alert('请输入数字')
      res = castGuaByNumber(singleNumInput.value, null, reason, date)
    } else if (castMode.value === 'double_num') {
      if (!doubleNum1.value || !doubleNum2.value) return alert('请输入数字')
      res = castGuaByNumber(doubleNum1.value, doubleNum2.value, reason, date)
    } else if (castMode.value === 'kanji') {
      if (!kanjiInput.value) return alert('请输入汉字')
      res = castGuaByKanji(kanjiInput.value, reason, date)
    } else if (castMode.value === 'name') {
      const ben = GUA64.find(g => g.name === selectedBenGuaName.value)
      const bian = GUA64.find(g => g.name === selectedBianGuaName.value)
      if (ben && bian) {
        const codes = ben.code.map((c, i) => (c === bian.code[i]) ? c : (c === 1 ? 3 : 0))
        res = castGua(codes[0], codes[1], codes[2], codes[3], codes[4], codes[5], date, reason)
      }
    }
    if (res && res.benGua) {
      res.gender = genderInput.value
      res.category = categoryInput.value
      store.saveTempGua(res)
      router.push(`/gua/${res.id}`)
    } else {
        alert('起卦失败，可能是输入参数有误。')
    }
  } catch (e: any) { console.error(e); alert('起卦失败：' + (e.message || '未知错误')) }
}

const handleClear = () => { coinInput.value = ''; singleNumInput.value = ''; kanjiInput.value = ''; manualYaos.value.forEach(y => { y.type = 1; y.isMoving = false }) }

// === Methods: Persistence (保存/删除) ===
const handleSaveToLibrary = () => { if (currentGuaLi.value) { currentGuaLi.value.duangua = duanGuaContent.value; store.addGuaLiToList(currentGuaLi.value); alert('✅ 已成功归档到卦例库！') } }
const handleUpdateInfo = () => { if (currentGuaLi.value) { store.updateCurrentGuaLiInfo(duanGuaContent.value); alert('💾 内容已更新保存') } }
const handleDeleteCurrent = () => { if (!currentGuaLi.value) return; if (confirm('确定要删除这个卦例吗？此操作不可恢复。')) { store.deleteGuaLi(currentGuaLi.value.id); router.push('/') } }

// === Methods: UI Helpers (UI 辅助) ===
const handleBackToHome = () => { router.push('/') }

// [Fixed] 修复复制文本功能，增加兼容性回退
const handleCopyText = () => {
  if (!currentGuaLi.value) return;
  const txt = generateGuaText(currentGuaLi.value, {
    withHidden: showHiddenYao.value,
    withAllBian: showAllBianYao.value,
    withPosition: showPositionInCopy.value
  });

  // 优先尝试现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(txt)
      .then(() => alert('复制成功'))
      .catch(() => fallbackCopyText(txt))
  } else {
    // 回退方案
    fallbackCopyText(txt)
  }
}

// 传统复制回退方案
const fallbackCopyText = (text: string) => {
   const textArea = document.createElement("textarea");
   textArea.value = text;
   textArea.style.position = "fixed"; 
   textArea.style.left = "-9999px";
   document.body.appendChild(textArea);
   textArea.focus();
   textArea.select();
   try {
     document.execCommand('copy');
     alert('复制成功');
   } catch (err) {
     alert('复制失败，请尝试手动复制');
   }
   document.body.removeChild(textArea);
}

const showExplanation = (term: string) => { 
  if (isDemoMode.value) return; 
  if (!term) return; 
  const key = term.trim(); 
  let data = null;
  if (HEXAGRAM_TEXTS[key]) {
      const guaCiData = HEXAGRAM_TEXTS[key];
      data = { title: `卦辞：${key}`, content: `${guaCiData.guaci}\n\n${[...guaCiData.yaoci].reverse().join('\n')}` };
  } 
  if (!data) {
    data = EXPLANATIONS[key]; 
    if (!data) { for (const k in EXPLANATIONS) { if (key.includes(k)) { data = EXPLANATIONS[k]; break } } }
  }
  if (data) { 
      let title = data.title;
      if (WUXING_MAP[key]) {
          title = `地支：${key}${WUXING_MAP[key]}`;
      }
      explanationData.title = title; 
      explanationData.content = data.content; 
      showExplanationModal.value = true 
  }
}

const closeExplanation = () => showExplanationModal.value = false
const getGuaCiData = (name: string) => HEXAGRAM_TEXTS[name]
const getGuaCiYaoLines = (name: string) => [...(HEXAGRAM_TEXTS[name]?.yaoci ?? [])].reverse()

// 变卦显示辅助
const getBianYao = (pos: number) => currentGuaLi.value?.bianGua?.yaos.find(y => y.position === pos) || {} as any
const getDisplayBianYao = (benYao: Yao) => {
    if (currentGuaLi.value?.bianGua) {
        return getBianYao(benYao.position)
    }
    return benYao 
}

const isDongYaoPosition = (pos: number) => currentGuaLi.value?.dongYaoList.includes(pos)
const getWuXing = (dizhi: string) => WUXING_MAP[dizhi] || ''
const formatDateFull = (d: Date | string) => { 
  const date = new Date(d); 
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; 
  return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${weekDays[date.getDay()]}` 
}
</script>

<style scoped>
/* 全局容器 */
.gua-pan-container {
    font-family: "KaiTi", "楷体", "STKaiti", serif !important;
    writing-mode: horizontal-tb !important;
    max-width: 820px;
    margin: 0 auto;
    padding-bottom: 20px;
    font-size: 18px; 
    color: #333;
}
.card {
    background: var(--card-bg, #fff); 
    color: #333; 
    border-radius: 8px; 
    padding: 20px 25px; 
    box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
    margin-bottom: 16px; 
    border: 1px solid #f0f0f0;
}

/* === 表单相关样式 === */
.form-title-main { text-align: left; color: #2d3748; margin-bottom: 12px; border-bottom: 2px solid #f7fafc; padding-bottom: 6px; }
.form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.form-label { font-weight: bold; color: #4a5568; margin-bottom: 2px; font-size: 17px; }
.form-label.required::after { content: "*"; color: #e53e3e; margin-left: 4px; }

.form-input, .form-select {
    padding: 6px 12px;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    font-size: 16px;
    width: 100%;
    box-sizing: border-box;
    height: 38px; /* Compact height */
    background-color: #fff;
    transition: all 0.2s;
}
.form-input:focus, .form-select:focus { border-color: var(--primary-color); outline: none; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
.input-lg { font-size: 20px; letter-spacing: 1px; }

.radio-group-styled { display: flex; gap: 20px; margin-top: 5px; }
.radio-btn { display: inline-flex; align-items: center; cursor: pointer; padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 20px; background: #f7fafc; transition: all 0.2s; }
.radio-btn:hover { background: #edf2f7; }
.radio-btn.active { background: #ebf8ff; border-color: var(--primary-color); color: #2c5282; font-weight: bold; }
.hidden-radio { display: none; }

.mode-tabs { display: flex; flex-wrap: nowrap; gap: 8px; margin-bottom: 8px; overflow-x: auto; padding-bottom: 4px; }
.tab-btn { flex: 1; white-space: nowrap; padding: 8px 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 15px; color: #4a5568; transition: all 0.2s; text-align: center; }
.tab-btn:hover { background-color: #f7fafc; border-color: #cbd5e0; }
.tab-btn.active { background: var(--primary-color); color: white; border-color: var(--primary-color); font-weight: bold; box-shadow: 0 2px 4px rgba(49, 130, 206, 0.3); }

.action-buttons { display: flex; gap: 15px; margin-top: 15px; }
.btn-block-lg { width: 100%; padding: 10px; font-size: 18px; border-radius: 6px; }

/* === 结果页样式 === */
.result-top-bar { display: flex; justify-content: space-between; margin-bottom: 15px; }
.btn-subtle { background: #f3f4f6; border: 1px solid transparent; color: #555; border-radius: 4px; padding: 5px 10px; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.btn-subtle:hover { border-color: var(--primary-color); color: var(--primary-color); background: #fff; }
.btn-danger-soft { background: #fee2e2; color: #e53e3e; border: none; border-radius: 4px; padding: 5px 10px; font-size: 14px; cursor: pointer; }
.right-actions { display: flex; gap: 8px; }

/* 信息头 */
.reason-title { font-size: 22px; font-weight: bold; color: #2c3e50; margin: 0 0 12px 0; display: flex; align-items: center; }
.title-bar { width: 5px; height: 22px; background-color: var(--primary-color); margin-right: 10px; border-radius: 2px; }
.id-tag { font-size: 16px; color: #333; font-weight: bold; margin-left: 8px; }

.info-grid { display: flex; flex-direction: column; gap: 8px; font-size: 16px; color: #4a5568; }
.info-item { display: flex; align-items: baseline; }
.label { width: 45px; flex-shrink: 0; color: #4a5568; }
.value { color: #1a202c; }
.bazi { font-family: "KaiTi"; font-weight: 800; font-size: 19px; color: #2d3748; }
.kongwang { color: var(--primary-color); margin-left: 5px; font-size: 16px; font-weight: bold; }
.shensha-wrapper { align-items: flex-start; }
.shensha-list { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; }
.ss-tag { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 13px; color: #555; border: 1px solid #e2e8f0; cursor: pointer; }

.divider-light { border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0; }

/* === 可视化区域 === */
.gua-visual-area { margin-top: 8px; }
.visual-header-row { display: flex; align-items: flex-end; padding-bottom: 15px; }
.head-col { text-align: center; }
.head-liushen, .col-fixed-liushen { width: 50px; flex-shrink: 0; font-weight: bold; color: #2d3748; }
.head-cangyao, .col-fixed-cangyao { width: 100px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; }
.head-ben, .col-ben-group { flex: 1; display: flex; justify-content: center; }
.head-bian, .col-bian-group { flex: 1; display: flex; justify-content: center; }
.head-spacer, .col-spacer { width: 25px; flex-shrink: 0; }

.gua-title-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.gua-name-lg { font-size: 26px; font-weight: bold; color: var(--primary-color); letter-spacing: 2px; font-family: "KaiTi"; }
.gua-meta { font-size: 14px; color: #718096; margin-top: 4px; }

.yao-stack { display: flex; flex-direction: column; gap: 8px; }
.yao-row { display: flex; align-items: center; min-height: 40px; }

.col-ben-group, .col-bian-group { display: flex; align-items: center; justify-content: center; }
.cell-text { width: 120px; text-align: right; padding-right: 12px; white-space: nowrap; }
.cell-bar { width: 80px; display: flex; justify-content: center; align-items: center; }
.gap-text { width: 2px; display: inline-block; } 

/* 标记区域 */
.cell-markers { width: 50px; padding-left: 8px; display: flex; flex-direction: column; justify-content: center; }
.marker-primary-slot { height: 16px; display: flex; align-items: center; gap: 5px; }
.marker-secondary-slot { display: flex; flex-direction: column; margin-top: 2px; }
.mini-txt-tag { font-size: 10px; line-height: 1.1; font-weight: normal; white-space: nowrap; display: block; margin-bottom: 1px; }
.mini-txt-tag.red { color: #e53e3e; }
.mini-txt-tag.green { color: #38a169; }
.mini-txt-tag.orange { color: #dd6b20; }
.mini-txt-tag.grey { color: #718096; }

.main-text { font-size: 19px; font-weight: bold; color: #2d3748; font-family: "KaiTi"; }
.dizhi-text { font-weight: bold; }
.muted { color: #4a5568; }

.css-bar { width: 100%; height: 16px; display: flex; justify-content: space-between; }
.seg { height: 100%; background-color: #2d3748; border-radius: 0; }
.css-bar.yin .seg { width: 42%; }
.css-bar.yin .gap { width: 16%; }
.css-bar .seg.full { width: 100%; }
.css-bar.moving-red .seg { background-color: #e53e3e; }
.move-symbol.x { color: var(--primary-color); font-weight: bold; font-family: Arial; }
.move-symbol.o { width: 12px; height: 12px; border: 2px solid #e53e3e; border-radius: 50%; display: block; }
.badge-shi { background-color: #e53e3e; color: white; padding: 2px 5px; font-size: 12px; border-radius: 3px; }
.badge-ying { background-color: #38a169; color: white; padding: 2px 5px; font-size: 12px; border-radius: 3px; }

/* === 底部工具栏 === */
.tool-bar-styled { background: #f7fafc; padding: 10px 16px; border-radius: 6px; margin-top: 24px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 14px; }
.tool-btn-simple { background: white; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 4px; color: var(--primary-color); border-color: rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
.tool-btn-simple:hover { border-color: var(--primary-color); }
.tool-btn-simple.active { background: var(--primary-color); color: white; }
.check-label { display: flex; align-items: center; gap: 5px; cursor: pointer; color: #4a5568; }

/* === 断语/笔记/卦辞 === */
.duan-box { margin-top: 24px; }
.duan-header { display: flex; align-items: center; margin-bottom: 8px; gap: 8px; }
.status-badge { font-size: 14px; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid transparent;}
.status-badge.unsaved { background: #fff; color: var(--primary-color); border-color: var(--primary-color); opacity: 0.8; }
.status-badge.saved { background: #f0fff4; color: #2f855a; }

.duan-area { width: 100%; height: 140px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 16px; font-family: "KaiTi"; outline: none; resize: vertical; box-sizing: border-box; }
.duan-area:focus { border-color: var(--primary-color); }
.bottom-btns { margin-top: 12px; display: flex; gap: 12px; }
.btn-save { background-color: #48bb78; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-family: "KaiTi"; font-size: 16px; }
.btn-update { background-color: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-family: "KaiTi"; font-size: 16px; }

.guaci-box { margin-top: 16px; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px dashed #e2e8f0; font-size: 16px; line-height: 1.6; }
.gc-main-title { font-size: 18px; font-weight: bold; color: #2d3748; margin-bottom: 6px; }
.gc-text { margin-bottom: 8px; font-weight: 500; }
.yaoci-line { font-size: 15px; color: #4a5568; margin-bottom: 4px; }
.mt-4 { margin-top: 16px; }
.divider { border-top: 1px dashed #cbd5e0; margin: 12px 0; }

.clickable { cursor: pointer; }
.cang-yao { color: #a0aec0; font-size: 16px; display: flex; align-items: center; justify-content: center;}
.cang-yao.is-fu { color: #e53e3e !important; font-weight: bold; }

/* === 弹窗与浮动 === */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
.explanation-card { background: white; padding: 25px; border-radius: 8px; max-width: 400px; width: 90%; }
.exp-header { font-weight: bold; font-size: 18px; margin-bottom: 15px; color: var(--primary-color); border-bottom: 1px solid #eee; padding-bottom: 10px;}
.btn-primary { background: var(--primary-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
.btn-light { background: #edf2f7; color: #4a5568; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }

/* Manual Selector Specifics - 优化后 */
.manual-selector { display: flex; flex-direction: column; gap: 8px; }
.manual-preview-bar { display: flex; justify-content: space-between; background: rgba(0,0,0,0.06); padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; }
.preview-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.p-label { font-size: 12px; color: #666; margin-bottom: 2px; }
.p-value { font-weight: bold; color: #333; font-size: 16px; }

.manual-row { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 8px 0; /* 压缩行间距 */
    border-bottom: 1px dashed rgba(0,0,0,0.05); 
}
.manual-row:last-child { border-bottom: none; }
.manual-row.header-row { 
    font-weight: bold; 
    color: #666; 
    font-size: 15px; 
    border-bottom: 2px solid rgba(0,0,0,0.1); 
    padding-bottom: 6px; 
    margin-bottom: 4px;
}
.col-label { width: 50px; flex-shrink: 0; font-size: 16px; }
.col-bar { flex: 1; display: flex; justify-content: center; cursor: pointer; }
.col-check { width: 60px; display: flex; justify-content: flex-end; }

/* 阴阳条保持加粗，清晰易点 */
.bar-visual { 
    height: 22px; 
    width: 80%; 
    border-radius: 4px; 
    position: relative; 
}
.bar-visual.yang { background-color: #333; }
.bar-visual.yin { background: transparent; display: flex; justify-content: space-between; }
.bar-visual.yin::before, .bar-visual.yin::after { 
    content: ''; 
    width: 44%; 
    background-color: #333; 
    height: 100%; 
    border-radius: 4px; 
    display: block; 
}

/* 复选框样式 */
.check-container { display: block; position: relative; padding-left: 28px; cursor: pointer; font-size: 15px; user-select: none; }
.check-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
.checkmark { position: absolute; top: -2px; left: 0; height: 22px; width: 22px; background-color: #eee; border-radius: 4px; }
.check-container:hover input ~ .checkmark { background-color: #ccc; }
.check-container input:checked ~ .checkmark { background-color: var(--primary-color); }
.checkmark:after { content: ""; position: absolute; display: none; }
.check-container input:checked ~ .checkmark:after { display: block; }
.check-container .checkmark:after { left: 7px; top: 3px; width: 6px; height: 11px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }

.demo-exit-float {
    position: fixed; 
    bottom: 20px;    
    right: 20px;     
    z-index: 9999;
    font-size: 24px;
    cursor: pointer;
    background: white;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    border: 2px solid #e53e3e;
    color: #e53e3e;
    transition: all 0.3s;
}
.demo-exit-float:hover { transform: scale(1.1); }
</style>

<style scoped>
.gua-pan-container { max-width: 860px; padding: 22px 0 34px; color: var(--text-color); }
.card {
  padding: 24px 28px;
  border: 1px solid var(--reading-border);
  border-radius: 9px;
  color: var(--text-color);
  background: var(--reading-surface);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--shadow-color) 45%, transparent);
}
.form-title-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-soft);
  color: var(--text-color);
  font-family: var(--custom-font);
  font-size: 25px;
  letter-spacing: 0.08em;
}
.title-ornament { display: inline-grid; place-items: center; width: 29px; height: 29px; border-radius: 50%; color: var(--paper-strong); background: var(--primary-color); font-size: 13px; letter-spacing: 0; }
.form-label { color: var(--text-secondary); font-size: 15px; }
.form-label.required::after { color: var(--danger-color); }
.form-input, .form-select, .duan-area {
  border-color: var(--border-color);
  border-radius: 5px;
  color: var(--text-color);
  background: var(--paper-strong);
}
.form-input::placeholder, .duan-area::placeholder { color: var(--text-muted); }
.form-input:focus, .form-select:focus, .duan-area:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px var(--primary-soft); }
.radio-group-styled { gap: 10px; }
.radio-btn { min-width: 68px; justify-content: center; border-color: var(--border-soft); border-radius: 999px; color: var(--text-secondary); background: var(--paper-strong); }
.radio-btn:hover { border-color: var(--border-color); background: var(--surface-muted); }
.radio-btn.active { border-color: var(--primary-color); color: var(--primary-color); background: var(--primary-soft); }
.mode-tabs { gap: 7px; }
.tab-btn { border-color: var(--border-soft); border-radius: 5px; color: var(--text-secondary); background: var(--paper-strong); }
.tab-btn:hover { border-color: var(--border-color); color: var(--primary-color); background: var(--surface-muted); }
.tab-btn.active { border-color: var(--primary-color); color: var(--paper-strong); background: var(--primary-color); box-shadow: none; }
.tip, .tip-sm { color: var(--text-secondary); }
.action-buttons { gap: 10px; }
.btn { border-radius: 5px; }
.btn-primary, .btn-update { color: var(--paper-strong); background: var(--primary-color); }
.btn-primary:hover, .btn-update:hover { background: var(--primary-hover); }
.btn-light, .btn-subtle { border: 1px solid var(--border-soft); color: var(--text-secondary); background: var(--surface-muted); }
.btn-light:hover, .btn-subtle:hover { border-color: var(--border-color); color: var(--primary-color); background: var(--paper-strong); }
.btn-danger-soft { border: 1px solid color-mix(in srgb, var(--danger-color) 24%, transparent); color: var(--danger-color); background: color-mix(in srgb, var(--danger-color) 8%, var(--paper-strong)); }
.reason-title, .id-tag, .value, .bazi, .head-liushen, .main-text, .gc-main-title { color: var(--text-strong); }
.reason-title { font-size: 21px; }
.title-bar { width: 3px; border-radius: 0; background: var(--primary-color); }
.info-grid, .label, .muted, .check-label, .yaoci-line { color: var(--text-secondary); }
.kongwang, .gua-name-lg { color: var(--primary-color); }
.ss-tag { border-color: var(--border-soft); color: var(--text-secondary); background: var(--surface-muted); }
.divider-light, .divider { border-color: var(--border-soft); }
.gua-name-lg { font-size: 25px; }
.gua-meta { color: var(--text-muted); }
.seg, .bar-visual.yang, .bar-visual.yin::before, .bar-visual.yin::after { background-color: var(--text-color); }
.css-bar.moving-red .seg { background-color: var(--danger-color); }
.mini-txt-tag.red, .cang-yao.is-fu { color: var(--danger-color) !important; }
.mini-txt-tag.green { color: var(--success-color); }
.mini-txt-tag.orange { color: var(--gold-color); }
.mini-txt-tag.grey { color: var(--text-muted); }
.cang-yao { color: var(--hidden-yao-color); font-family: var(--reading-font); font-weight: 500; }
.cang-yao.is-fu { color: var(--danger-color) !important; font-weight: 700; }
.badge-shi { background: var(--danger-color); }
.badge-ying, .btn-save { background: var(--success-color); }
.tool-bar-styled { border: 1px solid var(--border-soft); border-radius: 6px; background: var(--surface-muted); }
.tool-btn-simple { border-color: var(--border-color); color: var(--primary-color); background: var(--paper-strong); }
.tool-btn-simple.active { color: var(--paper-strong); background: var(--primary-color); }
.status-badge.unsaved { color: var(--primary-color); border-color: var(--primary-color); background: transparent; }
.status-badge.saved { color: var(--success-color); background: color-mix(in srgb, var(--success-color) 10%, var(--paper-strong)); }
.duan-area { color: var(--text-strong); background: var(--reading-surface); font-family: var(--reading-font); font-weight: 500; line-height: 1.72; }
.guaci-box { border-color: var(--border-color); color: var(--text-color); background: var(--surface-muted); }
.manual-preview-bar { border: 1px solid var(--border-soft); background: var(--surface-muted); }
.p-label, .manual-row.header-row { color: var(--text-secondary); }
.p-value { color: var(--text-color); }
.checkmark { border: 1px solid var(--border-color); background: var(--paper-strong); }
.check-container:hover input ~ .checkmark { background: var(--surface-muted); }
.check-container input:checked ~ .checkmark { border-color: var(--primary-color); background: var(--primary-color); }
.explanation-card { border: 1px solid var(--border-color); background: var(--card-bg); }
.exp-header { color: var(--primary-color); border-color: var(--border-soft); }
.main-text { font-family: var(--reading-font) !important; font-weight: 700; letter-spacing: 0.015em; }
.main-text.muted { color: var(--text-secondary); font-weight: 600; }
.info-grid, .ss-tag, .check-label, .gc-text, .yaoci-line { font-family: var(--reading-font); }
.info-grid { color: var(--text-secondary); font-weight: 500; line-height: 1.72; }
.bazi { font-family: var(--reading-font); font-weight: 700; letter-spacing: 0.025em; }
.gua-name-lg { color: var(--text-strong); font-weight: 800; }
.gua-meta { color: var(--text-secondary); }
.seg, .bar-visual.yang, .bar-visual.yin::before, .bar-visual.yin::after { background-color: var(--text-strong); }
.tool-bar-styled, .guaci-box, .manual-preview-bar { background: color-mix(in srgb, var(--reading-surface) 68%, var(--surface-muted)); }

@media (max-width: 920px) {
  .gua-pan-container { padding: 14px 10px 24px; }
  .card { padding: 20px; }
}
</style>
