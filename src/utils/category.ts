const CATEGORY_FILTER_MAP: Record<string, string> = {
  '财运': '财运',
  '男问桃花/姻缘': '感情',
  '女问桃花/姻缘': '感情',
  '工作/事业': '事业',
  '考试/成绩': '学业',
  '疾病/医药': '健康'
}

export const categoryToFilterTag = (category?: string): string => {
  if (!category) return ''
  return CATEGORY_FILTER_MAP[category] || category
}
