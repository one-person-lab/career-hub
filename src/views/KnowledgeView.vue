<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhGraph, PhInfo, PhImage, PhCaretDown, PhClockCounterClockwise } from '@phosphor-icons/vue'
import { knowledge, knowledgeByDomain, dueForReview, levelDistribution, inline, type KnowledgeCard } from '../data/store'
import Blocks from '../components/Blocks.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import GuidePanel from '../components/GuidePanel.vue'

/**
 * 知识点：知识点按领域组织，每个知识点一张图。
 * 面试要的是「瞬时调取」而不是「理解」—— 所以卡片上先摆 trade-off 和数字，
 * 再给追问链，最后才是我在哪个项目里真的用过。
 */
const expanded = ref<Record<string, boolean>>({})
const toggle = (id: string): void => {
  expanded.value[id] = !expanded.value[id]
}

/** 这几个小节已经渲染在卡片正面了，展开时不用再出现一次 */
const ON_CARD = new Set(['关键 trade-off', '必须记住的数字', '图', '面试追问链', '我的项目锚点'])
const detailChunks = (k: KnowledgeCard) => k.chunks.filter((c) => !ON_CARD.has(c.name))

const domains = computed(() => knowledgeByDomain())
const dist = computed(() => levelDistribution())

const LEVEL_CLASS: Record<string, string> = {
  能讲: 'status-published',
  熟练: 'status-ready',
  理解: 'status-creating',
  生疏: 'status-failed',
}

/** 超过 21 天没复习的算「该复习」 */
const STALE_REVIEW_DAYS = 21
const dueList = computed(() => dueForReview().filter((k) => (k.reviewAge ?? 9999) > STALE_REVIEW_DAYS))

const totalDiagrams = computed(() => knowledge.reduce((s, c) => s + c.diagrams.length, 0))
const missingDiagram = computed(() => knowledge.filter((c) => c.diagrams.length === 0).map((c) => c.id))
const weak = computed(() => knowledge.filter((k) => k.levelScore > 0 && k.levelScore <= 2).map((k) => k.id))
const noNumber = computed(() => knowledge.filter((k) => k.numbers.length === 0).map((k) => k.id))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="neo-card">
      <div class="flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border-2 border-black bg-neo-blue text-black">
          <PhGraph :size="18" weight="bold" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-black leading-tight">知识点</h2>
          <p class="mt-0.5 text-xs font-bold text-neutral-500">
            知识点 + 图 · 来自 <code class="rounded bg-black/10 px-1">content/知识点/K-*.md</code>
          </p>
        </div>
      </div>
      <p class="mt-3 text-sm leading-relaxed text-neutral-700">
        面试时的问题不是「你懂不懂」，是「你在 5 秒内能不能调出来」。所以每张卡按这个顺序组织：
        <span class="font-black">trade-off → 必须记住的数字 → 追问链 → 我的项目锚点</span>，
        外加一张图作为第二条回忆通路。
      </p>

      <div v-if="knowledge.length" class="mt-3 grid grid-cols-2 gap-2 border-t-2 border-dashed border-neutral-300 pt-3 sm:grid-cols-4">
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ knowledge.length }}</div>
          <div class="text-[11px] font-bold text-neutral-500">个知识点</div>
        </div>
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ domains.length }}</div>
          <div class="text-[11px] font-bold text-neutral-500">个领域</div>
        </div>
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ totalDiagrams }}</div>
          <div class="text-[11px] font-bold text-neutral-500">张图</div>
        </div>
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ dueList.length }}</div>
          <div class="text-[11px] font-bold text-neutral-500">个待复习</div>
        </div>
      </div>

      <div v-if="dist.length" class="mt-3 flex flex-wrap items-center gap-2">
        <span class="text-[11px] font-bold text-neutral-500">掌握度分布</span>
        <span v-for="d in dist" :key="d.level" class="neo-chip !py-0 text-[10px]" :class="LEVEL_CLASS[d.level]">
          {{ d.level }} {{ d.count }}
        </span>
      </div>

      <div v-if="missingDiagram.length || weak.length" class="mt-3 rounded-lg border-2 border-black bg-neo-pink/40 p-3">
        <p class="flex items-start gap-1.5 text-xs font-bold leading-relaxed">
          <PhInfo :size="14" weight="bold" class="mt-0.5 shrink-0" />
          <span>
            待补齐 ——
            <template v-if="missingDiagram.length">缺图：{{ missingDiagram.join(' / ') }}；</template>
            <template v-if="weak.length">掌握度偏低：{{ weak.join(' / ') }}；</template>
            <template v-if="noNumber.length">没有数字：{{ noNumber.join(' / ') }}。</template>
          </span>
        </p>
      </div>
    </div>

    <div v-if="!knowledge.length" class="neo-card">
      <p class="text-sm font-bold text-neutral-600">
        还没有知识卡。从 <code class="rounded bg-black/10 px-1">content/知识点/_模板.md</code> 复制一份，
        改名为 <code class="rounded bg-black/10 px-1">K-001-知识点名.md</code> 就能开始写。
      </p>
    </div>

    <div v-if="dueList.length" class="neo-card !bg-neo-yellow/40">
      <h3 class="flex items-center gap-2 text-lg font-black">
        <PhClockCounterClockwise :size="17" weight="bold" />
        该复习了
      </h3>
      <p class="mt-1 text-xs font-bold text-neutral-600">超过 {{ STALE_REVIEW_DAYS }} 天没碰的知识点。间隔重复比一次性背完有效得多。</p>
      <div class="mt-2 flex flex-wrap gap-2">
        <span v-for="k in dueList" :key="k.id" class="neo-chip !border-2 bg-white">
          {{ k.id }} {{ k.title }} · {{ k.reviewAge === null ? '从未复习' : k.reviewAge + ' 天' }}
        </span>
      </div>
    </div>

    <section v-for="g in domains" :key="g.domain" class="flex flex-col gap-3">
      <h3 class="flex items-center gap-2 text-base font-black">
        {{ g.domain }}
        <span class="neo-chip !py-0 text-[10px]">{{ g.cards.length }}</span>
      </h3>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article v-for="k in g.cards" :key="k.id" class="neo-card flex flex-col">
          <div class="flex flex-wrap items-center gap-2">
            <span class="neo-chip !border-2 bg-black !text-white">{{ k.id }}</span>
            <span v-if="k.level" class="neo-chip" :class="LEVEL_CLASS[k.level]">{{ k.level }}</span>
            <span v-if="k.reviewAge !== null" class="neo-chip !py-0 text-[10px]">复习于 {{ k.reviewAge }} 天前</span>
            <span v-else class="neo-chip !py-0 text-[10px] status-failed">从未复习</span>
          </div>

          <h4 class="mt-2 text-lg font-black leading-tight">{{ k.title }}</h4>
          <p v-if="k.oneLine" class="mt-1 text-sm font-bold leading-relaxed text-neutral-700" v-html="inline(k.oneLine)" />

          <div v-if="k.tradeoffs.length" class="mt-3">
            <div class="mb-1 text-[11px] font-bold text-neutral-500">关键 trade-off</div>
            <div class="overflow-x-auto rounded-lg border-2 border-black shadow-neo-sm">
              <table class="w-full border-collapse text-[13px]">
                <thead>
                  <tr class="bg-black text-white">
                    <th v-for="h in Object.keys(k.tradeoffs[0])" :key="h" class="px-2.5 py-1.5 text-left font-black">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in k.tradeoffs" :key="i" class="border-t border-black/15" :class="i % 2 ? 'bg-neo-yellow/15' : ''">
                    <td
                      v-for="h in Object.keys(k.tradeoffs[0])"
                      :key="h"
                      class="px-2.5 py-1.5 align-top leading-relaxed"
                      v-html="inline(r[h] || '')"
                    />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="k.numbers.length" class="mt-3 rounded-lg border-2 border-black bg-neo-yellow/40 p-2.5">
            <div class="mb-1 text-[11px] font-bold text-neutral-600">必须记住的数字</div>
            <ul class="flex flex-col gap-1">
              <li v-for="(n, i) in k.numbers" :key="i" class="flex gap-2 text-[13px] leading-relaxed">
                <span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                <span class="min-w-0" v-html="inline(n)" />
              </li>
            </ul>
          </div>

          <div v-if="k.diagrams.length" class="mt-3 flex flex-col gap-3">
            <div v-for="d in k.diagrams" :key="d.id">
              <div class="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-neutral-500">
                <PhImage :size="12" weight="bold" />
                {{ d.name }}
              </div>
              <MermaidBlock :id="`kn-${k.id}-${d.id}`" :code="d.code" />
            </div>
          </div>

          <button class="neo-btn mt-3 w-full" @click="toggle(k.id)">
            <PhCaretDown :size="13" weight="bold" :class="expanded[k.id] ? 'rotate-180' : ''" class="transition-transform" />
            {{ expanded[k.id] ? '收起' : '追问链与项目锚点' }}
          </button>

          <div v-if="expanded[k.id]" class="mt-3 flex flex-col gap-3 border-t-2 border-dashed border-neutral-300 pt-3">
            <div v-if="k.questions.length" class="rounded-lg border-2 border-black bg-neo-blue/30 p-2.5">
              <div class="mb-1 text-[11px] font-bold text-neutral-600">面试追问链</div>
              <ol class="flex flex-col gap-1">
                <li v-for="(q, i) in k.questions" :key="i" class="flex gap-2 text-[13px] leading-relaxed">
                  <span class="shrink-0 font-black">{{ i + 1 }}.</span>
                  <span class="min-w-0" v-html="inline(q)" />
                </li>
              </ol>
            </div>

            <div v-if="k.anchors.length" class="rounded-lg border-2 border-black bg-neo-green/30 p-2.5">
              <div class="mb-1 text-[11px] font-bold text-neutral-600">我的项目锚点</div>
              <ul class="flex flex-col gap-1">
                <li v-for="(a, i) in k.anchors" :key="i" class="flex gap-2 text-[13px] leading-relaxed">
                  <span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                  <span class="min-w-0" v-html="inline(a)" />
                </li>
              </ul>
            </div>

            <section v-for="(ch, ci) in detailChunks(k)" :key="ci">
              <h5 class="text-sm font-black">{{ ch.name }}</h5>
              <div class="mt-1.5">
                <Blocks :blocks="ch.blocks" :mid-prefix="`kn-${k.id}-${ci}`" compact />
              </div>
            </section>
            <p class="text-[11px] text-neutral-400">{{ k.file }}</p>
          </div>
        </article>
      </div>
    </section>

    <GuidePanel section-id="knowledge" />
  </div>
</template>
