<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhArrowRight } from '@phosphor-icons/vue'
import { docsByHost, type Section } from '../data/store'

const props = withDefaults(defineProps<{ host?: string }>(), { host: 'library' })
defineEmits<{ (e: 'go', id: string): void }>()

/**
 * 知识库：左边是自己的技术方向，右边是这个方向下的材料。
 * 面试前要按「我现在要补哪块」找东西，不是按文件夹找。
 */

const GROUP_ORDER = ['技术', '项目', '求职', '其他']

const sectionsOfHost = computed(() => docsByHost(props.host))

const groups = computed(() =>
  GROUP_ORDER.map((label) => ({
    label,
    sections: sectionsOfHost.value.filter((s) => (s.group || '其他') === label),
  })).filter((g) => g.sections.length),
)

const selected = ref('')
watch(
  () => sectionsOfHost.value,
  (list) => {
    if (!list.some((s) => s.id === selected.value)) selected.value = list[0]?.id || ''
  },
  { immediate: true },
)

const active = computed<Section | undefined>(() => sectionsOfHost.value.find((s) => s.id === selected.value))
</script>

<template>
  <div class="flex w-full max-w-[1100px] flex-col gap-5">
    <p v-if="!sectionsOfHost.length" class="text-[13px] leading-[20px] text-ink-2">这里还没有文档。</p>

    <!-- 只有一个板块时不做目录，直接列文档 -->
    <template v-else-if="sectionsOfHost.length === 1">
      <div v-for="s in sectionsOfHost" :key="s.id" class="flex flex-col">
        <button
          v-for="d in s.docs"
          :key="d.name"
          class="group flex w-full items-start gap-3 border-b border-line px-2 py-2.5 text-left transition-colors last:border-b-0 hover:bg-hover"
          @click="$emit('go', `${s.id}::${d.name}`)"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] leading-[20px] text-ink">{{ d.title }}</span>
            <span v-if="d.summary" class="mt-0.5 block truncate text-[11px] leading-[16px] text-ink-3">{{ d.summary }}</span>
          </span>
          <span class="shrink-0 font-mono text-[11px] leading-[20px] text-ink-3">{{ d.updated }}</span>
        </button>
      </div>
    </template>

    <div v-else class="flex items-start gap-8">
      <!-- 左：技术方向 -->
      <aside class="w-[196px] shrink-0">
        <div v-for="g in groups" :key="g.label" class="mb-3 last:mb-0">
          <p class="mb-1 px-2 text-[11px] text-ink-3">{{ g.label }}</p>
          <button
            v-for="s in g.sections"
            :key="s.id"
            class="row py-1.5 text-[13px]"
            :class="s.id === selected ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'"
            @click="selected = s.id"
          >
            <span class="min-w-0 flex-1 truncate">{{ s.label }}</span>
            <span class="font-mono text-[10px] text-ink-3">{{ s.docs.length }}</span>
          </button>
        </div>
      </aside>

      <!-- 右：这个方向的材料 -->
      <main v-if="active" class="flex min-w-0 flex-1 flex-col">
        <h2 class="pb-1 text-[15px] font-semibold text-ink">{{ active.label }}</h2>
        <button
          v-for="d in active.docs"
          :key="d.name"
          class="group flex w-full items-start gap-3 border-b border-line px-1 py-2.5 text-left transition-colors last:border-b-0 hover:bg-hover"
          @click="$emit('go', `${active.id}::${d.name}`)"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] leading-[20px] text-ink">{{ d.title }}</span>
            <span v-if="d.summary" class="mt-0.5 block truncate text-[11px] leading-[16px] text-ink-3">{{ d.summary }}</span>
          </span>
          <span class="shrink-0 font-mono text-[11px] leading-[20px] text-ink-3">{{ d.updated }}</span>
          <PhArrowRight
            :size="12"
            weight="bold"
            class="mt-1 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>
      </main>
    </div>
  </div>
</template>
