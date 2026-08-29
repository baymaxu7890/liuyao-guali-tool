// src/utils/ganZhi.ts
import { Lunar, LunarUtil } from 'lunar-javascript';

const GAN_LIST = '甲乙丙丁戊己庚辛壬癸'.split('');
const MONTH_ZHI_LIST = '寅卯辰巳午未申酉戌亥子丑'.split('');
const HOUR_ZHI_LIST = '子丑寅卯辰巳午未申酉戌亥'.split('');

export interface GanZhi {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface GanZhiOptions {
  /** 晚子时换日：23:00 起按下一日的日柱、时柱计算 */
  lateZiDayBoundary?: boolean;
}

export const resolveGanZhiDate = (date: Date, options: GanZhiOptions = {}): Date => {
  const effectiveDate = new Date(date.getTime());
  if (options.lateZiDayBoundary && effectiveDate.getHours() >= 23) {
    effectiveDate.setDate(effectiveDate.getDate() + 1);
    effectiveDate.setHours(0);
  }
  return effectiveDate;
};

/**
 * 全项目统一的四柱干支口径：立春换年、节气换月；可选晚子时换日。
 */
export const calculateGanZhi = (date: Date, options: GanZhiOptions = {}): GanZhi => {
  const lunar = Lunar.fromDate(resolveGanZhiDate(date, options));
  return {
    year: lunar.getYearInGanZhiExact() + '年',
    month: lunar.getMonthInGanZhiExact() + '月',
    day: lunar.getDayInGanZhiExact() + '日',
    hour: lunar.getTimeInGanZhi() + '时'
  };
};

export const calculateXunKong = (dayGanZhi: string): string => {
  // 旬空计算需要纯干支（如“甲子”），如果带了“日”字要去掉
  const pureGanZhi = dayGanZhi.replace('日', '');
  return LunarUtil.getXunKong(pureGanZhi) + '空';
};

/** 五虎遁：根据年干生成寅月至丑月的十二个月柱。 */
export const getFiveTigerMonthPillars = (yearGanZhi: string): string[] => {
  const yearGanIndex = GAN_LIST.indexOf(yearGanZhi.trim()[0]);
  if (yearGanIndex < 0) return [];
  const yinMonthGanIndex = ((yearGanIndex % 5) * 2 + 2) % 10;
  return MONTH_ZHI_LIST.map((zhi, index) => GAN_LIST[(yinMonthGanIndex + index) % 10] + zhi);
};

/** 五鼠遁：根据日干生成子时至亥时的十二个时柱。 */
export const getFiveRatHourPillars = (dayGanZhi: string): string[] => {
  const dayGanIndex = GAN_LIST.indexOf(dayGanZhi.trim()[0]);
  if (dayGanIndex < 0) return [];
  const ziHourGanIndex = (dayGanIndex % 5) * 2;
  return HOUR_ZHI_LIST.map((zhi, index) => GAN_LIST[(ziHourGanIndex + index) % 10] + zhi);
};
