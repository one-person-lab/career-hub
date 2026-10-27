<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhInfo } from '@phosphor-icons/vue'
import { sectionById, sectionIcon, inline, type SectionDoc } from '../data/store'
import Blocks from '../components/Blocks.vue'

/**
 * 通用板块渲染器：content/<目录>/ 下任意 md 都靠它显示。
 * 视图层不认识新语法 —— 要加块类型，改 scripts/build-data.mjs 的 parseBlocks()
 * 与 components/Blocks.vue 各一处。
 */
const props = defineProps<{ id: string }>()

const section = computed(() => sectionById(props.id))
const docs = computed<SectionDoc[]>(() => section.value?.docs || [])
const activeName = ref('')

watch(
  () => [props.id, docs.value.length],
  () => {
    if (!docs.value.some((d) => d.name === activeName.value)) activeName.value = docs.value[0]?.name || ''
  },
  { immediate: true },
)

const doc = computed<SectionDoc | undefined>(
  () => docs.value.find((d) => d.name === activeName.value) || docs.value[0],
)
const Icon = computed(() => sectionIcon(section.value?.icon || 'doc'))
</script>

<template>
  <div v-if="!section" class="panel">
    <h2 class="text-[15px] font-semibold">未找到板块</h2>
    <p class="mt-2 text-[12px] text-ink-3">id：{{ id }}</p>
  </div>

  <div v-else class="mx-auto flex max-w-[920px] flex-col gap-3">
    <div class="panel flex items-center gap-3">
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-raised text-ink-2">
        <component :is="Icon" :size="15" weight="regular" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-[14px] font-semibold text-ink">{{ section.label }}</h2>
        <p class="mt-0.5 text-[11px] text-ink-3">
          <span class="font-mono">content/{{ section.dir }}/</span> · {{ docs.length }} 篇
        </p>
      </div>
      <div v-if="docs.length > 1" class="flex shrink-0 flex-wrap justify-end gap-1">
        <button
          v-for="d in docs"
          :key="d.name"
          class="chip transition-colors hover:bg-hover hover:text-ink"
          :class="d.name === doc?.name ? 'chip-solid text-ink' : ''"
          @click="activeName = d.name"
        >
          {{ d.title }}
        </button>
      </div>
    </div>

    <div v-if="!docs.length" class="panel">
      <p class="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
        <PhInfo :size="14" weight="bold" class="shrink-0 text-ink-3" />
        这个板块还没有内容。往
        <span class="font-mono text-ink">content/{{ section.dir }}/</span>
        放一个 .md，重新生成数据即可。
      </p>
    </div>

    <template v-else-if="doc">
      <div class="flex flex-wrap items-center gap-1.5">
        <span v-if="doc.version" class="chip chip-solid">{{ doc.version }}</span>
        <span v-if="doc.status" class="chip">{{ doc.status }}</span>
        <span v-if="doc.updated" class="chip">更新 {{ doc.updated }}</span>
        <span v-if="doc.flowCount" class="chip">{{ doc.flowCount }} 张图</span>
        <span class="ml-auto font-mono text-[10px] text-ink-3">{{ doc.path }}</span>
      </div>

      <div v-if="doc.intro.length" class="panel border-brand/40 bg-brand-weak">
        <p v-for="(l, i) in doc.intro" :key="i" class="text-[13px] leading-relaxed text-ink" v-html="inline(l)" />
      </div>

      <section v-for="(c, ci) in doc.chunks" :key="ci" class="panel !p-0">
        <div class="group-head border-b border-line">{{ c.name }}</div>
        <div class="px-3.5 py-3">
          <Blocks :blocks="c.blocks" :mid-prefix="`${id}-${doc.name}-${ci}`" />
        </div>
      </section>
    </template>
  </div>
</template>
