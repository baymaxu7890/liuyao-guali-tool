<template>
  <div class="wnl-panel card">
    <div class="wnl-header">
      <h4>万年历 · 干支反查</h4>
    </div>
    
    <!-- 1. 公历查干支 -->
    <div class="search-section">
      <div class="section-title">公历查干支</div>
      <div class="search-row">
        <input type="date" v-model="searchDate" class="form-input s-input" @change="handleDateChange" />
        <button class="btn btn-sm btn-primary" @click="handleDateChange">定位</button>
      </div>
      <div v-if="currentInfo" class="single-result-box">
        <div class="main-bazi">{{ currentInfo.bazi }}</div>
        <div class="sub-text">{{ currentInfo.nongli }}</div>
      </div>
    </div>

    <hr class="divider-light">

    <!-- 2. 干支反查 -->
    <div class="search-section">
      <div class="section-title">
        干支反查日期 <span class="tip-text">(1900-2050)</span>
      </div>
      <p class="cascade-tip">按年 → 月 → 日 → 时逐级选择；月柱遵循五虎遁，日柱来自真实历日，时柱遵循五鼠遁。</p>
      <div class="gz-filters">
        <GanZhiCombobox
          v-model="targetYearGZ"
          :options="jiaziList"
          label="第一列 · 年柱"
          placeholder="输入或选择年干支"
        />
        <GanZhiCombobox
          v-model="targetMonthGZ"
          :options="monthGZOptions"
          :disabled="!targetYearGZ"
          label="第二列 · 月柱"
          :placeholder="targetYearGZ ? '仅显示符合五虎遁的月柱' : '请先选择年柱'"
        />
        <GanZhiCombobox
          v-model="targetDayGZ"
          :options="dayGZOptions"
          :disabled="!targetYearGZ || !targetMonthGZ"
          label="第三列 · 日柱"
          :placeholder="targetMonthGZ ? '仅显示真实出现的日柱' : '请先选择月柱'"
        />
        <GanZhiCombobox
          v-model="targetHourGZ"
          :options="hourGZOptions"
          :disabled="!targetDayGZ"
          label="第四列 · 时柱"
          :placeholder="targetDayGZ ? '仅显示符合五鼠遁的时柱' : '请先选择日柱'"
        />
        <button class="btn btn-sm btn-success reverse-btn" @click="handleReverseSearch" :disabled="isSearching || !targetYearGZ">
          {{ isSearching ? '...' : '搜索' }}
        </button>
      </div>

      <div v-if="targetYearGZ" class="constraint-summary">
        当前约束：{{ targetYearGZ }}年
        <template v-if="targetMonthGZ"> → {{ targetMonthGZ }}月</template>
        <template v-if="targetDayGZ"> → {{ targetDayGZ }}日</template>
        <template v-if="targetHourGZ"> → {{ targetHourGZ }}时（{{ selectedHourRange }}）</template>
      </div>

      <div class="results-list" v-if="searchResults.length > 0">
        <div class="list-container">
          <div v-for="(res, idx) in searchResults" :key="idx" class="res-row clickable" @click="jumpToDate(res.date)">
            <span class="res-date">{{ res.date }}</span>
            <span class="res-gz">{{ res.bazi }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="hasSearched" class="empty-results">没有找到符合这组年、月、日干支的真实日期。</div>
    </div>

    <hr class="divider-light">

    <!-- 3. 可视化日历 -->
    <div class="calendar-visual">
      <div class="cal-header">
        <button class="nav-btn" @click="changeMonth(-1)">‹</button>
        <span class="cal-title">{{ viewYear }}年 {{ viewMonth }}月</span>
        <button class="nav-btn" @click="changeMonth(1)">›</button>
      </div>

      <div class="cal-week-head">
        <span class="wk-cell">日</span><span class="wk-cell">一</span><span class="wk-cell">二</span>
        <span class="wk-cell">三</span><span class="wk-cell">四</span><span class="wk-cell">五</span><span class="wk-cell">六</span>
      </div>

      <div class="cal-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="['cal-cell', { 'other-month': !day.isCurrentMonth, 'is-today': day.isToday, 'is-selected': day.isSelected }]"
          @click="selectDay(day)"
        >
          <div class="c-day">{{ day.dayNum }}</div>
          <div class="c-lunar">{{ day.lunarDay }}</div>
          <div class="c-gz">{{ day.dayGZ }}</div>
        </div>
      </div>
    </div>

    <!-- 4. 详细信息面板 -->
    <div class="detail-footer" v-if="detailData">
      <div class="df-header">
        <strong>{{ detailData.dateStr }}</strong> 
        <span class="df-lunar">({{ detailData.lunarMonth }}月{{ detailData.lunarDay }})</span> 
        {{ detailData.week }}
      </div>
      
      <div class="df-bazi-row">
        <div class="bazi-info">
          <div>{{ detailData.yearGZ }}年 {{ detailData.monthGZ }}月 {{ detailData.dayGZ }}日 {{ detailData.timeGZ }}时</div>
          <div class="kongwang-info">
            {{ detailData.dayGZ }}空 <span class="gray">{{ detailData.dayKong }}</span> &nbsp;
            {{ detailData.timeGZ }}空 <span class="gray">{{ detailData.timeKong }}</span>
          </div>
        </div>
        <div class="jieqi-tag">
          『{{ detailData.currentJieQi }}第{{ detailData.jieQiDays }}天』
        </div>
      </div>

      <div class="df-terms-time">
        <span class="term-item">{{ detailData.prevJieQiName }} {{ detailData.prevJieQiTime }}</span>
        <span class="term-item ms-2">{{ detailData.nextJieQiName }} {{ detailData.nextJieQiTime }}</span>
      </div>

      <hr class="divider-dashed" />

      <div class="yiji-box">
        <div class="yj-row">
          <span class="yj-icon yi">宜</span>
          <span class="yj-content">{{ detailData.yi.join(' ') }}</span>
        </div>
        <div class="yj-row mt-1">
          <span class="yj-icon ji">忌</span>
          <span class="yj-content">{{ detailData.ji.join(' ') }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { Solar } from 'lunar-javascript'
import GanZhiCombobox from './GanZhiCombobox.vue'
import {
  calculateGanZhi,
  getFiveRatHourPillars,
  getFiveTigerMonthPillars,
  resolveGanZhiDate
} from '@/utils/ganZhi'

const tiangan = '甲乙丙丁戊己庚辛壬癸'.split('')
const dizhi = '子丑寅卯辰巳午未申酉戌亥'.split('')
const jiaziList = Array.from({ length: 60 }, (_, i) => tiangan[i % 10] + dizhi[i % 12])
const hourRanges: Record<string, string> = {
  子: '23:00–00:59', 丑: '01:00–02:59', 寅: '03:00–04:59', 卯: '05:00–06:59',
  辰: '07:00–08:59', 巳: '09:00–10:59', 午: '11:00–12:59', 未: '13:00–14:59',
  申: '15:00–16:59', 酉: '17:00–18:59', 戌: '19:00–20:59', 亥: '21:00–22:59'
}

const searchDate = ref('')
const currentInfo = ref<any>(null)

const targetYearGZ = ref('')
const targetMonthGZ = ref('')
const targetDayGZ = ref('')
const targetHourGZ = ref('')
const searchResults = ref<any[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)

interface ReverseDateRecord {
  date: string
  bazi: string
  yearGZ: string
  monthGZ: string
  dayGZ: string
}

const reverseRecordCache = new Map<string, ReverseDateRecord[]>()
const occurrenceYearCache = new Map<string, number[]>()

const monthGZOptions = computed(() => getFiveTigerMonthPillars(targetYearGZ.value))

const selectedMonthRecords = computed(() => {
  if (!targetYearGZ.value || !targetMonthGZ.value) return []
  return getReverseRecords(targetYearGZ.value, targetMonthGZ.value)
})

const dayGZOptions = computed(() => {
  const actualDays = new Set(selectedMonthRecords.value.map(record => record.dayGZ))
  return jiaziList.filter(gz => actualDays.has(gz))
})

const hourGZOptions = computed(() => getFiveRatHourPillars(targetDayGZ.value))
const selectedHourRange = computed(() => hourRanges[targetHourGZ.value[1]] || '')

const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth() + 1)
const selectedDateStr = ref('') 

const detailData = ref<any>(null)

interface CalendarDay {
  dateStr: string
  dayNum: number
  lunarDay: string
  dayGZ: string 
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}
const calendarDays = ref<CalendarDay[]>([])

onMounted(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const d = today.getDate()
  
  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  searchDate.value = dateStr
  selectedDateStr.value = dateStr
  
  viewYear.value = y
  viewMonth.value = m
  
  updateCurrentInfo(dateStr)
  updateDetailData(dateStr)
  buildCalendar()
})

watch(targetYearGZ, () => {
  targetMonthGZ.value = ''
  targetDayGZ.value = ''
  targetHourGZ.value = ''
  searchResults.value = []
  hasSearched.value = false
})

watch(targetMonthGZ, () => {
  targetDayGZ.value = ''
  targetHourGZ.value = ''
  searchResults.value = []
  hasSearched.value = false
})

watch(targetDayGZ, () => {
  targetHourGZ.value = ''
  searchResults.value = []
  hasSearched.value = false
})

watch(targetHourGZ, () => {
  searchResults.value = []
  hasSearched.value = false
})

const updateDetailData = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  date.setHours(now.getHours())
  date.setMinutes(now.getMinutes())

  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  const ganZhi = calculateGanZhi(date, { lateZiDayBoundary: true })
  const pillarLunar = Solar.fromDate(resolveGanZhiDate(date, { lateZiDayBoundary: true })).getLunar()

  const prevJieQi = lunar.getPrevJieQi(true)
  const nextJieQi = lunar.getNextJieQi(true)
  
  const prevSolar = prevJieQi.getSolar()
  const diffDays = Math.floor((date.getTime() - new Date(prevSolar.toYmd()).getTime()) / (1000 * 60 * 60 * 24))
  
  detailData.value = {
    dateStr: `${solar.getYear()}年${String(solar.getMonth()).padStart(2,'0')}月${String(solar.getDay()).padStart(2,'0')}日`,
    lunarMonth: lunar.getMonthInChinese(),
    lunarDay: lunar.getDayInChinese(),
    week: "星期" + solar.getWeekInChinese(),
    
    yearGZ: ganZhi.year.replace('年', ''),
    monthGZ: ganZhi.month.replace('月', ''),
    dayGZ: ganZhi.day.replace('日', ''),
    timeGZ: ganZhi.hour.replace('时', ''),
    
    dayKong: pillarLunar.getDayXunKong(),
    timeKong: pillarLunar.getTimeXunKong(),
    
    currentJieQi: prevJieQi.getName(),
    jieQiDays: diffDays + 1,
    
    prevJieQiName: prevJieQi.getName(),
    prevJieQiTime: prevJieQi.getSolar().toYmdHms().substring(0, 16),
    nextJieQiName: nextJieQi.getName(),
    nextJieQiTime: nextJieQi.getSolar().toYmdHms().substring(0, 16),
    
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi()
  }
}

const updateCurrentInfo = (dateStr: string) => {
  const date = new Date(dateStr)
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  const ganZhi = calculateGanZhi(date, { lateZiDayBoundary: true })
  currentInfo.value = {
    bazi: `${ganZhi.year.replace('年', '')} ${ganZhi.month.replace('月', '')} ${ganZhi.day.replace('日', '')}`,
    nongli: `农历${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`
  }
}

const handleDateChange = () => {
  if (!searchDate.value) return
  selectedDateStr.value = searchDate.value
  updateCurrentInfo(searchDate.value)
  updateDetailData(searchDate.value)
  
  const d = new Date(searchDate.value)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth() + 1
  buildCalendar()
}

const jumpToDate = (dateStr: string) => {
  searchDate.value = dateStr
  handleDateChange()
}

const buildCalendar = () => {
  const days: CalendarDay[] = []
  const firstDayObj = new Date(viewYear.value, viewMonth.value - 1, 1)
  const startWeekday = firstDayObj.getDay()
  
  const startDate = new Date(firstDayObj)
  startDate.setDate(startDate.getDate() - startWeekday)
  
  const tempDate = new Date(startDate)
  const todayStr = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < 42; i++) {
    const y = tempDate.getFullYear()
    const m = tempDate.getMonth() + 1
    const d = tempDate.getDate()
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    
    const solar = Solar.fromYmd(y, m, d)
    const lunar = solar.getLunar()
    
    days.push({
      dateStr: dateStr,
      dayNum: d,
      lunarDay: lunar.getDayInChinese(),
      dayGZ: lunar.getDayInGanZhi(), 
      isCurrentMonth: m === viewMonth.value,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr.value
    })
    tempDate.setDate(tempDate.getDate() + 1)
  }
  calendarDays.value = days
}

const changeMonth = (delta: number) => {
  let m = viewMonth.value + delta
  let y = viewYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  viewYear.value = y
  viewMonth.value = m
  buildCalendar()
}

const selectDay = (day: CalendarDay) => {
  selectedDateStr.value = day.dateStr
  searchDate.value = day.dateStr
  
  if (!day.isCurrentMonth) {
    const d = new Date(day.dateStr)
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth() + 1
  }
  
  updateCurrentInfo(day.dateStr)
  updateDetailData(day.dateStr)
  buildCalendar()
}

const getOccurrenceYears = (yearGZ: string) => {
  const cached = occurrenceYearCache.get(yearGZ)
  if (cached) return cached

  const years: number[] = []
  // 取每年七月判断该干支年；从 1899 开始是为了覆盖 1900 年立春前的日期。
  for (let year = 1899; year <= 2050; year++) {
    const gz = Solar.fromYmd(year, 7, 1).getLunar().getYearInGanZhiExact()
    if (gz === yearGZ) years.push(year)
  }
  occurrenceYearCache.set(yearGZ, years)
  return years
}

const getReverseRecords = (yearGZ: string, monthGZ = '') => {
  const cacheKey = `${yearGZ}|${monthGZ}`
  const cached = reverseRecordCache.get(cacheKey)
  if (cached) return cached

  const records: ReverseDateRecord[] = []
  const minTime = new Date(1900, 0, 1).getTime()
  const maxTime = new Date(2050, 11, 31).getTime()

  getOccurrenceYears(yearGZ).forEach(occurrenceYear => {
    // 干支年以立春为界，扫描到下一年三月即可完整覆盖这一干支年。
    const cursor = new Date(occurrenceYear, 0, 1)
    const end = new Date(occurrenceYear + 1, 2, 1)

    while (cursor < end) {
      const time = cursor.getTime()
      if (time >= minTime && time <= maxTime) {
        const solar = Solar.fromYmd(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate())
        const lunar = solar.getLunar()
        const actualYearGZ = lunar.getYearInGanZhiExact()
        const actualMonthGZ = lunar.getMonthInGanZhiExact()

        if (actualYearGZ === yearGZ && (!monthGZ || actualMonthGZ === monthGZ)) {
          const actualDayGZ = lunar.getDayInGanZhiExact()
          records.push({
            date: solar.toYmd(),
            bazi: `${actualYearGZ} ${actualMonthGZ} ${actualDayGZ}`,
            yearGZ: actualYearGZ,
            monthGZ: actualMonthGZ,
            dayGZ: actualDayGZ
          })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  })

  records.sort((a, b) => a.date.localeCompare(b.date))
  reverseRecordCache.set(cacheKey, records)
  return records
}

const handleReverseSearch = () => {
  if (!targetYearGZ.value) return alert('请先选择一个有效的年柱干支')
  isSearching.value = true
  hasSearched.value = true

  window.setTimeout(() => {
    const records = getReverseRecords(targetYearGZ.value, targetMonthGZ.value)
    searchResults.value = records
      .filter(record => !targetDayGZ.value || record.dayGZ === targetDayGZ.value)
      .map(record => ({
        date: record.date,
        bazi: targetHourGZ.value
          ? `${record.bazi} ${targetHourGZ.value}（${selectedHourRange.value}）`
          : record.bazi
      }))
    isSearching.value = false
  }, 0)
}
</script>

<style scoped>
.wnl-panel { border: 1px solid #e2e8f0; background: #fff; padding: 15px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
.wnl-header { border-bottom: 2px solid #667eea; padding-bottom: 5px; color: #2d3748; margin-bottom: 10px; }
.section-title { font-weight: bold; font-size: 14px; color: #4a5568; margin-bottom: 5px; }
.tip-text { font-size: 12px; color: #aaa; font-weight: normal; }
.cascade-tip { margin: 0 0 10px; color: #718096; font-size: 12px; line-height: 1.5; }
.search-row { display: flex; gap: 8px; margin-bottom: 5px; }
.s-input { flex: 1; padding: 6px; border: 1px solid #cbd5e0; border-radius: 4px; }
.single-result-box { background: #f0f4ff; padding: 5px; border-radius: 4px; text-align: center; margin-bottom: 5px; }
.main-bazi { color: #e53e3e; font-weight: bold; }
.sub-text { font-size: 12px; color: #666; }
.divider-light { margin: 10px 0; border: 0; border-top: 1px dashed #eee; }
.gz-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; }
.reverse-btn { width: 72px; height: 34px; flex-shrink: 0; }
.constraint-summary { margin-top: 8px; padding: 7px 9px; border-radius: 5px; background: #f0f4ff; color: #4c51bf; font-size: 13px; }
.results-list { margin-top: 8px; max-height: 220px; overflow-y: auto; background: #fafafa; border: 1px solid #eee; border-radius: 5px; }
.res-row { display: flex; justify-content: space-between; gap: 15px; padding: 6px 9px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
.res-row:hover { background: #e6fffa; cursor: pointer; color: #319795; }
.res-gz { white-space: nowrap; }
.empty-results { margin-top: 8px; padding: 10px; border-radius: 5px; background: #fff5f5; color: #c53030; font-size: 13px; text-align: center; }
.calendar-visual { margin-top: 10px; user-select: none; }
.cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-weight: bold; color: #2d3748; }
.nav-btn { background: none; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer; font-size: 14px; padding: 2px 8px; }
.cal-week-head { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 2px; }
.wk-cell { font-size: 12px; color: #718096; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-cell { 
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 50px; border-radius: 4px; cursor: pointer; border: 1px solid transparent; 
}
.cal-cell:hover { background: #f7fafc; }
.cal-cell.other-month { opacity: 0.3; }
.cal-cell.is-selected { background: #ebf8ff; border: 1px solid #667eea; }
.cal-cell.is-today { background: #fff5f5; border: 1px solid #fc8181; }
.c-day { font-size: 16px; font-weight: bold; line-height: 1.1; }
.is-selected .c-day { color: #667eea; }
.c-lunar { font-size: 10px; color: #718096; }
.c-gz { font-size: 10px; color: #e53e3e; transform: scale(0.85); }
.detail-footer { margin-top: 15px; border: 1px solid #fc8181; border-radius: 6px; padding: 12px; background: #fff; font-size: 14px; color: #2d3748; }
.df-header { font-size: 16px; margin-bottom: 8px; }
.df-lunar { margin: 0 5px; font-weight: normal; }
.df-bazi-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.bazi-info { font-family: "SimSun", serif; font-size: 15px; line-height: 1.5; }
.kongwang-info { font-size: 12px; color: #718096; margin-top: 2px; }
.kongwang-info .gray { color: #a0aec0; }
.jieqi-tag { color: #3182ce; font-weight: bold; font-size: 14px; }
.df-terms-time { font-size: 12px; color: #718096; background: #f7fafc; padding: 4px; border-radius: 4px; display: inline-block; }
.term-item { display: inline-block; }
.ms-2 { margin-left: 10px; }
.divider-dashed { border: 0; border-top: 1px dashed #e2e8f0; margin: 10px 0; }
.yiji-box { display: flex; flex-direction: column; }
.yj-row { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; line-height: 1.4; }
.yj-icon { display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; color: #fff; font-size: 12px; flex-shrink: 0; }
.yj-icon.yi { background: #48bb78; }
.yj-icon.ji { background: #f56565; }
.yj-content { color: #2d3748; }
.btn { cursor: pointer; border: none; border-radius: 4px; color: white; transition: 0.2s; }
.btn-primary { background: #667eea; }
.btn-success { background: #48bb78; }
.btn:disabled { opacity: 0.6; }

@media (max-width: 760px) {
  .gz-filters { align-items: stretch; flex-direction: column; }
  .reverse-btn { width: 100%; }
  .df-bazi-row { gap: 8px; flex-direction: column; }
}
</style>

<style scoped>
.wnl-panel { border-color: var(--border-soft); border-radius: 9px; color: var(--text-color); background: var(--card-bg); font-family: var(--ui-font); box-shadow: 0 8px 22px color-mix(in srgb, var(--shadow-color) 38%, transparent); }
.wnl-header { border-bottom: 1px solid var(--border-color); color: var(--text-color); font-family: var(--custom-font); letter-spacing: 0.06em; }
.section-title { color: var(--text-secondary); }
.tip-text, .cascade-tip, .sub-text, .wk-cell, .c-lunar, .kongwang-info, .df-terms-time { color: var(--text-muted); }
.s-input { border-color: var(--border-color); color: var(--text-color); background: var(--paper-strong); }
.s-input:focus { border-color: var(--primary-color); outline: 0; box-shadow: 0 0 0 3px var(--primary-soft); }
.single-result-box, .constraint-summary { color: var(--primary-color); background: var(--primary-soft); }
.main-bazi, .c-gz { color: var(--danger-color); }
.divider-light, .divider-dashed { border-color: var(--border-soft); }
.results-list { border-color: var(--border-soft); background: var(--paper-strong); }
.res-row { border-color: var(--border-soft); }
.res-row:hover { color: var(--primary-color); background: var(--primary-soft); }
.empty-results { color: var(--danger-color); background: color-mix(in srgb, var(--danger-color) 8%, var(--paper-strong)); }
.cal-header, .yj-content { color: var(--text-color); }
.nav-btn { border-color: var(--border-color); color: var(--text-secondary); background: var(--paper-strong); }
.nav-btn:hover { color: var(--primary-color); background: var(--primary-soft); }
.cal-cell:hover { background: var(--surface-muted); }
.cal-cell.is-selected { border-color: var(--primary-color); background: var(--primary-soft); }
.cal-cell.is-today { border-color: color-mix(in srgb, var(--danger-color) 62%, var(--border-color)); background: color-mix(in srgb, var(--danger-color) 7%, var(--paper-strong)); }
.is-selected .c-day, .jieqi-tag { color: var(--primary-color); }
.detail-footer { border-color: var(--border-color); color: var(--text-color); background: var(--paper-strong); }
.df-terms-time { background: var(--surface-muted); }
.yj-icon.yi, .btn-success { background: var(--success-color); }
.yj-icon.ji { background: var(--danger-color); }
.btn-primary { background: var(--primary-color); }
</style>
