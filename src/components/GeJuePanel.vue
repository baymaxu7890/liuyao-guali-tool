<template>
  <div class="panel-container">
    <div class="content-body">
      <div v-for="(item, index) in list" :key="index" class="gejue-item">
        <div class="item-header">
          <h4>{{ item.title }}</h4>
          <button class="del-btn" @click="deleteItem(index)" title="删除">🗑️</button>
        </div>
        <div class="item-text">
          <p v-for="(line, lIdx) in item.content.split('\n')" :key="lIdx">{{ line }}</p>
        </div>
      </div>
    </div>

    <div class="add-box">
      <div class="add-header" @click="showAdd = !showAdd">
        ➕ 添加新歌诀 {{ showAdd ? '▼' : '▶' }}
      </div>
      <div v-if="showAdd" class="add-form">
        <input v-model="newTitle" placeholder="标题 (如: 六兽歌)" class="form-input">
        <textarea v-model="newContent" placeholder="内容..." class="form-area"></textarea>
        <button class="btn-save" @click="addItem">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGuaLiStore } from '@/stores/guaLiStore'
import { queueLocalBackup } from '@/services/localBackup'
import { queueCloudBackup } from '@/services/cloudBackup'

interface GeJue { title: string; content: string }

const defaultGeJue: GeJue[] = [
  { title: "浑天甲子歌", content: "乾金甲子外壬午，坎水戊寅外戊申。\n震木庚子外庚午，艮土丙辰外丙戌。\n坤土乙未外癸丑，巽木辛丑外辛未。\n离火己卯外己酉，兑金丁巳外丁亥。" },
  { title: "天干与内脏对应", content: "甲肝乙胆丙小肠，丁心戊胃已脾乡。\n庚是大肠辛属肺，壬系膀胱癸肾藏。\n三焦亦是壬中寄，包络同归入癸方。" },
  { title: "八卦记忆口诀", content: "乾三连，坤六断。\n震仰盂，艮覆碗。\n兑上缺，巽下断。\n离中虚，坎中满。" }
]

const list = ref<GeJue[]>([])
const guaLiStore = useGuaLiStore()
const showAdd = ref(false)
const newTitle = ref('')
const newContent = ref('')

onMounted(() => {
  const saved = localStorage.getItem('geJueList')
  list.value = saved ? JSON.parse(saved) : [...defaultGeJue]
})

const save = () => {
  localStorage.setItem('geJueList', JSON.stringify(list.value))
  queueLocalBackup(() => guaLiStore.createBackup())
  queueCloudBackup(() => guaLiStore.createBackup())
}
const deleteItem = (index: number) => { if (confirm('确定删除?')) { list.value.splice(index, 1); save() } }
const addItem = () => {
  if (!newTitle.value || !newContent.value) return alert('请填写标题和内容')
  list.value.push({ title: newTitle.value, content: newContent.value })
  newTitle.value = ''; newContent.value = ''; showAdd.value = false; save()
}
</script>

<style scoped>
.panel-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 15px; max-height: 500px; overflow-y: auto; }
.content-body { padding: 20px; }
.gejue-item { margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 15px; }
.item-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.item-header h4 { color: #2d3748; margin: 0; font-size: 15px; border-left: 4px solid #667eea; padding-left: 8px;}
.del-btn { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.5; }
.item-text { font-size: 13px; color: #4a5568; line-height: 1.6; white-space: pre-wrap; background: #f7fafc; padding: 10px; border-radius: 6px;}
.add-box { padding: 15px; background: #f8f9fa; border-top: 1px solid #eee; position: sticky; bottom: 0; }
.add-header { cursor: pointer; font-weight: bold; color: #667eea; font-size: 13px; }
.add-form { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
.form-input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.form-area { padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 60px; }
.btn-save { padding: 8px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>
