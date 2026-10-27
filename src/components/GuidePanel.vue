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
  <div v-if="docs.length" class="panel !p-0">
    <button class="row h-auto border-b border-line hover:bg-transparent" @click="open = !open">
      <PhBookOpen :size="14" weight="bold" class="shrink-0 text-ink-3" />
      <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">这个板块怎么用</span>
      <span
        v-for="(l, i) in current?.intro || []"
        :key="i"
        class="hidden min-w-0 truncate text-[11px] text-ink-3 lg:block lg:max-w-[420px]"
        v-html="inline(l)"
      />
      <PhCaretDown :size="13" weight="bold" class="shrink-0 text-ink-3 transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>

    <div v-if="open" class="flex flex-col gap-3 p-3.5">
      <div v-if="docs.length > 1" class="flex flex-wrap gap-1.5">
        <button
          v-for="d in docs"
          :key="d.name"
          class="chip transition-colors hover:bg-hover hover:text-ink"
          :class="d.name === current?.name ? 'chip-solid text-ink' : ''"
          @click="active = d.name"
        >
          {{ label(d) }}
        </button>
      </div>

      <template v-if="current">
        <p class="font-mono text-[10px] text-ink-3">{{ current.path }}</p>
        <section v-for="(c, ci) in current.chunks" :key="ci">
          <h4 class="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">{{ c.name }}</h4>
          <div>
            <Blocks :blocks="c.blocks" :mid-prefix="`guide-${sectionId}-${ci}`" compact />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
