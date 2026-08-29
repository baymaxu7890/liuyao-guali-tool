import { ref } from 'vue'
import type { Gua, GuaLi, CangYaoItem } from '@/types'
import { GUA64 } from '@/types/gua'
import { calculateGanZhi, calculateXunKong } from '@/utils/ganZhi'
import { calculateLiuQin, calculateLiuShen } from '@/utils/liuQin'
import { calculateShiYing } from '@/utils/shiYing'
import { calculateYaoTags } from '@/utils/wangshuai'
import { calculateShenSha } from '@/utils/shenSha'
import { CURRENT_GUALI_SCHEMA_VERSION } from '@/utils/guaLiData'

// 基础八卦代码 (1=阳, 2=阴)
const MEI_HUA_CODE: Record<number, number[]> = {
  1: [1, 1, 1],
  2: [1, 1, 2],
  3: [1, 2, 1],
  4: [1, 2, 2],
  5: [2, 1, 1],
  6: [2, 1, 2],
  7: [2, 2, 1],
  8: [2, 2, 2]
}

// 宫位映射
const BEN_GONG_MAP: Record<string, string> = {
  '乾宫': '乾为天',
  '兑宫': '兑为泽',
  '离宫': '离为火',
  '震宫': '震为雷',
  '巽宫': '巽为风',
  '坎宫': '坎为水',
  '艮宫': '艮为山',
  '坤宫': '坤为地'
}

const WUXING_MAP: Record<string, string> = {
  '子': '水',
  '亥': '水',
  '寅': '木',
  '卯': '木',
  '巳': '火',
  '午': '火',
  '申': '金',
  '酉': '金',
  '辰': '土',
  '戌': '土',
  '丑': '土',
  '未': '土'
}

// 视觉宽度辅助
const getVisualLength = (str: string) => {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += str.charCodeAt(i) > 255 ? 2 : 1;
  }
  return len;
}

/** 用全角空格补足「视觉宽度」，避免半角空格在楷体/宋体下比汉字窄导致复制后列对不齐 */
const padStringVisual = (str: string, targetLen: number) => {
  const currentLen = getVisualLength(str);
  if (currentLen >= targetLen) return str;
  let need = targetLen - currentLen;
  let pad = '';
  while (need >= 2) {
    pad += '\u3000';
    need -= 2;
  }
  if (need === 1) pad += ' ';
  return str + pad;
}

export function useGuaPan() {
  const currentGuaLi = ref<GuaLi | null>(null)

  // 查找卦象 (标准化代码: 3->1, 0/4->2)
  const findGuaByCode = (code: number[]): Gua | undefined => {
    const searchCode = code.map(c => c === 3 ? 1 : (c === 0 || c === 4 ? 2 : c))
    const searchStr = searchCode.join(',')
    return GUA64.find(gua => gua.code.join(',') === searchStr) as Gua | undefined
  }

  // 核心计算逻辑
  const calculateGuaInternal = (
    benGua: Gua, 
    bianGua: Gua, 
    guaCode: number[], 
    time: Date, 
    reason: string
  ): GuaLi => {
    try {
      const ganZhi = calculateGanZhi(time, { lateZiDayBoundary: true })
      const xunkongStr = calculateXunKong(ganZhi.day)
      const xunkongList = xunkongStr.replace('空','').split('')
      
      // === 1. 本卦 ===
      const benGuaPureCode = guaCode.map(c => c === 3 ? 1 : (c === 0 || c === 4 ? 2 : c))
      const yaos = calculateLiuQin(benGuaPureCode, benGua.palace)
      const liuShenList = calculateLiuShen(ganZhi.day[0])
      
      // 注入六神、恢复动爻类型
      yaos.forEach((yao, i) => {
        yao.liushen = liuShenList[yao.position - 1]
        yao.type = guaCode[i] as any
      })
      
      const yaosWithShiYing = calculateShiYing(yaos, benGua.palace, benGua.type)
      
      // === 2. 变卦 ===
      const bianGuaCode = guaCode.map(y => y === 3 ? 2 : (y === 0 || y === 4 ? 1 : y))
      // 变卦六亲始终依据本卦宫位
      const bianYao = calculateLiuQin(bianGuaCode, benGua.palace) 
      const bianYaoWithShiYing = calculateShiYing(bianYao, bianGua.palace, bianGua.type)
      
      const monthBranch = ganZhi.month.replace('月','').slice(-1) || ''
      const dayBranch = ganZhi.day.replace('日','').slice(-1) || ''
      
      // 旺衰判定
      yaosWithShiYing.forEach((yao, index) => {
        const type = guaCode[index];
        const isMoving = (type === 3 || type === 0 || type === 4);
        (yao as any).tags = calculateYaoTags(yao.dizhi, monthBranch, dayBranch, isMoving, xunkongList);
      })

      bianYaoWithShiYing.forEach((yao) => {
        (yao as any).tags = calculateYaoTags(yao.dizhi, monthBranch, dayBranch, false, xunkongList);
      })
      
      // === 3. 伏神/藏爻 ===
      const presentLiuQin = new Set(yaosWithShiYing.map(y => y.liuqin))
      const rootGuaName = BEN_GONG_MAP[benGua.palace]
      const rootGua = GUA64.find(g => g.name === rootGuaName)
      const cangYaoList: (CangYaoItem | null)[] = []
      
      if (rootGua) {
        const rootYaos = calculateLiuQin([...rootGua.code], benGua.palace)
        for (let i = 0; i < 6; i++) {
          const rootYao = rootYaos[i]
          const benYao = yaosWithShiYing[i]
          const isFu = !presentLiuQin.has(rootYao.liuqin)
          const isDifferent = rootYao.dizhi !== benYao.dizhi
          cangYaoList.push({
            liuqin: rootYao.liuqin,
            dizhi: rootYao.dizhi,
            isFu: isFu, 
            show: isDifferent 
          })
        }
      } else {
        for(let i=0; i<6; i++) cangYaoList.push(null)
      }

      // === 4. 神煞 ===
      const yearZhi = ganZhi.year.replace('年','').slice(-1) || ''
      const shiYao = yaosWithShiYing.find(y => y.isShi);
      const shiData = shiYao ? { position: shiYao.position, type: shiYao.type } : undefined;
      const shenshaMap = calculateShenSha(ganZhi.day[0], dayBranch, monthBranch, yearZhi, shiData)
      
      // 动爻索引
      const dongYaoList: number[] = []
      guaCode.forEach((yao, index) => {
        if (yao === 3 || yao === 0 || yao === 4) dongYaoList.push(index + 1)
      })
      
      const extendedObj: GuaLi = {
        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Date.now().toString() + Math.floor(Math.random() * 1000),
        moduleType: 'liuyao',
        schemaVersion: CURRENT_GUALI_SCHEMA_VERSION,
        timestamp: time.getTime(),
        reason,
        time,
        benGua: { ...benGua, yaos: yaosWithShiYing },
        bianGua: { ...bianGua, yaos: bianYaoWithShiYing },
        dongYaoList,
        tags: [],
        xunkong: xunkongStr,
        hiddenYaos: [], 
        cangYaoList: cangYaoList,
        shensha: shenshaMap,
        bazi: `${ganZhi.year} ${ganZhi.month} ${ganZhi.day} ${ganZhi.hour}`,
        shenshaList: Object.entries(shenshaMap).map(([k, v]) => `${k}-${v}`)
      }
      
      return extendedObj
    } catch (error) {
      console.error("calculateGua Error:", error)
      throw error
    }
  }

  // 基础起卦
  const castGua = (y1:number, y2:number, y3:number, y4:number, y5:number, y6:number, t:Date, r:string) => {
    const code = [y1,y2,y3,y4,y5,y6].map(Number)
    const benSearch = code.map(y => y===3?1:(y===0||y===4?2:y))
    const ben = findGuaByCode(benSearch)
    const bianSearch = code.map(y => y===3?2:(y===0||y===4?1:y))
    const bian = findGuaByCode(bianSearch)
    if(!ben || !bian) return null
    const res = calculateGuaInternal(ben, bian, code, t, r)
    currentGuaLi.value = res
    return res
  }

  // 梅花起卦辅助逻辑
  const castMeiHua = (upper: number, lower: number, movingPos: number, time: Date, reason: string) => {
    const lowerArr = MEI_HUA_CODE[lower]
    const upperArr = MEI_HUA_CODE[upper]
    if (!lowerArr || !upperArr) return null
    const code = [...lowerArr, ...upperArr]
    const idx = movingPos - 1
    if (code[idx] === 1) code[idx] = 3
    else if (code[idx] === 2) code[idx] = 0
    return castGua(code[0], code[1], code[2], code[3], code[4], code[5], time, reason)
  }

  // 辅助起卦：时间
  const castGuaByTime = (date: Date, reason: string) => {
    // 处理子时切换
    let d = new Date(date.getTime());
    if (d.getHours() >= 23) {
      d.setDate(d.getDate() + 1);
    }

    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = date.getHours() // 时辰计算仍使用原始小时

    const yearZhi = (year - 4) % 12 + 1
    let hourZhi = (hour === 23 || hour === 0) ? 1 : Math.floor((hour + 1) / 2) + 1
    if (hourZhi > 12) hourZhi = 1
    const topSum = yearZhi + month + day
    const bottomSum = topSum + hourZhi
    let upper = topSum % 8 || 8
    let lower = bottomSum % 8 || 8
    let moving = bottomSum % 6 || 6
    return castMeiHua(upper, lower, moving, date, reason)
  }

  // 辅助起卦：数字 (已修复：使用传入的 date 参数)
  const castGuaByNumber = (num1: string, num2: string | null, reason: string, date: Date) => {
    if (num2) {
      const n1 = parseInt(num1)
      const n2 = parseInt(num2)
      return castMeiHua(n1 % 8 || 8, n2 % 8 || 8, (n1+n2) % 6 || 6, date, reason)
    } else {
      const str = num1.replace(/\D/g, '')
      if(!str) return null
      const mid = Math.floor(str.length / 2)
      const s1 = str.slice(0, mid).split('').reduce((a,b)=>a+parseInt(b),0)
      const s2 = str.slice(mid).split('').reduce((a,b)=>a+parseInt(b),0)
      return castMeiHua(s1 % 8 || 8, s2 % 8 || 8, (s1+s2) % 6 || 6, date, reason)
    }
  }

  // 辅助起卦：汉字 (已修复：使用传入的 date 参数)
  const castGuaByKanji = (text: string, reason: string, date: Date) => {
    const str = text.trim()
    if (!str) return null
    const len = str.length
    if (len === 1) {
      const c = str.charCodeAt(0)
      return castMeiHua((c >> 8) % 8 || 8, (c & 255) % 8 || 8, c % 6 || 6, date, reason)
    }
    const mid = Math.floor(len / 2)
    let s1 = 0; for(let i=0; i<mid; i++) s1 += str.charCodeAt(i)
    let s2 = 0; for(let i=mid; i<len; i++) s2 += str.charCodeAt(i)
    return castMeiHua(s1 % 8 || 8, s2 % 8 || 8, (s1+s2) % 6 || 6, date, reason)
  }

  // === 文本生成 ===
  const generateGuaText = (g: GuaLi, options: { withHidden?: boolean, withAllBian?: boolean, withPosition?: boolean } = {}) => {
    const withPosition = options.withPosition || false
    const withHidden = !!options.withHidden
    const useTableFormat = withHidden || withPosition
    const isStatic = g.dongYaoList.length === 0

    let txt = `占问事项：${g.reason}\n`
    if (g.category) txt += `分类：${g.category}\n`
    if (g.gender) txt += `性别：${g.gender}\n`
    if (g.tags?.length) txt += `标签：${g.tags.join('，')}\n`
    txt += `起卦时间：${new Date(g.time).toLocaleString()}\n`
    txt += `干支：${g.bazi} (旬空：${g.xunkong})\n`
    txt += `神煞：${g.shenshaList.map(s => s.replace('-', '--')).join('  ')}\n\n`

    txt += `本卦：${g.benGua.name} (${g.benGua.palace}-${g.benGua.type})`
    if (g.bianGua && !isStatic) {
        txt += `       变卦：${g.bianGua.name} (${g.bianGua.palace}-${g.bianGua.type})`
    }
    txt += `\n\n`

    const benYaos = [...g.benGua.yaos].reverse()
    const bianYaos = g.bianGua ? [...g.bianGua.yaos].reverse() : []
    const positionNames = ["上爻", "五爻", "四爻", "三爻", "二爻", "初爻"]

    const yuePoList: string[] = []
    const kongWangList: string[] = []
    const anDongList: string[] = []
    const fuYaoDetails: string[] = []

    const rows: { leftStr: string, rightStr: string, needsRight: boolean }[] = []
    let maxLeftVisualLen = 0

    /** 带藏爻表格用：变卦列拆成三段再拼，避免「' / " / 世 / 应」长短不一导致列内不齐 */
    type TableRow = {
      c0?: string
      c1: string
      c2: string
      c3: string
      c4: string
      bianBody?: string
      bianSym?: string
      bianMark?: string
    }
    const tableRows: TableRow[] = []
    const includeBianCol = !!(g.bianGua && !isStatic)

    benYaos.forEach((yao, idx) => {
      const pos = yao.position
      const tags = (yao as any).tags || []
      const posName = positionNames[idx]
      const yaoZhiFull = `${yao.dizhi}${WUXING_MAP[yao.dizhi] || ''}`
      const yaoRef = `${posName}${yaoZhiFull}`
      const isDongYao = g.dongYaoList.includes(pos)
      
      // 1. 本卦标记收集
      if (tags.includes('月破')) yuePoList.push(yaoRef)
      if (tags.includes('空亡')) kongWangList.push(yaoRef)
      if (tags.includes('暗动') || tags.includes('日破')) anDongList.push(yaoRef)

      // 无论是否勾选“显示藏爻”，都要检查伏神并存入 fuYaoDetails 以便在底部显示
      const cy = g.cangYaoList[pos - 1]
      if (cy && cy.isFu) {
          const cyContent = `${cy.liuqin}${cy.dizhi}${WUXING_MAP[cy.dizhi] || ''}`
          fuYaoDetails.push(`${posName}${cyContent}`)
      }

      const benWx = WUXING_MAP[yao.dizhi] || ''
      let benContent = `${yao.liuqin}${yao.dizhi}${benWx}`
      if (yao.type === 3) benContent += " O"
      else if ((yao.type as number) === 0 || yao.type === 4) benContent += " X"
      else if (yao.type === 1) benContent += " '"
      else benContent += " \""
      
      if (yao.isShi) benContent += " 世"
      else if (yao.isYing) benContent += " 应"

      let rowRight = ""
      let needsRight = false
      let bianBodyPart = ""
      let bianSymPart = ""
      let bianMarkPart = ""

      if (g.bianGua && !isStatic) {
          const bYao = bianYaos[idx]
          const bTags = (bYao as any).tags || []
          const bYaoZhiFull = `${bYao.dizhi}${WUXING_MAP[bYao.dizhi] || ''}`
          const bYaoRef = `变${posName}${bYaoZhiFull}`
          
          // 【重要修复】：变爻的标记只有在该位置是动爻时才收集
          if (isDongYao) {
              if (bTags.includes('月破')) yuePoList.push(bYaoRef)
              if (bTags.includes('空亡')) kongWangList.push(bYaoRef)
              if (bTags.includes('暗动') || bTags.includes('日破')) anDongList.push(bYaoRef)
          }
          
          if (options.withAllBian || isDongYao) {
              needsRight = true
              const bWx = WUXING_MAP[bYao.dizhi] || ''
              bianBodyPart = `${bYao.liuqin}${bYao.dizhi}${bWx}`
              bianSymPart = bYao.type === 1 || bYao.type === 3 ? " '" : " \""
              bianMarkPart = bYao.isShi ? " 世" : bYao.isYing ? " 应" : ""
              rowRight = bianBodyPart + bianSymPart + bianMarkPart
          }
      }

      if (useTableFormat) {
        let c2 = ""
        if (cy && (cy.isFu || (withHidden && cy.show))) {
          const cyWx = WUXING_MAP[cy.dizhi] || ""
          const body = `${cy.liuqin}${cy.dizhi}${cyWx}`
          c2 = body
        }
        const c1 = yao.liushen
        const row: TableRow = { c1, c2, c3: benContent, c4: "" }
        if (withPosition) row.c0 = posName
        if (includeBianCol && needsRight) {
          row.bianBody = bianBodyPart
          row.bianSym = bianSymPart
          row.bianMark = bianMarkPart
        }
        tableRows.push(row)
      } else {
        let rowLeft = withPosition ? `${posName} ` : ""
        rowLeft += `${yao.liushen} `
        rowLeft += benContent

        if (needsRight) {
            const vLen = getVisualLength(rowLeft)
            if (vLen > maxLeftVisualLen) maxLeftVisualLen = vLen
        }
        rows.push({ leftStr: rowLeft, rightStr: rowRight, needsRight })
      }
    })

    if (useTableFormat) {
      const gapStr = '\u3000'
      const h0 = "爻位"
      const h1 = "六神"
      const h2 = "藏爻"
      const h3 = "本卦"
      const h4 = "变卦"
      // 变卦：阴阳符号前导空格+1 个 ASCII 计 2；世/应「 世」「 应」计 3 视觉宽，不足则垫满便于上下对齐
      const BIAN_MARK_VISUAL = 3

      if (includeBianCol) {
        let maxBianBody = 0
        tableRows.forEach((r) => {
          if (r.bianBody !== undefined) {
            maxBianBody = Math.max(maxBianBody, getVisualLength(r.bianBody))
          }
        })
        tableRows.forEach((r) => {
          if (r.bianBody !== undefined && r.bianSym !== undefined) {
            r.c4 =
              padStringVisual(r.bianBody, maxBianBody) +
              r.bianSym +
              padStringVisual(r.bianMark ?? '', BIAN_MARK_VISUAL)
          }
        })
      }

      let mw0 = withPosition ? getVisualLength(h0) : 0
      let mw1 = getVisualLength(h1)
      let mw2 = getVisualLength(h2)
      let mw3 = getVisualLength(h3)
      let mw4 = includeBianCol ? getVisualLength(h4) : 0
      tableRows.forEach((r) => {
        if (withPosition && r.c0) mw0 = Math.max(mw0, getVisualLength(r.c0))
        mw1 = Math.max(mw1, getVisualLength(r.c1))
        mw2 = Math.max(mw2, getVisualLength(r.c2))
        mw3 = Math.max(mw3, getVisualLength(r.c3))
        if (includeBianCol) mw4 = Math.max(mw4, getVisualLength(r.c4))
      })
      if (withPosition) txt += `${padStringVisual(h0, mw0)}${gapStr}`
      txt += `${padStringVisual(h1, mw1)}${gapStr}${padStringVisual(h2, mw2)}${gapStr}${padStringVisual(h3, mw3)}`
      if (includeBianCol) txt += `${gapStr}${padStringVisual(h4, mw4)}`
      txt += "\n"
      tableRows.forEach((r) => {
        if (withPosition) txt += `${padStringVisual(r.c0 ?? '', mw0)}${gapStr}`
        txt += `${padStringVisual(r.c1, mw1)}${gapStr}${padStringVisual(r.c2, mw2)}${gapStr}${padStringVisual(r.c3, mw3)}`
        if (includeBianCol) txt += `${gapStr}${padStringVisual(r.c4, mw4)}`
        txt += "\n"
      })
    } else {
      const GAP_WIDTH = 4
      rows.forEach(row => {
          if (row.needsRight) {
              const paddedLeft = padStringVisual(row.leftStr, maxLeftVisualLen)
              txt += `${paddedLeft}${' '.repeat(GAP_WIDTH)}${row.rightStr}\n`
          } else {
              txt += row.leftStr + "\n"
          }
      })
    }

    // 【修改】：分隔符换成 #######
    txt += `########################################\n`
    txt += `月破：${yuePoList.length > 0 ? yuePoList.join('，') : '无'}\n`
    txt += `空亡：${kongWangList.length > 0 ? kongWangList.join('，') : '无'}\n`
    txt += `伏爻：${fuYaoDetails.length > 0 ? fuYaoDetails.join('，') : '无'}\n`
    txt += `暗动/日破：${anDongList.length > 0 ? anDongList.join('，') : '无'}\n`

    if (g.duangua) txt += `\n断语：\n${g.duangua}\n`
    return txt
  }

  const calculateGua = calculateGuaInternal

  return {
    currentGuaLi,
    castGua,
    calculateGua,
    castGuaByTime,
    castGuaByNumber,
    castGuaByKanji,
    generateGuaText
  }
}
