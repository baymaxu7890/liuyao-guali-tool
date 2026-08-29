// src/utils/wangshuai.ts

export const EARTH_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 地支六冲表
const LIU_CHONG_MAP: Record<string, string> = {
  '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥',
  '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
};

const BRANCH_WUXING: Record<string, string> = {
  '子': '水', '亥': '水', '寅': '木', '卯': '木', '巳': '火', '午': '火',
  '申': '金', '酉': '金', '辰': '土', '戌': '土', '丑': '土', '未': '土'
};

/** 月令旺、相五行（四季月按土旺） */
const MONTH_WANG_XIANG: Record<string, { wang: string; xiang: string }> = {
  '寅': { wang: '木', xiang: '火' }, '卯': { wang: '木', xiang: '火' },
  '巳': { wang: '火', xiang: '土' }, '午': { wang: '火', xiang: '土' },
  '申': { wang: '金', xiang: '水' }, '酉': { wang: '金', xiang: '水' },
  '亥': { wang: '水', xiang: '木' }, '子': { wang: '水', xiang: '木' },
  '辰': { wang: '土', xiang: '金' }, '戌': { wang: '土', xiang: '金' },
  '丑': { wang: '土', xiang: '金' }, '未': { wang: '土', xiang: '金' },
};

/** 静爻在月令是否旺相有气（旺、相） */
function isYaoWangXiangQi(yaoBranch: string, monthBranch: string): boolean {
  const yaoWx = BRANCH_WUXING[yaoBranch];
  const mx = MONTH_WANG_XIANG[monthBranch];
  if (!yaoWx || !mx) return false;
  return yaoWx === mx.wang || yaoWx === mx.xiang;
}

/**
 * 计算爻的状态标签（月破、空亡、暗动、日破）
 * @param yaoBranch 爻的地支
 * @param monthBranch 月令
 * @param dayBranch 日令
 * @param isMoving 是否动爻
 * @param xunKongList 旬空列表
 */
export function calculateYaoTags(
  yaoBranch: string, 
  monthBranch: string, 
  dayBranch: string, 
  _isMoving: boolean,
  xunKongList: string[]
): string[] {
  const tags: string[] = [];

  // 1. 月破：与月令相冲
  if (LIU_CHONG_MAP[monthBranch] === yaoBranch) {
    tags.push('月破');
  }

  // 2. 空亡：在旬空列表中
  if (xunKongList.includes(yaoBranch)) {
    tags.push('空亡');
  }

  // 3. 暗动 / 日破：被日辰相冲（月破除外；含动爻，动而日冲亦入统计）
  //    旺相有气 → 暗动；空亡或休囚无气 → 日破
  if (LIU_CHONG_MAP[dayBranch] === yaoBranch && !tags.includes('月破')) {
    const isEmpty = tags.includes('空亡');
    if (isEmpty || !isYaoWangXiangQi(yaoBranch, monthBranch)) {
      tags.push('日破');
    } else {
      tags.push('暗动');
    }
  }

  return tags;
}
