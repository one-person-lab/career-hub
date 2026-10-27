<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhMagnifyingGlass, PhLightning } from '@phosphor-icons/vue'
import SideNav from './components/SideNav.vue'
import CommandPalette from './components/CommandPalette.vue'
import HomeView from './views/HomeView.vue'
import PipelineView from './views/PipelineView.vue'
import CoachView from './views/CoachView.vue'
import EvidenceView from './views/EvidenceView.vue'
import KnowledgeView from './views/KnowledgeView.vue'
import DocView from './views/DocView.vue'
import { sectionById, pipeline, knowledge, dueForReview, isLive } from './data/store'

const current = ref('overview')
const palette = ref(false)

/** 内置视图；不在这张表里的 id 一律交给通用板块渲染器 DocView */
const BUILTIN: Record<string, unknown> = {
  overview: HomeView,
  pipeline: PipelineView,
  coach: CoachView,
  evidence: EvidenceView,
  knowledge: KnowledgeView,
}

const activeView = computed(() => BUILTIN[current.value] || DocView)
const isDocView = computed(() => activeView.value === DocView)

/** 只有 DocView 需要 id；内置视图传了会落到根元素上，避免这个副作用 */
const extraProps = computed(() => (isDocView.value ? { id: current.value } : {}))

const section = computed(() => sectionById(current.value))

/** 顶栏副标题：一句话说清这一页现在有多少活 */
const hint = computed(() => {
  switch (current.value) {
    case 'overview':
      return `${pipeline.filter(isLive).length} 个岗位在推进 · ${dueForReview().filter((k) => (k.reviewAge ?? 9999) > 21).length} 个知识点待复习`
    case 'pipeline':
      return `${pipeline.length} 条投递记录 · 来自 content/00-Projects/岗位管道.md`
    case 'coach':
      return '对着具体岗位练，练完留下分数和短板'
    case 'evidence':
      return `${pipeline.reduce((s, p) => s + p.evidenceIds.length, 0)} 次被岗位引用`
    case 'knowledge':
      return `${knowledge.length} 张卡 · ${dueForReview().length} 张到期`
    default:
      return section.value?.group || ''
  }
})

const QUICK = ['overview', 'pipeline', 'coach', 'evidence', 'knowledge']

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    palette.value = !palette.value
    return
  }
  if (e.key === 'Escape') {
    palette.value = false
    return
  }
  if (isTyping(e.target)) return
  if (e.key === '/') {
    e.preventDefault()
    palette.value = true
    return
  }
  const n = Number(e.key)
  if (n >= 1 && n <= QUICK.length) current.value = QUICK[n - 1]
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-base">
    <SideNav :current="current" @select="current = $event" />

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
        <h1 class="shrink-0 text-[13px] font-semibold text-ink">{{ section?.label || '职业工作台' }}</h1>
        <span class="min-w-0 truncate text-[11px] text-ink-3">{{ hint }}</span>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <button class="btn btn-ghost" @click="palette = true">
            <PhMagnifyingGlass :size="13" weight="bold" />
            搜索
            <span class="kbd ml-1">⌘K</span>
          </button>
          <button class="btn btn-primary" @click="current = 'coach'">
            <PhLightning :size="13" weight="bold" />
            开始训练
          </button>
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        <component :is="activeView" :key="current" v-bind="extraProps" @go="current = $event" />
      </main>
    </div>

    <CommandPalette v-if="palette" @select="current = $event" @close="palette = false" />
  </div>
</template>
