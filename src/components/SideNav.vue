<script setup lang="ts">
import { PhFlagBanner as PhBrand, PhWarningCircle } from '@phosphor-icons/vue'
import { sectionGroups, sectionIcon, evidence, knowledge, emptySections, emptyCardDirs } from '../data/store'

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

const todo = emptySections().length + emptyCardDirs().length
const badge: Record<string, { n: number; cls: string }> = {
  overview: { n: todo, cls: 'status-creating' },
  evidence: { n: evidence.length, cls: 'status-ready' },
  knowledge: { n: knowledge.length, cls: 'status-ready' },
}

const hasBadge = (id: string): boolean => (badge[id]?.n || 0) > 0
</script>

<template>
  <aside class="neo-card flex w-60 shrink-0 flex-col self-start p-4">
    <div class="mb-4 flex items-center gap-2 px-1">
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border-2 border-black bg-neo-yellow text-black">
        <PhBrand :size="16" weight="bold" />
      </span>
      <div class="text-xl font-black leading-none tracking-tight">
        职业工作台
        <div class="mt-0.5 text-[11px] font-bold text-neutral-500">长期积累 · 求职</div>
      </div>
    </div>

    <nav class="flex flex-col gap-1.5">
      <template v-for="group in groups" :key="group.title">
        <div class="mt-3 px-2 text-xs font-bold text-neutral-500">{{ group.title }}</div>
        <button
          v-for="item in group.items"
          :key="item.id"
          class="flex items-center gap-2.5 rounded-[6px] border-2 px-2.5 py-2 text-left text-sm transition-colors"
          :class="
            current === item.id
              ? 'border-black bg-white font-black text-black shadow-neo-sm'
              : 'border-transparent font-bold hover:bg-neo-yellow/60'
          "
          @click="$emit('select', item.id)"
        >
          <span
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border-2 border-black text-black"
            :class="item.tone"
          >
            <component :is="item.icon" :size="14" weight="bold" />
          </span>
          <span class="min-w-0 flex-1">{{ item.label }}</span>
          <span v-if="hasBadge(item.id)" class="neo-chip !border-2 !px-1.5 !py-0 text-[10px]" :class="badge[item.id].cls">
            {{ badge[item.id].n }}
          </span>
        </button>
      </template>
    </nav>

    <div v-if="todo" class="mt-6 border-t-2 border-dashed border-neutral-300 pt-4">
      <p class="flex items-start gap-1.5 px-1 text-[11px] font-bold leading-tight text-neutral-500">
        <PhWarningCircle :size="12" weight="bold" class="mt-0.5 shrink-0" />
        还有 {{ todo }} 个板块是空的。骨架已经就位，填内容不用改代码。
      </p>
    </div>
  </aside>
</template>
