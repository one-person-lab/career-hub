<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhBookOpen, PhCaretDown } from '@phosphor-icons/vue'
import { sectionById, inline, type SectionDoc } from '../data/store'
import Blocks from './Blocks.vue'

/**
 * 卡片型板块的「怎么用」面板 —— 内容来自 content/<目录>/_说明.md 与 _模板.md。
 * 说明文字同样不写死在视图里。
 */
const props = defineProps<{ sectionId: string }>()

const section = computed(() => sectionById(props.sectionId))
/** 说明排在模板前面 —— 先读为什么，再看照抄什么 */
const docs = computed<SectionDoc[]>(() =>
  (section.value?.docs || [])
    .slice()
    .sort((a, b) => Number(a.name.includes('模板')) - Number(b.name.includes('模板'))),
)
const open = ref(false)
const active = ref('')

const current = computed<SectionDoc | undefined>(
  () => docs.value.find((d) => d.name === active.value) || docs.value[0],
)

const label = (d: SectionDoc): string => (d.name.includes('模板') ? '模板' : '说明')
</script>

<template>
  <div v-if="docs.length" class="neo-card">
    <button class="flex w-full items-center gap-2 text-left" @click="open = !open">
      <PhBookOpen :size="17" weight="bold" class="shrink-0" />
      <span class="min-w-0 flex-1 text-lg font-black">这个板块怎么用</span>
      <PhCaretDown :size="15" weight="bold" class="shrink-0 transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>

    <div v-if="!open" class="mt-2">
      <p
        v-for="(l, i) in current?.intro || []"
        :key="i"
        class="text-sm font-bold leading-relaxed text-neutral-600"
        v-html="inline(l)"
      />
    </div>

    <div v-if="open" class="mt-3 flex flex-col gap-3 border-t-2 border-dashed border-neutral-300 pt-3">
      <div v-if="docs.length > 1" class="flex flex-wrap gap-2">
        <button
          v-for="d in docs"
          :key="d.name"
          class="neo-chip border-2 transition-colors"
          :class="
            d.name === current?.name
              ? 'border-black bg-white font-black shadow-neo-sm'
              : 'border-transparent hover:bg-neo-yellow/60'
          "
          @click="active = d.name"
        >
          {{ label(d) }}
        </button>
      </div>

      <template v-if="current">
        <p class="text-[11px] text-neutral-400">{{ current.path }}</p>
        <section v-for="(c, ci) in current.chunks" :key="ci">
          <h4 class="text-sm font-black">{{ c.name }}</h4>
          <div class="mt-1.5">
            <Blocks :blocks="c.blocks" :mid-prefix="`guide-${sectionId}-${ci}`" compact />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
