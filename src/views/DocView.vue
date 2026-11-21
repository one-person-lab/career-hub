<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhDotsThree, PhCopy, PhCheck } from '@phosphor-icons/vue'
import { sectionById, inline, type Chunk, type SectionDoc } from '../data/store'
import Blocks from '../components/Blocks.vue'

/**
 * 通用板块渲染器：content/<目录>/ 下任意 md 都靠它显示。
 * 视图层不认识新语法 —— 要加块类型，改 scripts/build-data.mjs 的 parseBlocks()
 * 与 components/Blocks.vue 各一处。
 */
const props = defineProps<{ id: string; doc?: string }>()

const section = computed(() => sectionById(props.id))
const docs = computed<SectionDoc[]>(() => section.value?.docs || [])
const activeName = ref(props.doc || '')

watch(
  () => [props.id, props.doc, docs.value.length],
  () => {
    if (props.doc && docs.value.some((d) => d.name === props.doc)) activeName.value = props.doc
    else if (!docs.value.some((d) => d.name === activeName.value)) activeName.value = docs.value[0]?.name || ''
  },
  { immediate: true },
)

const doc = computed<SectionDoc | undefined>(
  () => docs.value.find((d) => d.name === activeName.value) || docs.value[0],
)

const meta = computed(() =>
  [doc.value?.version, doc.value?.status, doc.value?.updated ? `更新 ${doc.value.updated}` : ''].filter(Boolean).join(' · '),
)

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

const menu = ref(false)
const copied = ref<'idle' | 'ok' | 'fail'>('idle')
let copyTimer: number | undefined

async function copyDoc() {
  if (!doc.value) return
  menu.value = false
  try {
    await navigator.clipboard.writeText([doc.value.title, ...doc.value.chunks.map(chunkText)].join('\n\n'))
    copied.value = 'ok'
  } catch {
    copied.value = 'fail'
  }
  clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => (copied.value = 'idle'), 1800)
}

const closeMenu = () => (menu.value = false)
onMounted(() => window.addEventListener('click', closeMenu))
onBeforeUnmount(() => {
  window.removeEventListener('click', closeMenu)
  clearTimeout(copyTimer)
})
</script>

<template>
  <div v-if="!section" class="panel">
    <p class="text-[13px] text-ink-2">没找到这个板块。</p>
  </div>

  <div v-else class="mx-auto flex max-w-[760px] flex-col gap-6">
    <header>
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <h1 class="text-[22px] font-semibold leading-[30px] text-ink">{{ doc?.title || section.label }}</h1>
          <p v-if="meta" class="mt-1 text-[12px] leading-[18px] text-ink-3">{{ meta }}</p>
        </div>

        <select
          v-if="docs.length > 1"
          v-model="activeName"
          class="h-8 max-w-[220px] shrink-0 rounded-md border border-line bg-transparent px-2 text-[12px] text-ink-2 outline-none focus:border-line-strong"
        >
          <option v-for="d in docs" :key="d.name" :value="d.name" class="bg-raised text-ink">{{ d.title }}</option>
        </select>

        <div v-if="doc" class="relative shrink-0" @click.stop>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            title="更多"
            @click="menu = !menu"
          >
            <PhDotsThree :size="16" weight="bold" />
          </button>
          <div
            v-if="menu"
            class="absolute right-0 top-9 z-20 w-[136px] rounded-md border border-line-strong bg-raised p-1 shadow-pop"
          >
            <button class="row w-full py-1.5 text-[12px]" @click="copyDoc">
              <component
                :is="copied === 'ok' ? PhCheck : PhCopy"
                :size="12"
                class="shrink-0"
                :class="copied === 'fail' ? 'text-red' : copied === 'ok' ? 'text-green' : 'text-ink-3'"
              />
              <span>{{ copied === 'ok' ? '已复制' : copied === 'fail' ? '复制失败' : '复制整篇' }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <p v-if="!docs.length" class="text-[13px] leading-[20px] text-ink-2">这个板块还没有内容。</p>

    <template v-else-if="doc">
      <div v-if="doc.intro.length" class="border-l-2 border-brand pl-3">
        <p v-for="(l, i) in doc.intro" :key="i" class="text-[14px] leading-[22px] text-ink" v-html="inline(l)" />
      </div>

      <section v-for="(c, ci) in doc.chunks" :key="ci" class="flex flex-col gap-3">
        <h2 class="text-[15px] font-semibold leading-[22px] text-ink">{{ c.name }}</h2>
        <Blocks :blocks="c.blocks" :mid-prefix="`${id}-${doc.name}-${ci}`" />
      </section>
    </template>
  </div>
</template>
