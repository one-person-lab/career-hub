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
  <div v-if="!section" class="neo-card">
    <h2 class="text-2xl font-black">未找到板块</h2>
    <p class="mt-2 text-sm text-neutral-500">id：{{ id }}</p>
  </div>

  <div v-else class="flex flex-col gap-4">
    <div class="neo-card">
      <div class="flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border-2 border-black text-black" :class="section.tone">
          <component :is="Icon" :size="18" weight="bold" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-black leading-tight">{{ section.label }}</h2>
          <p class="mt-0.5 text-xs font-bold text-neutral-500">
            来自 <code class="rounded bg-black/10 px-1">content/{{ section.dir }}/</code> · {{ docs.length }} 篇
          </p>
        </div>
      </div>

      <div v-if="docs.length > 1" class="mt-3 flex flex-wrap gap-2 border-t-2 border-dashed border-neutral-300 pt-3">
        <button
          v-for="d in docs"
          :key="d.name"
          class="neo-chip border-2 transition-colors"
          :class="
            d.name === doc?.name ? 'border-black bg-white font-black shadow-neo-sm' : 'border-transparent hover:bg-neo-yellow/60'
          "
          @click="activeName = d.name"
        >
          {{ d.title }}
        </button>
      </div>
    </div>

    <div v-if="!docs.length" class="neo-card">
      <p class="flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-500">
        <PhInfo :size="15" weight="bold" class="shrink-0" />
        这个板块还没有内容。往
        <code class="rounded bg-black/10 px-1">content/{{ section.dir }}/</code>
        放一个 .md 文件，重新生成数据即可。
      </p>
    </div>

    <template v-else-if="doc">
      <div class="flex flex-wrap items-center gap-2">
        <span v-if="doc.version" class="neo-chip status-ready">{{ doc.version }}</span>
        <span v-if="doc.status" class="neo-chip status-creating">{{ doc.status }}</span>
        <span v-if="doc.updated" class="neo-chip">更新 {{ doc.updated }}</span>
        <span v-if="doc.flowCount" class="neo-chip">{{ doc.flowCount }} 张图</span>
        <span class="ml-auto text-[11px] text-neutral-400">{{ doc.path }}</span>
      </div>

      <div v-if="doc.intro.length" class="rounded-lg border-2 border-black bg-neo-yellow/50 p-3 shadow-neo-sm">
        <p v-for="(l, i) in doc.intro" :key="i" class="text-sm font-bold leading-relaxed" v-html="inline(l)" />
      </div>

      <section v-for="(c, ci) in doc.chunks" :key="ci" class="neo-card">
        <h3 class="text-lg font-black">{{ c.name }}</h3>
        <div class="mt-3">
          <Blocks :blocks="c.blocks" :mid-prefix="`${id}-${doc.name}-${ci}`" />
        </div>
      </section>
    </template>
  </div>
</template>
