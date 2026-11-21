<script setup lang="ts">
import { computed } from 'vue'
import PipelineView from './PipelineView.vue'
import KnowledgeView from './KnowledgeView.vue'
import LibraryView from './LibraryView.vue'
import WarRoomView from './WarRoomView.vue'
import PrepTabs from '../components/PrepTabs.vue'
import { knowledge } from '../data/store'

/**
 * 面试准备是产品的核心，但它有三个入口：
 * 按场次准备、按问题准备、按岗位把整场问答过一遍。
 */
defineProps<{ tab: 'jobs' | 'know' | 'war' }>()
const emit = defineEmits<{ (e: 'go', id: string): void }>()

const hasCards = computed(() => knowledge.length > 0)
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-4">
    <PrepTabs :active="tab" @go="emit('go', $event)" />

    <PipelineView v-if="tab === 'jobs'" @go="emit('go', $event)" />
    <template v-else-if="tab === 'know'">
      <KnowledgeView v-if="hasCards" @go="emit('go', $event)" />
      <LibraryView v-else host="prep-know" @go="emit('go', $event)" />
    </template>
    <WarRoomView v-else />
  </div>
</template>
