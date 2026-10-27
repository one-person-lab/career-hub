<script setup lang="ts">
import { computed } from 'vue'
import { PhFlagBanner as PhBrand } from '@phosphor-icons/vue'
import { sectionGroups, sectionIcon, evidence, pipeline, staleReview } from '../data/store'

defineProps<{ current: string }>()
defineEmits<{ (e: 'select', id: string): void }>()

/**
 * 导航完全由 build-data 输出的 sections 驱动。
 * 加一个 content/<目录>/ 就在侧栏多一项，这个文件不需要改。
 */
const groups = sectionGroups.map((g) => ({
  title: g.group,
  items: g.items.map((s) => ({
    id: s.id,
    label: s.label,
    icon: sectionIcon(s.icon),
    tone: s.tone,
  })),
}))

const liveCount = computed(() => pipeline.filter((p) => p.stage !== '已结束' && p.stage !== '暂停').length)

/** 右侧数字：只放「现在还能推进的」，不放总量 */
const badge = computed<Record<string, number>>(() => ({
  pipeline: liveCount.value,
  evidence: evidence.filter((c) => c.impact.length === 0 || c.diagrams.length === 0).length,
  knowledge: staleReview().length,
}))
</script>

<template>
  <aside class="flex w-[216px] shrink-0 flex-col border-r border-line bg-panel">
    <div class="flex h-11 items-center gap-2 border-b border-line px-3">
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-brand text-white">
        <PhBrand :size="12" weight="bold" />
      </span>
      <div class="min-w-0">
        <div class="truncate text-[13px] font-semibold leading-tight text-ink">职业工作台</div>
      </div>
    </div>

    <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
      <template v-for="group in groups" :key="group.title">
        <div class="group-head mt-1">{{ group.title }}</div>
        <button
          v-for="item in group.items"
          :key="item.id"
          class="row py-[5px] text-[13px]"
          :class="current === item.id ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'"
          @click="$emit('select', item.id)"
        >
          <span class="flex h-4 w-4 shrink-0 items-center justify-center" :class="current === item.id ? 'text-ink' : 'text-ink-3'">
            <component :is="item.icon" :size="15" weight="regular" />
          </span>
          <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
          <span v-if="badge[item.id]" class="font-mono text-[10px] text-ink-3">{{ badge[item.id] }}</span>
          <span v-else class="dot opacity-0" :class="item.tone" />
        </button>
      </template>
    </nav>
  </aside>
</template>
