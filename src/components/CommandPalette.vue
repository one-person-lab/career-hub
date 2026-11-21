<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { PhMagnifyingGlass, PhArrowRight } from '@phosphor-icons/vue'
import { sections, sectionIcon, primaryNav } from '../data/store'

const emit = defineEmits<{ (e: 'select', id: string): void; (e: 'close'): void }>()

const query = ref('')
const cursor = ref(0)
const input = ref<HTMLInputElement | null>(null)

/** 资料挂在哪个页面下，用来在结果里给一行来源提示 */
const HOST_LABEL: Record<string, string> = {
  'prep-jobs': '面试准备',
  'prep-know': '面试准备',
  'prep-war': '面试准备',
  library: '知识库',
  settings: '设置',
}

const pages = computed(() =>
  [
    ...primaryNav().map((s) => ({ id: s.id, label: s.label, hint: '', icon: sectionIcon(s.icon) })),
    { id: 'coach', label: '模拟问答', hint: '', icon: sectionIcon('mic') },
    ...sections
      .filter((s) => !s.builtin && s.docs.length)
      .map((s) => ({ id: s.id, label: s.label, hint: HOST_LABEL[s.host] || '', icon: sectionIcon(s.icon) })),
  ],
)

const docs = computed(() =>
  sections
    .filter((s) => !s.builtin)
    .flatMap((s) =>
      s.docs.map((d) => ({
        id: `${s.id}::${d.name}`,
        label: d.title,
        hint: s.label,
        icon: sectionIcon(s.icon),
      })),
    ),
)

const items = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return pages.value.slice(0, 12)
  const hit = (it: { label: string; hint: string }) => (it.label + it.hint).toLowerCase().includes(q)
  return [...docs.value.filter(hit), ...pages.value.filter(hit)].slice(0, 12)
})

function move(delta: number) {
  if (!items.value.length) return
  cursor.value = (cursor.value + delta + items.value.length) % items.value.length
}

function pick(id?: string) {
  const target = id ?? items.value[cursor.value]?.id
  if (target) emit('select', target)
  emit('close')
}

onMounted(async () => {
  await nextTick()
  input.value?.focus()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[14vh]" @click.self="emit('close')">
    <div class="w-[520px] max-w-[92vw] overflow-hidden rounded-lg border border-line-strong bg-raised shadow-pop">
      <div class="flex items-center gap-2 border-b border-line px-3">
        <PhMagnifyingGlass :size="15" weight="bold" class="shrink-0 text-ink-3" />
        <input
          ref="input"
          v-model="query"
          class="h-10 w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
          placeholder="跳到页面或资料…"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="pick()"
          @keydown.esc.prevent="emit('close')"
        />
        <span class="kbd shrink-0">esc</span>
      </div>

      <div class="max-h-[46vh] overflow-y-auto p-1.5">
        <p v-if="!items.length" class="px-3 py-6 text-center text-[12px] text-ink-3">没有匹配的内容</p>
        <button
          v-for="(it, i) in items"
          :key="it.id"
          class="row py-2 text-[13px]"
          :class="i === cursor ? 'bg-brand-weak text-ink' : 'text-ink-2'"
          @mouseenter="cursor = i"
          @click="pick(it.id)"
        >
          <span class="flex h-4 w-4 shrink-0 items-center justify-center text-ink-3">
            <component :is="it.icon" :size="15" weight="regular" />
          </span>
          <span class="min-w-0 flex-1 truncate">{{ it.label }}</span>
          <span class="shrink-0 text-[11px] text-ink-3">{{ it.hint }}</span>
          <PhArrowRight v-if="i === cursor" :size="12" weight="bold" class="shrink-0 text-ink-3" />
        </button>
      </div>

      <div class="flex items-center gap-3 border-t border-line px-3 py-2 text-[11px] text-ink-3">
        <span><span class="kbd">↑</span> <span class="kbd">↓</span> 选择</span>
        <span><span class="kbd">Enter</span> 打开</span>
        <span><span class="kbd">1</span>–<span class="kbd">3</span> 直跳页面</span>
      </div>
    </div>
  </div>
</template>
