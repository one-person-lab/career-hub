<script setup lang="ts">
import { computed } from 'vue'
import { PhFlagBanner as PhBrand } from '@phosphor-icons/vue'
import { primaryNav, sectionIcon, evidence, pipeline, isLive, navIdOf } from '../data/store'

const props = defineProps<{ current: string }>()
defineEmits<{ (e: 'select', id: string): void }>()

const items = computed(() =>
  primaryNav()
    .filter((s) => s.id !== 'settings')
    .map((s) => ({ id: s.id, label: s.label, icon: sectionIcon(s.icon) })),
)
const settings = primaryNav().find((s) => s.id === 'settings')

/** 右侧数字只放「现在还能推进的」 */
const badge = computed<Record<string, number>>(() => ({
  prep: pipeline.filter(isLive).length,
  evidence: evidence.filter((c) => c.impact.length === 0 || c.diagrams.length === 0).length,
}))

const lit = computed(() => {
  const page = navIdOf(props.current)
  return page === 'prep-know' ? 'prep' : page
})
</script>

<template>
  <aside class="flex w-[220px] shrink-0 flex-col border-r border-line bg-panel">
    <div class="flex h-[52px] items-center gap-2 px-4">
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-brand text-white">
        <PhBrand :size="12" weight="bold" />
      </span>
      <span class="truncate text-[13px] font-semibold text-ink">职业工作台</span>
    </div>

    <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pt-1">
      <button
        v-for="item in items"
        :key="item.id"
        class="row text-[13px] leading-[20px]"
        :class="lit === item.id ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'"
        @click="$emit('select', item.id)"
      >
        <span class="flex h-4 w-4 shrink-0 items-center justify-center" :class="lit === item.id ? 'text-ink' : 'text-ink-3'">
          <component :is="item.icon" :size="15" weight="regular" />
        </span>
        <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
        <span v-if="badge[item.id]" class="font-mono text-[10px] text-ink-3">{{ badge[item.id] }}</span>
      </button>
    </nav>

    <div v-if="settings" class="px-2 pb-2">
      <button
        class="row text-[12px] leading-[18px]"
        :class="lit === settings.id ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink-2'"
        @click="$emit('select', settings.id)"
      >
        <span class="flex h-4 w-4 shrink-0 items-center justify-center">
          <component :is="sectionIcon(settings.icon)" :size="14" weight="regular" />
        </span>
        <span class="min-w-0 flex-1 truncate">{{ settings.label }}</span>
      </button>
    </div>
  </aside>
</template>
