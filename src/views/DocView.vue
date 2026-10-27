<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PhCheck, PhCopy, PhInfo } from '@phosphor-icons/vue'
import { sectionById, sectionIcon, inline, type Chunk, type SectionDoc } from '../data/store'
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

/** 把一块（`##` 到下一个 `##`）还原成可粘贴的纯文本，去掉 md 行内标记 */
function chunkText(c: Chunk): string {
  const out: string[] = [c.name]
  for (const b of c.blocks) {
    if (b.type === 'list') {
      out.push(b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : '-'} ${it}`).join('\n'))
    } else if (b.type === 'quote') {
      out.push(b.lines.join('\n'))
    } else if (b.type === 'table') {
      out.push([b.head.join('\t'), ...b.rows.map((r) => b.head.map((h) => r[h] ?? '').join('\t'))].join('\n'))
    } else {
      out.push(b.text)
    }
  }
  return out
    .join('\n\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}

const copyState = ref<{ i: number; ok: boolean } | null>(null)
let copyTimer: number | undefined

async function copyChunk(i: number, c: Chunk) {
  let ok = true
  try {
    await navigator.clipboard.writeText(chunkText(c))
  } catch {
    ok = false // 非安全上下文或权限被拒，按钮变红而不是静默不响应
  }
  copyState.value = { i, ok }
  clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => (copyState.value = null), 1800)
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>

<template>
  <div v-if="!section" class="panel">
    <h2 class="text-[15px] font-semibold">未找到板块</h2>
  </div>

  <div v-else class="mx-auto flex max-w-[920px] flex-col gap-3">
    <div class="panel flex items-center gap-3">
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-raised text-ink-2">
        <component :is="Icon" :size="15" weight="regular" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-[14px] font-semibold text-ink">{{ section.label }}</h2>
        <p v-if="docs.length > 1" class="mt-0.5 text-[11px] text-ink-3">{{ docs.length }} 篇</p>
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
        这个板块还没有内容。
      </p>
    </div>

    <template v-else-if="doc">
      <div class="flex flex-wrap items-center gap-1.5">
        <span v-if="doc.version" class="chip chip-solid">{{ doc.version }}</span>
        <span v-if="doc.status" class="chip">{{ doc.status }}</span>
        <span v-if="doc.updated" class="chip">更新 {{ doc.updated }}</span>
      </div>

      <div v-if="doc.intro.length" class="panel border-brand/40 bg-brand-weak">
        <p v-for="(l, i) in doc.intro" :key="i" class="text-[13px] leading-relaxed text-ink" v-html="inline(l)" />
      </div>

      <section v-for="(c, ci) in doc.chunks" :key="ci" class="panel !p-0">
        <div class="group-head border-b border-line">
          <span class="min-w-0 flex-1">{{ c.name }}</span>
          <button
            class="flex shrink-0 items-center gap-1 rounded border border-line px-1.5 py-0.5 text-[10px] font-medium transition-colors"
            :class="
              copyState && copyState.i === ci
                ? copyState.ok
                  ? 'text-green'
                  : 'text-red'
                : 'text-ink-3 hover:bg-hover hover:text-ink'
            "
            :title="`复制「${c.name}」整块，${chunkText(c).length} 字`"
            @click="copyChunk(ci, c)"
          >
            <component :is="copyState && copyState.i === ci && copyState.ok ? PhCheck : PhCopy" :size="11" />
            {{ copyState && copyState.i === ci ? (copyState.ok ? '已复制' : '复制失败') : '复制' }}
          </button>
        </div>
        <div class="px-3.5 py-3">
          <Blocks :blocks="c.blocks" :mid-prefix="`${id}-${doc.name}-${ci}`" />
        </div>
      </section>
    </template>
  </div>
</template>
