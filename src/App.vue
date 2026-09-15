<script setup lang="ts">
import { ref, computed } from 'vue'
import SideNav from './components/SideNav.vue'
import OverviewView from './views/OverviewView.vue'
import EvidenceView from './views/EvidenceView.vue'
import KnowledgeView from './views/KnowledgeView.vue'
import DocView from './views/DocView.vue'

const current = ref('overview')

/** 内置视图；不在这张表里的 id 一律交给通用板块渲染器 DocView */
const BUILTIN: Record<string, unknown> = {
  overview: OverviewView,
  evidence: EvidenceView,
  knowledge: KnowledgeView,
}

const activeView = computed(() => BUILTIN[current.value] || DocView)
const isDocView = computed(() => activeView.value === DocView)

/** 只有 DocView 需要 id；内置视图传了会落到根元素上，避免这个副作用 */
const extraProps = computed(() => (isDocView.value ? { id: current.value } : {}))
</script>

<template>
  <div class="flex min-h-screen gap-6 p-6">
    <SideNav :current="current" @select="current = $event" />
    <main class="min-w-0 flex-1">
      <component :is="activeView" :key="current" v-bind="extraProps" @go="current = $event" />
    </main>
  </div>
</template>
