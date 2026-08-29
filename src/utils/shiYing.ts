import type { Yao } from '@/types'

// 辅助：获取三爻（八卦）的数值数组 [初, 二, 三] - 已删除未使用函数

// 比较两个八卦是否相同 (0/1数组)
function isSame(t1: number[], t2: number[]) {
  return t1[0] === t2[0] && t1[1] === t2[1] && t1[2] === t2[2]
}

/**
 * 计算世应位置 - 严谨算法版
 * 逻辑：
 * 1. 八纯卦 (内外同) -> 世在6
 * 2. 逐爻变 (从初爻起)，变到哪爻内外相同，世就在哪
 * 3. 变到5爻仍不同 -> 游魂 (世在4)
 * 4. 游魂再变下爻 (实际上是变回第4爻) -> 归魂 (世在3)
 */
export function calculateShiYing(yaos: Yao[], _palace: string, _type: string): Yao[] {
  // 提取全卦的0/1形态 (1=阳, 0=阴)
  const bits = yaos.map(y => (y.type === 1 || y.type === 3) ? 1 : 0)

  // 获取初始的下卦和上卦
  let lower = [bits[0], bits[1], bits[2]]
  let upper = [bits[3], bits[4], bits[5]]

  let shiPos = 0

  // 步骤1: 判断八纯卦
  if (isSame(lower, upper)) {
    shiPos = 6
  } else {
    // 步骤2: 逐爻变化法
    // 1变 (初爻)
    lower[0] = lower[0] === 1 ? 0 : 1
    if (isSame(lower, upper)) {
      shiPos = 1
    } else {
      // 2变 (二爻)
      lower[1] = lower[1] === 1 ? 0 : 1
      if (isSame(lower, upper)) {
        shiPos = 2
      } else {
        // 3变 (三爻)
        lower[2] = lower[2] === 1 ? 0 : 1
        if (isSame(lower, upper)) {
          shiPos = 3
        } else {
          // 4变 (四爻) - 注意：此时lower已全变，相当于在比较变了的下卦和上卦
          // 按照京房法，继续往上变
          // 实际上是改变"自身"去靠近"目标"。
          // 我们这里用全卦bits模拟更直观
          
          // 重置bits为当前状态 (即下三爻已变)
          // 此时 bits[0,1,2] 已经翻转过了
          
          // 4变: 变第4爻 (索引3)
          // 但为了算法通用性，我们这里模拟"变了第4爻后，上下是否相同"
          // 注意：这里的"上下相同"是指：下卦是否等于上卦
          // 此时 lower 已经是 [~b0, ~b1, ~b2]
          // 我们要变的是 upper 的第1爻 (即全卦第4爻) 吗？
          // 不，京房纳甲变法是：
          // 一世: 变初
          // 二世: 变初、二
          // ...
          // 四世: 变初、二、三、四
          
          // 让我们用最原始的模拟：
          const originalBits = yaos.map(y => (y.type === 1 || y.type === 3) ? 1 : 0)
          const check = (currentBits: number[]) => {
             const l = [currentBits[0], currentBits[1], currentBits[2]]
             const u = [currentBits[3], currentBits[4], currentBits[5]]
             return isSame(l, u)
          }
          
          // 显式声明为 number[] 以允许位运算赋值
          let curr: number[] = [...originalBits]
          
          // 1变
          curr[0] = curr[0]^1; if(check(curr)) shiPos=1
          else {
             // 2变
             curr[1] = curr[1]^1; if(check(curr)) shiPos=2
             else {
                // 3变
                curr[2] = curr[2]^1; if(check(curr)) shiPos=3
                else {
                   // 4变
                   curr[3] = curr[3]^1; if(check(curr)) shiPos=4
                   else {
                      // 5变
                      curr[4] = curr[4]^1; if(check(curr)) shiPos=5
                      else {
                         // 游魂卦: 第4爻变回原样 (从5变的状态往回变第4爻)
                         curr[3] = curr[3]^1; // 此时是 1,2,3,5变了, 4没变
                         if(check(curr)) shiPos=4 // 游魂
                         else {
                            // 归魂卦: 下三爻全部变回原样 (即只剩5变了?? 不对)
                            // 归魂定义: 游魂后，下三爻恢复。
                            // 实际上归魂是：世在3
                            shiPos = 3 
                         }
                      }
                   }
                }
             }
          }
        }
      }
    }
  }

  // 计算应爻
  let yingPos = shiPos + 3
  if (yingPos > 6) yingPos -= 6

  return yaos.map((yao) => {
    return {
      ...yao,
      isShi: yao.position === shiPos,
      isYing: yao.position === yingPos
    }
  })
}