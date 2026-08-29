import { defineStore } from 'pinia'
import type { GuaLi } from '@/types'
import { useGuaPan } from '@/composables/useGuaPan'
import { categoryToFilterTag } from '@/utils/category'
import { CURRENT_GUALI_SCHEMA_VERSION, GUALI_BACKUP_FORMAT, extractBackupRecords, normalizeGuaLi, type GuaLiBackup } from '@/utils/guaLiData'
import { queueLocalBackup } from '@/services/localBackup'
import { queueCloudBackup } from '@/services/cloudBackup'

export const useGuaLiStore = defineStore('guaLi', {
  state: () => ({
    guaLiList: [] as GuaLi[],
    currentGuaLi: null as GuaLi | null,
    filterTag: '全部' as string,
    searchKeyword: '',
    showImportModal: false 
  }),

  getters: {
    filteredList: (state) => {
      let list = [...state.guaLiList]
      list.sort((a, b) => b.timestamp - a.timestamp)
      
      if (state.filterTag !== '全部') {
        list = list.filter(g =>
          (g.tags || []).includes(state.filterTag) || categoryToFilterTag(g.category) === state.filterTag
        )
      }
      if (state.searchKeyword) {
        const keyword = state.searchKeyword.toLowerCase()
        list = list.filter(g => 
          g.reason.toLowerCase().includes(keyword) || 
          g.benGua.name.toLowerCase().includes(keyword) || 
          (g.tags && g.tags.some(t => t.toLowerCase().includes(keyword))) ||
          (g.bianGua?.name.toLowerCase().includes(keyword) ?? false) ||
          (g.duangua && g.duangua.toLowerCase().includes(keyword))
        )
      }
      return list
    },
    totalCount: (state) => state.guaLiList.length,
    todayCount: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return state.guaLiList.filter(g => {
        const gDate = new Date(g.time)
        gDate.setHours(0, 0, 0, 0)
        return gDate.getTime() === today.getTime()
      }).length
    }
  },

  actions: {
    setShowImportModal(visible: boolean) {
      this.showImportModal = visible
    },

    setCurrentGuaLi(guaLi: GuaLi | null) {
      this.currentGuaLi = guaLi
    },

    saveTempGua(guaLi: GuaLi) {
      localStorage.setItem('temp_gua_' + guaLi.id, JSON.stringify(guaLi))
      this.setCurrentGuaLi(guaLi)
    },

    loadGuaLiById(id: string): boolean {
      const foundInList = this.guaLiList.find(g => g.id === id)
      if (foundInList) {
        this.currentGuaLi = foundInList
        return true
      }
      const tempJson = localStorage.getItem('temp_gua_' + id)
      if (tempJson) {
        try {
          const normalized = normalizeGuaLi(JSON.parse(tempJson))
          if (normalized) {
            this.currentGuaLi = normalized
            localStorage.setItem('temp_gua_' + id, JSON.stringify(normalized))
            return true
          }
        } catch (e) {
          console.error('加载临时卦例失败', e)
        }
      }
      this.currentGuaLi = null
      return false
    },

    addGuaLiToList(guaLi: GuaLi) {
      const normalized = normalizeGuaLi(guaLi)
      if (!normalized) return
      guaLi = normalized
      const index = this.guaLiList.findIndex(g => g.id === guaLi.id)
      if (index > -1) {
        this.guaLiList[index] = guaLi
      } else {
        this.guaLiList.unshift(guaLi)
      }
      localStorage.setItem('temp_gua_' + guaLi.id, JSON.stringify(guaLi))
      this.saveListToStorage()
    },
    
    importParsedGua(parsedData: any) {
      const { castGua } = useGuaPan()
      const codes = parsedData._tempCode as number[]
      if (!codes || codes.length !== 6) return

      const newGua = castGua(
        codes[0], codes[1], codes[2], codes[3], codes[4], codes[5],
        new Date(parsedData.time),
        parsedData.reason
      )

      if (newGua) {
        newGua.category = parsedData.category
        newGua.gender = parsedData.gender
        newGua.duangua = parsedData.duangua || ''
        if (parsedData.tags && parsedData.tags.length) {
            newGua.tags = [...newGua.tags, ...parsedData.tags]
        }
        const categoryTag = categoryToFilterTag(newGua.category)
        if (categoryTag && !newGua.tags.includes(categoryTag)) newGua.tags.push(categoryTag)
        
        this.addGuaLiToList(newGua)
      }
    },

    updateCurrentGuaLiInfo(duangua: string) {
      if (!this.currentGuaLi) return
      this.currentGuaLi.duangua = duangua
      const index = this.guaLiList.findIndex(g => g.id === this.currentGuaLi?.id)
      if (index > -1) {
        this.guaLiList[index].duangua = duangua
        this.saveListToStorage()
      }
      localStorage.setItem('temp_gua_' + this.currentGuaLi.id, JSON.stringify(this.currentGuaLi))
    },

    deleteGuaLi(id: string) {
      this.guaLiList = this.guaLiList.filter(g => g.id !== id)
      if (this.currentGuaLi?.id === id) {
        this.currentGuaLi = null
      }
      localStorage.removeItem('temp_gua_' + id)
      this.saveListToStorage()
    },
    
    // 【添加了这个缺失的方法】
    exportAllGuaLi(): GuaLi[] {
      return [...this.guaLiList]
    },

    createBackup(): GuaLiBackup {
      let geJueList: unknown[] | undefined
      const savedSongs = localStorage.getItem('geJueList')
      if (savedSongs) {
        try {
          const parsed = JSON.parse(savedSongs)
          if (Array.isArray(parsed)) geJueList = parsed
        } catch (_) {}
      }
      return {
        format: GUALI_BACKUP_FORMAT,
        version: CURRENT_GUALI_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        records: [...this.guaLiList],
        ...(geJueList ? { geJueList } : {})
      }
    },

    importBackup(payload: unknown): { imported: number; skipped: number } {
      const rawRecords = extractBackupRecords(payload)
      if (!rawRecords) return { imported: 0, skipped: 1 }

      let imported = 0
      let skipped = 0
      rawRecords.forEach(raw => {
        const normalized = normalizeGuaLi(raw)
        if (!normalized) {
          skipped++
          return
        }
        const index = this.guaLiList.findIndex(item => item.id === normalized.id)
        if (index > -1) this.guaLiList[index] = normalized
        else this.guaLiList.push(normalized)
        localStorage.setItem('temp_gua_' + normalized.id, JSON.stringify(normalized))
        imported++
      })

      const data = payload as any
      if (data && Array.isArray(data.geJueList)) {
        let existingSongs: unknown[] = []
        try {
          const savedSongs = JSON.parse(localStorage.getItem('geJueList') || '[]')
          if (Array.isArray(savedSongs)) existingSongs = savedSongs
        } catch (_) {}
        const songMap = new Map<string, unknown>()
        ;[...existingSongs, ...data.geJueList].forEach(song => songMap.set(JSON.stringify(song), song))
        localStorage.setItem('geJueList', JSON.stringify([...songMap.values()]))
      }
      this.saveListToStorage()
      return { imported, skipped }
    },

    setFilterTag(tag: string) {
      this.filterTag = tag
    },
    
    setSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
    },
    
    saveListToStorage() {
      localStorage.setItem('guaLiList', JSON.stringify(this.guaLiList))
      queueLocalBackup(() => this.createBackup())
      queueCloudBackup(() => this.createBackup())
    },
    
    loadFromLocalStorage() {
      const savedList = localStorage.getItem('guaLiList')
      if (savedList) {
        try {
            const parsed = JSON.parse(savedList)
            this.guaLiList = Array.isArray(parsed)
              ? parsed.map(normalizeGuaLi).filter((item): item is GuaLi => item !== null)
              : []
            this.saveListToStorage()
        } catch (e) { console.error('列表加载失败', e)}
      }
    }
  }
})
