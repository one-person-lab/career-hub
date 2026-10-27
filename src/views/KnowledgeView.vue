<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhGraph, PhImage, PhArrowClockwise, PhBrain, PhCaretRight } from '@phosphor-icons/vue'
import {
  knowledge,
  knowledgeByDomain,
  staleReview,
  STALE_REVIEW_DAYS,
  levelDistribution,
  pipeline,
  inline,
  type KnowledgeCard,
} from '../data/store'
import Blocks from '../components/Blocks.vue'
import MermaidBlock from '../components/MermaidBlock.vue'

/**
 * 知识与薄弱项：左目录 / 中正文 / 右关联。
 * 面试要的是「瞬时调取」而不是「理解」—— 所以正文先摆 trade-off 和数字，
 * 再给追问链，右栏常驻掌握度、复习年龄和「哪些岗位正在考它」。
 */
defineEmits<{ (e: 'go', id: string): void }>()

const domains = computed(() => knowledgeByDomain())
const dist = computed(() => levelDistribution())
const dueList = computed(() => staleReview())

/** 展开的目录 */
const open = ref<string[]>([])
watch(
  () => domains.value,
  (d) => {
    if (!open.value.length && d.length) open.value = [d[0].domain]
  },
  { immediate: true },
)
const toggleDir = (name: string): void => {
  open.value = open.value.includes(name) ? open.value.filter((x) => x !== name) : [...open.value, name]
}

const selected = ref('')
watch(
  () => knowledge,
  (list) => {
    if (!list.some((k) => k.id === selected.value)) selected.value = dueList.value[0]?.id || list[0]?.id || ''
  },
  { immediate: true },
)
const active = computed(() => knowledge.find((k) => k.id === selected.value))

const LEVEL_TONE: Record<string, string> = {
  能讲: 'b-green',
  熟练: 'b-blue',
  理解: 'b-amber',
  生疏: 'b-red',
}

/** 这些节已经在中栏单独渲染了，展开「更多」时才作为正文出现 */
const ON_CARD = new Set(['关键 trade-off', '必须记住的数字', '图', '面试追问链', '我的项目锚点'])
const restChunks = (k: KnowledgeCard) => k.chunks.filter((c) => !ON_CARD.has(c.name))

const showRest = ref(false)
watch(selected, () => (showRest.value = false))

/** 「换一张该复习的」：跳过当前这张 */
function pickNextDue() {
  selected.value = dueList.value.find((k) => k.id !== selected.value)?.id || ''
}

/** 反查：哪些岗位把这张卡列为准备素材 / 缺这张卡的岗位 */
const jobsUsing = computed(() =>
  active.value ? pipeline.filter((p) => p.knowledgeIds.includes(active.value!.id)) : [],
)
const missingDiagram = computed(() => knowledge.filter((k) => k.diagrams.length === 0).map((k) => k.title))
const noNumber = computed(() => knowledge.filter((k) => k.numbers.length === 0).map((k) => k.title))
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] gap-3">
    <!-- 左：知识目录 -->
    <aside class="w-[238px] shrink-0 flex flex-col gap-2">
      <div v-if="dist.length" class="panel !p-2.5">
        <div class="flex h-1.5 w-full overflow-hidden rounded-full bg-raised">
          <span
            v-for="d in dist"
            :key="d.level"
            class="h-full"
            :class="LEVEL_TONE[d.level]"
            :style="{ width: `${(d.count / knowledge.length) * 100}%` }"
            :title="`${d.level} ${d.count}`"
          />
        </div>
        <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span v-for="d in dist" :key="d.level" class="flex items-center gap-1 text-[10px] text-ink-3">
            <span class="dot" :class="LEVEL_TONE[d.level]" />{{ d.level }} {{ d.count }}
          </span>
        </div>
      </div>

      <div class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhGraph :size="12" weight="bold" />
          知识目录
        </div>
        <div class="max-h-[calc(100vh-250px)] overflow-y-auto p-1.5">
          <template v-for="g in domains" :key="g.domain">
            <button class="row py-1.5 text-[12px] font-semibold text-ink-2 hover:text-ink" @click="toggleDir(g.domain)">
              <PhCaretRight
                :size="11"
                weight="bold"
                class="shrink-0 text-ink-3 transition-transform"
                :class="open.includes(g.domain) ? 'rotate-90' : ''"
              />
              <span class="min-w-0 flex-1 truncate">{{ g.domain }}</span>
              <span class="font-mono text-[10px] text-ink-3">{{ g.cards.length }}</span>
            </button>
            <button
              v-for="k in open.includes(g.domain) ? g.cards : []"
              :key="k.id"
              class="row py-1.5 pl-7 text-[12px]"
              :class="k.id === selected ? 'bg-raised text-ink' : 'text-ink-2'"
              @click="selected = k.id"
            >
              <span class="min-w-0 flex-1 truncate">{{ k.title }}</span>
              <span class="dot shrink-0" :class="LEVEL_TONE[k.level] || 'b-gray'" />
            </button>
          </template>
        </div>
      </div>
    </aside>

    <!-- 中：卡片正文 -->
    <main v-if="active" class="min-w-0 flex-1 flex flex-col gap-3">
      <section class="panel">
        <div class="flex flex-wrap items-center gap-2">
          <span v-if="active.level" class="chip"><span class="dot" :class="LEVEL_TONE[active.level]" />{{ active.level }}</span>
          <span class="chip">
            <PhArrowClockwise :size="10" weight="bold" />
            {{ active.reviewAge === null ? '从未复习' : `${active.reviewAge} 天前复习` }}
          </span>
          <button class="btn ml-auto" :disabled="dueList.length < 2" @click="pickNextDue">
            <PhBrain :size="12" weight="bold" />
            换一张该复习的
          </button>
        </div>

        <h2 class="mt-2 text-[18px] font-semibold leading-tight text-ink">{{ active.title }}</h2>
        <p v-if="active.oneLine" class="mt-1.5 text-[13px] leading-relaxed text-ink-2" v-html="inline(active.oneLine)" />
      </section>

      <section v-if="active.tradeoffs.length" class="panel !p-0">
        <div class="group-head border-b border-line">关键 trade-off</div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-[13px]">
            <tbody>
              <tr
                v-for="(r, i) in active.tradeoffs"
                :key="i"
                class="border-b border-line last:border-b-0"
                :class="i % 2 ? 'bg-white/[0.02]' : ''"
              >
                <td
                  v-for="h in Object.keys(active.tradeoffs[0])"
                  :key="h"
                  class="px-3 py-2 align-top leading-relaxed text-ink-2"
                  v-html="inline(r[h] || '')"
                />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="active.numbers.length" class="panel !p-0">
        <div class="group-head border-b border-line">必须记住的数字</div>
        <ul class="flex flex-col gap-1 p-3">
          <li v-for="(n, i) in active.numbers" :key="i" class="flex gap-2 text-[13px] leading-relaxed text-ink-2">
            <span class="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-amber" />
            <span class="min-w-0" v-html="inline(n)" />
          </li>
        </ul>
      </section>

      <section v-for="d in active.diagrams" :key="d.id" class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhImage :size="12" weight="bold" />
          {{ d.name }}
        </div>
        <div class="p-3">
          <MermaidBlock :id="`kn-${active.id}-${d.id}`" :code="d.code" />
        </div>
      </section>

      <section v-if="restChunks(active).length || active.chunks.length" class="panel !p-0">
        <button class="row h-auto border-b border-line hover:bg-transparent" @click="showRest = !showRest">
          <span class="min-w-0 flex-1 text-[12px] font-semibold text-ink-2">正文其余部分</span>
          <PhCaretRight :size="12" weight="bold" class="shrink-0 text-ink-3 transition-transform" :class="showRest ? 'rotate-90' : ''" />
        </button>
        <div v-if="showRest" class="flex flex-col gap-4 p-3.5">
          <section v-for="(ch, ci) in restChunks(active)" :key="ci">
            <h4 class="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3">{{ ch.name }}</h4>
            <Blocks :blocks="ch.blocks" :mid-prefix="`kn-${active.id}-${ci}`" size="sm" />
          </section>
          <p v-if="!restChunks(active).length" class="text-[12px] text-ink-3">这张卡的正文都已经在上面了。</p>
        </div>
      </section>
    </main>

    <main v-else class="min-w-0 flex-1">
      <div class="panel text-[13px] leading-relaxed text-ink-2">还没有知识卡。</div>
    </main>

    <!-- 右：关联与状态 -->
    <aside v-if="active" class="flex w-[276px] shrink-0 flex-col gap-3">
      <section class="panel !p-0">
        <div class="group-head border-b border-line">面试追问链</div>
        <ol class="flex flex-col gap-2 p-3">
          <p v-if="!active.questions.length" class="text-[12px] leading-relaxed text-ink-3">
            还没有追问链。
          </p>
          <li v-for="(q, i) in active.questions" :key="i" class="flex gap-2 text-[12px] leading-relaxed text-ink-2">
            <span class="shrink-0 font-mono text-[10px] text-ink-3">{{ i + 1 }}</span>
            <span class="min-w-0" v-html="inline(q)" />
          </li>
        </ol>
      </section>

      <section class="panel !p-0">
        <div class="group-head border-b border-line">我的项目锚点</div>
        <ul class="flex flex-col gap-1.5 p-3">
          <p v-if="!active.anchors.length" class="text-[12px] leading-relaxed text-ink-3">还没有项目锚点。</p>
          <li v-for="(a, i) in active.anchors" :key="i" class="flex gap-2 text-[12px] leading-relaxed text-ink-2">
            <span class="mt-[7px] h-1 w-1 shrink-0 rounded-full b-green" />
            <span class="min-w-0" v-html="inline(a)" />
          </li>
        </ul>
      </section>

      <section class="panel !p-0">
        <div class="group-head border-b border-line">哪些岗位在考它</div>
        <div class="p-1.5">
          <p v-if="!jobsUsing.length" class="px-2 py-3 text-[12px] leading-relaxed text-ink-3">
            还没有关联岗位。
          </p>
          <div v-for="p in jobsUsing" :key="p.key" class="row cursor-default py-1.5 text-[12px]">
            <span class="dot shrink-0" :class="p.nextIn !== null && p.nextIn >= 0 ? 'b-amber' : 'b-gray'" />
            <span class="min-w-0 flex-1 truncate text-ink-2">{{ p.company }} · {{ p.stage }}</span>
            <span v-if="p.nextIn !== null && p.nextIn >= 0" class="shrink-0 font-mono text-[10px] text-amber">{{ p.nextIn }} 天</span>
          </div>
        </div>
      </section>

      <section class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhArrowClockwise :size="12" weight="bold" />
          复习队列
          <span class="ml-auto font-mono text-[10px] text-ink-3">{{ dueList.length }}</span>
        </div>
        <div class="max-h-[260px] overflow-y-auto p-1.5">
          <p v-if="!dueList.length" class="px-2 py-3 text-[12px] text-ink-3">
            近 {{ STALE_REVIEW_DAYS }} 天都复习过。
          </p>
          <button
            v-for="k in dueList"
            :key="k.id"
            class="row py-1.5 text-[12px]"
            :class="k.id === selected ? 'bg-raised text-ink' : 'text-ink-2'"
            @click="selected = k.id"
          >
            <span class="min-w-0 flex-1 truncate">{{ k.title }}</span>
            <span class="shrink-0 font-mono text-[10px]" :class="k.reviewAge === null ? 'text-red' : 'text-amber'">
              {{ k.reviewAge === null ? '从未' : `${k.reviewAge}天` }}
            </span>
          </button>
        </div>
      </section>

      <div
        v-if="missingDiagram.length || noNumber.length"
        class="panel flex items-start gap-2 border-amber/30 !bg-amber/[0.06]"
      >
        <span class="dot mt-1.5 shrink-0 b-amber" />
        <p class="text-[12px] leading-relaxed text-ink-2">
          待补齐 ——
          <template v-if="missingDiagram.length">缺图：{{ missingDiagram.slice(0, 4).join('、') }}；</template>
          <template v-if="noNumber.length">没有数字：{{ noNumber.slice(0, 4).join('、') }}。</template>
        </p>
      </div>
    </aside>
  </div>
</template>
