<template>
  <div class="gz-combobox" :class="{ disabled }">
    <label class="gz-label">{{ label }}</label>
    <div class="gz-input-wrap">
      <input
        :value="query"
        type="text"
        class="gz-input"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        @focus="openDropdown"
        @input="handleInput"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter.prevent="selectActive"
        @keydown.esc="isOpen = false"
        @blur="closeDropdown"
      />
      <button
        v-if="query && !disabled"
        type="button"
        class="clear-btn"
        aria-label="清空"
        @mousedown.prevent="clearSelection"
      >×</button>
    </div>

    <div v-if="isOpen && !disabled" class="gz-dropdown">
      <button
        v-for="(option, index) in filteredOptions"
        :key="option"
        type="button"
        :class="['gz-option', { active: index === activeIndex, selected: option === modelValue }]"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option }}
      </button>
      <div v-if="filteredOptions.length === 0" class="empty-option">没有符合条件的干支</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  options: string[]
  label: string
  placeholder: string
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const query = ref(props.modelValue)
const isOpen = ref(false)
const activeIndex = ref(-1)

const filteredOptions = computed(() => {
  const keyword = query.value.trim()
  if (!keyword) return props.options
  return props.options.filter(option => option.includes(keyword))
})

watch(() => props.modelValue, value => {
  query.value = value
})

watch(() => props.options, options => {
  if (props.modelValue && !options.includes(props.modelValue)) {
    emit('update:modelValue', '')
    query.value = ''
  }
}, { deep: true })

watch(filteredOptions, () => {
  activeIndex.value = filteredOptions.value.length ? 0 : -1
})

const openDropdown = () => {
  isOpen.value = true
  activeIndex.value = filteredOptions.value.length ? 0 : -1
}

const closeDropdown = () => {
  window.setTimeout(() => {
    isOpen.value = false
    if (!props.options.includes(query.value)) query.value = props.modelValue
  }, 120)
}

const handleInput = (event: Event) => {
  query.value = (event.target as HTMLInputElement).value.trim()
  isOpen.value = true
  const exactValue = props.options.includes(query.value) ? query.value : ''
  emit('update:modelValue', exactValue)
}

const selectOption = (option: string) => {
  query.value = option
  emit('update:modelValue', option)
  isOpen.value = false
}

const clearSelection = () => {
  query.value = ''
  emit('update:modelValue', '')
  isOpen.value = true
}

const moveActive = (step: number) => {
  if (!isOpen.value) openDropdown()
  const count = filteredOptions.value.length
  if (!count) return
  activeIndex.value = (activeIndex.value + step + count) % count
}

const selectActive = () => {
  const option = filteredOptions.value[activeIndex.value]
  if (option) selectOption(option)
}
</script>

<style scoped>
.gz-combobox { position: relative; flex: 1; min-width: 150px; }
.gz-combobox.disabled { opacity: 0.55; }
.gz-label { display: block; margin-bottom: 5px; color: #4a5568; font-size: 13px; font-weight: bold; }
.gz-input-wrap { position: relative; }
.gz-input { width: 100%; height: 34px; padding: 6px 28px 6px 9px; border: 1px solid #cbd5e0; border-radius: 5px; background: #fff; color: #2d3748; font-size: 14px; outline: none; }
.gz-input:focus { border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.12); }
.gz-input:disabled { background: #f7fafc; cursor: not-allowed; }
.clear-btn { position: absolute; top: 50%; right: 7px; transform: translateY(-50%); border: 0; background: transparent; color: #a0aec0; cursor: pointer; font-size: 18px; }
.gz-dropdown { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0; max-height: 210px; overflow-y: auto; padding: 4px; border: 1px solid #cbd5e0; border-radius: 6px; background: #fff; box-shadow: 0 8px 20px rgba(45, 55, 72, 0.16); }
.gz-option { display: block; width: 100%; padding: 7px 9px; border: 0; border-radius: 4px; background: #fff; color: #2d3748; text-align: left; cursor: pointer; }
.gz-option:hover, .gz-option.active { background: #edf2ff; }
.gz-option.selected { color: #4c51bf; font-weight: bold; }
.empty-option { padding: 10px 8px; color: #a0aec0; font-size: 13px; text-align: center; }
</style>

<style scoped>
.gz-label { color: var(--text-secondary); }
.gz-input { border-color: var(--border-color); color: var(--text-color); background: var(--paper-strong); }
.gz-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px var(--primary-soft); }
.gz-input:disabled { color: var(--text-muted); background: var(--surface-muted); }
.clear-btn, .empty-option { color: var(--text-muted); }
.gz-dropdown { border-color: var(--border-color); background: var(--paper-strong); box-shadow: 0 10px 24px var(--shadow-color); }
.gz-option { color: var(--text-color); background: var(--paper-strong); }
.gz-option:hover, .gz-option.active { background: var(--primary-soft); }
.gz-option.selected { color: var(--primary-color); }
</style>
