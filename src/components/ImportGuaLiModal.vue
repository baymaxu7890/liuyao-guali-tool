<template>
  <div class="modal-overlay" v-if="visible" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>📄 导入卦例 / 恢复备份</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="input-section">
           <p class="hint">可选择“导出所有”生成的 JSON 备份，也可粘贴包含六爻符号（' " O X）的排盘文本。JSON 恢复采用合并方式，不会删除现有卦例。</p>
           <label class="file-picker">
             <span>📂 选择 JSON 或文本文件</span>
             <input type="file" accept=".json,.txt,application/json,text/plain" @change="handleFileChange">
           </label>
           <div v-if="fileName" class="file-name">已读取：{{ fileName }}</div>
           <textarea v-model="rawText" class="text-area" placeholder="也可以在此粘贴 JSON 备份或排盘文本..."></textarea>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">取消</button>
        <button class="btn btn-primary" :disabled="!rawText.trim()" @click="handleDirectImport">✅ 立即导入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGuaLiStore } from '@/stores/guaLiStore'
import { parseGuaLiText } from '@/utils/textParser'

const store = useGuaLiStore()
const rawText = ref('')
const errorMsg = ref('')
const fileName = ref('')

const visible = computed(() => store.showImportModal)

// 当弹窗打开时清空
watch(visible, (val) => {
  if(val) {
    rawText.value = ''
    errorMsg.value = ''
    fileName.value = ''
  }
})

const close = () => store.setShowImportModal(false)

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  errorMsg.value = ''
  try {
    rawText.value = await file.text()
    fileName.value = file.name
  } catch (_) {
    errorMsg.value = '文件读取失败，请重新选择或直接粘贴内容。'
  }
}

const handleDirectImport = () => {
  errorMsg.value = ''
  if (!rawText.value.trim()) return

  const content = rawText.value.trim()

  if (content.startsWith('{') || content.startsWith('[')) {
    try {
      const payload = JSON.parse(content)
      const result = store.importBackup(payload)
      if (result.imported > 0) {
        alert(`备份恢复完成：导入 ${result.imported} 条，跳过 ${result.skipped} 条。`)
        close()
        return
      }
      errorMsg.value = 'JSON 中没有可识别的卦例记录。'
      return
    } catch (_) {
      errorMsg.value = 'JSON 格式不正确，请确认文件没有损坏。'
      return
    }
  }

  const parsedText = parseGuaLiText(content)
  if (parsedText) {
    store.importParsedGua(parsedText)
    alert('文本卦例导入成功！')
    close()
  } else {
    errorMsg.value = '解析失败：没有找到完整的六爻符号，或文本格式无法识别。'
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 5000; display: flex; justify-content: center; align-items: center; }
.modal-card { background: white; width: 600px; max-width: 90%; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.modal-header { padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; }
.modal-header h3 { margin: 0; color: #2d3748; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #a0aec0; }
.modal-body { padding: 20px; flex: 1; overflow-y: auto; max-height: 70vh; }
.hint { font-size: 13px; color: #718096; margin-bottom: 8px; }
.file-picker { display: flex; align-items: center; justify-content: center; margin-bottom: 8px; padding: 9px 12px; border: 1px dashed #a0aec0; border-radius: 6px; background: #f7fafc; color: #4a5568; cursor: pointer; }
.file-picker:hover { border-color: #667eea; color: #667eea; }
.file-picker input { display: none; }
.file-name { margin-bottom: 8px; color: #2f855a; font-size: 12px; }
.text-area { width: 100%; height: 250px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 13px; resize: vertical; line-height: 1.5; }
.text-area:focus { border-color: #667eea; outline: none; }
.error-msg { margin-top: 10px; color: #e53e3e; font-size: 13px; background: #fff5f5; padding: 8px; border-radius: 4px; border: 1px solid #fed7d7; }
.modal-footer { padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px; background: #f8f9fa; }
.btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; transition: all 0.2s; }
.btn-secondary { background: #edf2f7; color: #4a5568; } .btn-secondary:hover { background: #e2e8f0; }
.btn-primary { background: #667eea; color: white; } .btn-primary:hover { background: #5a6fd1; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
