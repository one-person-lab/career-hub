<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhMagnifyingGlass, PhArrowLeft } from '@phosphor-icons/vue'
import SideNav from './components/SideNav.vue'
import CommandPalette from './components/CommandPalette.vue'
import HomeView from './views/HomeView.vue'
import PrepView from './views/PrepView.vue'
import CoachView from './views/CoachView.vue'
import EvidenceView from './views/EvidenceView.vue'
import LibraryView from './views/LibraryView.vue'
import DocView from './views/DocView.vue'
import SettingsView from './views/SettingsView.vue'
import { sectionById, navIdOf, primaryNav } from './data/store'

const current = ref('overview')
/** DocView 里要打开的那一篇；`板块::文档` 的写法由 go() 拆开 */
const docName = ref('')
const palette = ref(false)

function go(target: string) {
  const [page, doc] = target.split('::')
  current.value = page
  docName.value = doc || ''
}

/** 内置页面；不在这张表里的 id 一律交给通用板块渲染器 DocView */
const BUILTIN: Record<string, unknown> = {
  overview: HomeView,
  prep: PrepView,
  'prep-know': PrepView,
  warroom: PrepView,
  evidence: EvidenceView,
  library: LibraryView,
  coach: CoachView,
  settings: SettingsView,
}

const activeView = computed(() => BUILTIN[current.value] || DocView)
const isDocView = computed(() => activeView.value === DocView)

/** 文档页要板块 id；面试准备要页签。内置视图不传无关的 prop */
const extraProps = computed(() => {
  if (isDocView.value) return { id: current.value === 'settings' ? 'method' : current.value, doc: docName.value }
  if (current.value === 'prep') return { tab: 'jobs' }
  if (current.value === 'prep-know') return { tab: 'know' }
  if (current.value === 'warroom') return { tab: 'war' }
  return {}
})

const title = computed(() => {
  if (['prep-know', 'warroom'].includes(current.value)) return '面试准备'
  if (current.value === 'coach') return '模拟问答'
  if (current.value === 'settings') return '设置'
  return sectionById(current.value)?.label || '职业工作台'
})

/** 文档页回到它挂靠的那张页面 */
const backTo = computed(() => (current.value === 'settings' ? 'overview' : navIdOf(current.value)))

const QUICK = primaryNav().map((s) => s.id)

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
  if (n >= 1 && n <= QUICK.length) go(QUICK[n - 1])
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-base">
    <SideNav :current="current" @select="go" />

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-[52px] shrink-0 items-center gap-2 px-7">
        <button v-if="isDocView" class="btn btn-ghost -ml-2 !px-1.5" title="返回" @click="go(backTo)">
          <PhArrowLeft :size="13" weight="bold" />
        </button>
        <h1 class="shrink-0 text-[15px] font-semibold text-ink">{{ title }}</h1>

        <button class="btn btn-ghost ml-auto text-ink-3 hover:text-ink" @click="palette = true">
          <PhMagnifyingGlass :size="13" weight="bold" />
          <span class="kbd ml-1">Cmd K</span>
        </button>
      </header>

      <main class="min-h-0 flex-1 overflow-y-auto px-7 pb-10 pt-1">
        <component :is="activeView" :key="current" v-bind="extraProps" @go="go" />
      </main>
    </div>

    <CommandPalette v-if="palette" @select="go" @close="palette = false" />
  </div>
</template>
