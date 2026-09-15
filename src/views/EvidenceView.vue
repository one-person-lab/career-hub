<script setup lang="ts">
import { computed, ref } from 'vue'
import { PhTrophy, PhInfo, PhImage, PhCaretDown } from '@phosphor-icons/vue'
import { evidence, inline, type EvidenceCard } from '../data/store'
import Blocks from '../components/Blocks.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import GuidePanel from '../components/GuidePanel.vue'

/**
 * 项目成果：唯一事实源。
 * 简历、故事库、作品集、自我介绍都应该从这里派生 —— 所以这张卡片上要能一眼看到
 * 「这条成果能用在哪些地方」以及「影响是什么数字」。
 */
const filter = ref('')
const types = computed(() => [...new Set(evidence.map((c) => c.type || '未分类'))])
const list = computed(() => (filter.value ? evidence.filter((c) => (c.type || '未分类') === filter.value) : evidence))

const expanded = ref<Record<string, boolean>>({})
const toggle = (id: string): void => {
  expanded.value[id] = !expanded.value[id]
}

/** 这两个小节已经渲染在卡片正面了，展开时不用再出现一次 */
const ON_CARD = new Set(['影响', '架构图'])
const detailChunks = (c: EvidenceCard) => c.chunks.filter((ch) => !ON_CARD.has(ch.name))

const reuseTone = (r: string): string => {
  if (r.includes('简历')) return 'status-ready'
  if (r.includes('行为') || r.includes('STAR')) return 'status-creating'
  if (r.includes('技术')) return 'status-publishing'
  if (r.includes('作品')) return 'status-published'
  return ''
}

const totalDiagrams = computed(() => evidence.reduce((s, c) => s + c.diagrams.length, 0))
const missingDiagram = computed(() => evidence.filter((c) => c.diagrams.length === 0).map((c) => c.id))
const missingImpact = computed(() => evidence.filter((c) => c.impact.length === 0).map((c) => c.id))
const asText = (c: EvidenceCard): string => `${c.id} ${c.title}`
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="neo-card">
      <div class="flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border-2 border-black bg-neo-blue text-black">
          <PhTrophy :size="18" weight="bold" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-black leading-tight">项目成果</h2>
          <p class="mt-0.5 text-xs font-bold text-neutral-500">
            唯一事实源 · 来自 <code class="rounded bg-black/10 px-1">content/项目成果/EX-*.md</code>
          </p>
        </div>
      </div>
      <p class="mt-3 text-sm leading-relaxed text-neutral-700">
        这里只写「我做过什么、影响是什么」。简历、故事库、作品集、自我介绍都从这些卡派生 ——
        <span class="font-black">改一处，全站跟着变</span>。每张卡都要有影响数字和一张图。
      </p>

      <div v-if="evidence.length" class="mt-3 grid grid-cols-2 gap-2 border-t-2 border-dashed border-neutral-300 pt-3 sm:grid-cols-4">
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ evidence.length }}</div>
          <div class="text-[11px] font-bold text-neutral-500">张成果卡</div>
        </div>
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ totalDiagrams }}</div>
          <div class="text-[11px] font-bold text-neutral-500">张结构图</div>
        </div>
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ types.length }}</div>
          <div class="text-[11px] font-bold text-neutral-500">种成果类型</div>
        </div>
        <div class="rounded-lg border-2 border-black bg-white p-2 shadow-neo-sm">
          <div class="text-xl font-black">{{ evidence.filter((c) => c.hasStar).length }}</div>
          <div class="text-[11px] font-bold text-neutral-500">张可用作行为面</div>
        </div>
      </div>

      <div v-if="missingDiagram.length || missingImpact.length" class="mt-3 rounded-lg border-2 border-black bg-neo-pink/40 p-3">
        <p class="flex items-start gap-1.5 text-xs font-bold leading-relaxed">
          <PhInfo :size="14" weight="bold" class="mt-0.5 shrink-0" />
          <span>
            待补齐 ——
            <template v-if="missingDiagram.length">缺图：{{ missingDiagram.join(' / ') }}；</template>
            <template v-if="missingImpact.length">缺影响数字：{{ missingImpact.join(' / ') }}。</template>
            没有数字和图的成果，讲出来是没有重量的。
          </span>
        </p>
      </div>
    </div>

    <div v-if="!evidence.length" class="neo-card">
      <p class="text-sm font-bold text-neutral-600">
        还没有成果卡。从 <code class="rounded bg-black/10 px-1">content/项目成果/_模板.md</code> 复制一份，
        改名为 <code class="rounded bg-black/10 px-1">EX-001-项目名.md</code> 就能开始写。
      </p>
    </div>

    <div v-else-if="types.length > 1" class="flex flex-wrap items-center gap-2">
      <button
        class="neo-chip border-2"
        :class="!filter ? 'border-black bg-white font-black shadow-neo-sm' : 'border-transparent hover:bg-neo-yellow/60'"
        @click="filter = ''"
      >
        全部 {{ evidence.length }}
      </button>
      <button
        v-for="t in types"
        :key="t"
        class="neo-chip border-2"
        :class="filter === t ? 'border-black bg-white font-black shadow-neo-sm' : 'border-transparent hover:bg-neo-yellow/60'"
        @click="filter = t"
      >
        {{ t }}
      </button>
    </div>

    <div v-if="evidence.length" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article v-for="c in list" :key="c.id" class="neo-card flex flex-col">
        <div class="flex flex-wrap items-center gap-2">
          <span class="neo-chip !border-2 bg-black !text-white">{{ c.id }}</span>
          <span v-if="c.type" class="neo-chip status-ready">{{ c.type }}</span>
          <span class="ml-auto text-[11px] text-neutral-400">{{ c.updated }}</span>
        </div>

        <h3 class="mt-2 text-lg font-black leading-tight">{{ c.title }}</h3>
        <p v-if="c.oneLine" class="mt-1 text-sm font-bold leading-relaxed text-neutral-700" v-html="inline(c.oneLine)" />

        <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-neutral-500">
          <span v-if="c.period">{{ c.period }}</span>
          <span v-if="c.role">· {{ c.role }}</span>
          <span v-if="c.scale">· {{ c.scale }}</span>
        </div>

        <div v-if="c.impact.length" class="mt-3 overflow-x-auto rounded-lg border-2 border-black shadow-neo-sm">
          <table class="w-full border-collapse text-[13px]">
            <thead>
              <tr class="bg-black text-white">
                <th v-for="h in c.impactHead" :key="h" class="px-2.5 py-1.5 text-left font-black">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in c.impact" :key="i" class="border-t border-black/15" :class="i % 2 ? 'bg-neo-yellow/15' : ''">
                <td v-for="h in c.impactHead" :key="h" class="px-2.5 py-1.5 align-top leading-relaxed" v-html="inline(r[h] || '')" />
              </tr>
            </tbody>
          </table>
        </div>

        <div v-for="d in c.diagrams" :key="d.id" class="mt-3">
          <div class="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-neutral-500">
            <PhImage :size="12" weight="bold" />
            {{ d.name }}
          </div>
          <MermaidBlock :id="`ev-${c.id}-${d.id}`" :code="d.code" />
        </div>

        <div v-if="c.reuse.length" class="mt-3 flex flex-wrap items-center gap-1.5">
          <span class="text-[11px] font-bold text-neutral-500">可用于</span>
          <span v-for="r in c.reuse" :key="r" class="neo-chip !py-0 text-[10px]" :class="reuseTone(r)">{{ r }}</span>
        </div>

        <button class="neo-btn mt-3 w-full" @click="toggle(c.id)">
          <PhCaretDown :size="13" weight="bold" :class="expanded[c.id] ? 'rotate-180' : ''" class="transition-transform" />
          {{ expanded[c.id] ? '收起' : '展开完整卡片' }}
        </button>

        <div v-if="expanded[c.id]" class="mt-3 flex flex-col gap-3 border-t-2 border-dashed border-neutral-300 pt-3">
          <section v-for="(ch, ci) in detailChunks(c)" :key="ci">
            <h4 class="text-sm font-black">{{ ch.name }}</h4>
            <div class="mt-1.5">
              <Blocks :blocks="ch.blocks" :mid-prefix="`ev-${c.id}-${ci}`" compact />
            </div>
          </section>
          <p class="text-[11px] text-neutral-400" :title="asText(c)">{{ c.file }}</p>
        </div>
      </article>
    </div>

    <GuidePanel section-id="evidence" />
  </div>
</template>
