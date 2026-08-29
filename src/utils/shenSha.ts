// src/utils/shenSha.ts

// 基础定义
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 获取索引
const getZhiIdx = (z: string) => DIZHI.indexOf(z);

// 辅助：获取季节 (用于天喜)
// 寅卯辰=春, 巳午未=夏, 申酉戌=秋, 亥子丑=冬
function getSeason(monthZhi: string): string {
  if (['寅', '卯', '辰'].includes(monthZhi)) return '春';
  if (['巳', '午', '未'].includes(monthZhi)) return '夏';
  if (['申', '酉', '戌'].includes(monthZhi)) return '秋';
  return '冬';
}

/**
 * 计算卦身 (古法：阳世则从子月起，阴世则从午月生)
 */
function calculateGuaShen(shiYaoPosition: number, shiYaoType: number): string {
  // type: 1,3=阳; 2,0,4=阴
  const isYang = (shiYaoType === 1 || shiYaoType === 3);
  let startZhi = isYang ? '子' : '午';
  let startIdx = getZhiIdx(startZhi);
  
  // 数到世爻位置 (position 是 1-based)
  // 初爻(1) = startIdx
  // 二爻(2) = startIdx + 1
  // 世爻(pos) = startIdx + (pos - 1)
  const shenIdx = (startIdx + (shiYaoPosition - 1)) % 12;
  return DIZHI[shenIdx];
}

/**
 * 计算古筮真诠 13 种常用神煞
 * @param dayGan 日干
 * @param dayZhi 日支
 * @param monthZhi 月支
 * @param shiData 世爻信息 { position: number, type: number } 用于算卦身
 */
export function calculateShenSha(dayGan: string, dayZhi: string, monthZhi: string, _yearZhi: string, shiData?: { position: number, type: number }) {
  const map: Record<string, string> = {};

  // === 0. 卦身 ===
  if (shiData) {
    map['卦身'] = calculateGuaShen(shiData.position, shiData.type);
  }

  // === 1. 贵人 (日干) ===
  // 甲戊并牛羊(丑未), 乙己鼠猴乡(子申), 丙丁猪鸡位(亥酉), 壬癸兔蛇藏(卯巳), 庚辛逢马虎(午寅)
  const guirenMap: Record<string, string> = {
    '甲': '丑未', '戊': '丑未',
    '乙': '子申', '己': '子申',
    '丙': '亥酉', '丁': '亥酉',
    '壬': '巳卯', '癸': '巳卯',
    '庚': '午寅', '辛': '午寅'
  };
  map['贵人'] = guirenMap[dayGan] || '';

  // === 2. 禄神 (日干) ===
  // 甲禄在寅, 乙禄在卯, 丙戊禄在巳, 丁己禄在午, 庚禄在申, 辛禄在酉, 壬禄在亥, 癸禄在子
  const luMap: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午',
    '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
  };
  map['禄神'] = luMap[dayGan] || '';

  // === 3. 羊刃 (日干) ===
  // 甲卯, 乙寅, 丙戊午, 丁己巳, 庚酉, 辛申, 壬子, 癸亥
  const yangrenMap: Record<string, string> = {
    '甲': '卯', '乙': '寅', 
    '丙': '午', '戊': '午', 
    '丁': '巳', '己': '巳', 
    '庚': '酉', '辛': '申', 
    '壬': '子', '癸': '亥'
  };
  map['羊刃'] = yangrenMap[dayGan] || '';

  // === 4. 文昌 (日干) ===
  // 甲巳, 乙午, 丙戊申, 丁己酉, 庚亥, 辛子, 壬寅, 癸卯
  const wenchangMap: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '戊': '申',
    '丁': '酉', '己': '酉', '庚': '亥', '辛': '子',
    '壬': '寅', '癸': '卯'
  };
  map['文昌'] = wenchangMap[dayGan] || '';

  // === 5. 驿马 (日支) ===
  // 申子辰马在寅, 巳酉丑马在亥, 寅午戌马在申, 亥卯未马在巳
  const yimaMap: Record<string, string> = {
    '申': '寅', '子': '寅', '辰': '寅',
    '巳': '亥', '酉': '亥', '丑': '亥',
    '寅': '申', '午': '申', '戌': '申',
    '亥': '巳', '卯': '巳', '未': '巳'
  };
  map['驿马'] = yimaMap[dayZhi] || '';

  // === 6. 桃花 (日支) ===
  // 申子辰在酉, 巳酉丑在午, 寅午戌在卯, 亥卯未在子
  const taohuaMap: Record<string, string> = {
    '申': '酉', '子': '酉', '辰': '酉',
    '巳': '午', '酉': '午', '丑': '午',
    '寅': '卯', '午': '卯', '戌': '卯',
    '亥': '子', '卯': '子', '未': '子'
  };
  map['桃花'] = taohuaMap[dayZhi] || '';

  // === 7. 将星 (日支) ===
  // 申子辰在子, 巳酉丑在酉, 寅午戌在午, 亥卯未在卯
  const jiangxingMap: Record<string, string> = {
    '申': '子', '子': '子', '辰': '子',
    '巳': '酉', '酉': '酉', '丑': '酉',
    '寅': '午', '午': '午', '戌': '午',
    '亥': '卯', '卯': '卯', '未': '卯'
  };
  map['将星'] = jiangxingMap[dayZhi] || '';

  // === 8. 劫煞 (日支) ===
  // 申子辰在巳, 巳酉丑在寅, 寅午戌在亥, 亥卯未在申
  const jieshaMap: Record<string, string> = {
    '申': '巳', '子': '巳', '辰': '巳',
    '巳': '寅', '酉': '寅', '丑': '寅',
    '寅': '亥', '午': '亥', '戌': '亥',
    '亥': '申', '卯': '申', '未': '申'
  };
  map['劫煞'] = jieshaMap[dayZhi] || '';

  // === 9. 华盖 (日支) ===
  // 申子辰在辰, 巳酉丑在丑, 寅午戌在戌, 亥卯未在未
  const huagaiMap: Record<string, string> = {
    '申': '辰', '子': '辰', '辰': '辰',
    '巳': '丑', '酉': '丑', '丑': '丑',
    '寅': '戌', '午': '戌', '戌': '戌',
    '亥': '未', '卯': '未', '未': '未'
  };
  map['华盖'] = huagaiMap[dayZhi] || '';

  // === 10. 谋星 (日支) ===
  // 申子辰在戌, 巳酉丑在未, 寅午戌在辰, 亥卯未在丑
  const mouxingMap: Record<string, string> = {
    '申': '戌', '子': '戌', '辰': '戌',
    '巳': '未', '酉': '未', '丑': '未',
    '寅': '辰', '午': '辰', '戌': '辰',
    '亥': '丑', '卯': '丑', '未': '丑'
  };
  map['谋星'] = mouxingMap[dayZhi] || '';

  // === 11. 天医 (月支) ===
  // 占卦之月的推上一位。如卯月见寅。
  const mIdx = getZhiIdx(monthZhi);
  const tianyiIdx = (mIdx - 1 + 12) % 12;
  map['天医'] = DIZHI[tianyiIdx];

  // === 12. 天喜 (季节) ===
  // 春戌, 夏丑, 秋辰, 冬未
  const season = getSeason(monthZhi);
  const tianxiMap: Record<string, string> = {
    '春': '戌', '夏': '丑', '秋': '辰', '冬': '未'
  };
  map['天喜'] = tianxiMap[season] || '';

  // === 13. 灾煞 (日支) ===
  // 申子辰在午, 巳酉丑在卯, 寅午戌在子, 亥卯未在酉
  const zaishaMap: Record<string, string> = {
    '申': '午', '子': '午', '辰': '午',
    '巳': '卯', '酉': '卯', '丑': '卯',
    '寅': '子', '午': '子', '戌': '子',
    '亥': '酉', '卯': '酉', '未': '酉'
  };
  map['灾煞'] = zaishaMap[dayZhi] || '';

  // 过滤掉空的
  Object.keys(map).forEach(key => {
      if (!map[key]) delete map[key];
  });

  return map;
}