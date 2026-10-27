<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhTrophy, PhImage, PhBuildings } from '@phosphor-icons/vue'
import { evidence, pipeline, inline, type EvidenceCard, type PipelineRow } from '../data/store'
import Blocks from '../components/Blocks.vue'
import MermaidBlock from '../components/MermaidBlock.vue'
import GuidePanel from '../components/GuidePanel.vue'

/**
 * 项目与经历：唯一事实源。
 * 左侧挑一条成果，右侧看它的数字、图与可复用场景 —— 并回答「哪几个岗位正在用它」。
 */
const filter = ref('')
const types = computed(() => [...new Set(evidence.map((c) => c.type || '未分类'))])
const list = computed(() => (filter.value ? evidence.filter((c) => (c.type || '未分类') === filter.value) : evidence))

const selected = ref('')
watch(
  () => list.value,
  (l) => {
    if (!l.some((c) => c.id === selected.value)) selected.value = l[0]?.id || ''
  },
  { immediate: true },
)
const active = computed(() => evidence.find((c) => c.id === selected.value))

/** 这两个小节已经渲染在详情正面了，展开时不用再出现一次 */
const ON_CARD = new Set(['影响', '架构图'])
const detailChunks = (c: EvidenceCard) => c.chunks.filter((ch) => !ON_CARD.has(ch.name))

/** 被哪些岗位引用：管道表里的 EX 编号 */
function usedBy(id: string): PipelineRow[] {
  return pipeline.filter((p) => p.evidenceIds.includes(id))
}

const reuseTone = (r: string): string => {
  if (r.includes('简历')) return 'b-blue'
  if (r.includes('行为') || r.includes('STAR')) return 'b-amber'
  if (r.includes('技术')) return 'b-purple'
  if (r.includes('作品')) return 'b-green'
  return 'b-gray'
}

const missingDiagram = computed(() => evidence.filter((c) => c.diagrams.length === 0).map((c) => c.id))
const missingImpact = computed(() => evidence.filter((c) => c.impact.length === 0).map((c) => c.id))
</script>

<template>
  <div class="mx-auto flex max-w-[1240px] flex-col gap-3">
    <!-- 质量缺口 -->
    <div
      v-if="missingDiagram.length || missingImpact.length"
      class="panel flex items-start gap-2 border-amber/30 !bg-amber/[0.06]"
    >
      <span class="dot mt-1.5 shrink-0 b-amber" />
      <p class="text-[12px] leading-relaxed text-ink-2">
        待补齐 ——
        <template v-if="missingImpact.length">缺影响数字：{{ missingImpact.join(' / ') }}；</template>
        <template v-if="missingDiagram.length">缺图：{{ missingDiagram.join(' / ') }}。</template>
        没有数字和图的成果，讲出来是没有重量的。
      </p>
    </div>

    <div v-if="!evidence.length" class="panel">
      <p class="text-[13px] leading-relaxed text-ink-2">
        还没有成果卡。从 <span class="font-mono text-ink">content/项目成果/_模板.md</span> 复制一份，
        改名为 <span class="font-mono text-ink">EX-001-项目名.md</span> 就能开始写。
      </p>
    </div>

    <div v-else class="flex min-h-0 gap-3">
      <!-- 左：成果列表 -->
      <aside class="w-[268px] shrink-0 flex flex-col gap-2">
        <div v-if="types.length > 1" class="flex flex-wrap gap-1">
          <button
            class="chip transition-colors hover:bg-hover hover:text-ink"
            :class="!filter ? 'chip-solid text-ink' : ''"
            @click="filter = ''"
          >
            全部 {{ evidence.length }}
          </button>
          <button
            v-for="t in types"
            :key="t"
            class="chip transition-colors hover:bg-hover hover:text-ink"
            :class="filter === t ? 'chip-solid text-ink' : ''"
            @click="filter = t"
          >
            {{ t }}
          </button>
        </div>

        <div class="panel !p-0">
          <div class="group-head border-b border-line">
            <PhTrophy :size="12" weight="bold" />
            {{ list.length }} 条
          </div>
          <div class="max-h-[calc(100vh-260px)] overflow-y-auto p-1.5">
            <button
              v-for="c in list"
              :key="c.id"
              class="row py-2 text-[12px]"
              :class="c.id === selected ? 'bg-raised text-ink' : 'text-ink-2'"
              @click="selected = c.id"
            >
              <span class="w-[52px] shrink-0 font-mono text-[10px] text-ink-3">{{ c.id }}</span>
              <span class="min-w-0 flex-1 truncate">{{ c.title }}</span>
              <span v-if="usedBy(c.id).length" class="chip shrink-0 !px-1.5">
                <PhBuildings :size="9" weight="bold" />
                {{ usedBy(c.id).length }}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <!-- 右：详情 -->
      <div v-if="active" class="min-w-0 flex-1 flex flex-col gap-3">
        <section class="panel">
          <div class="flex flex-wrap items-center gap-2">
            <span class="chip chip-solid font-mono">{{ active.id }}</span>
            <span v-if="active.type" class="chip">{{ active.type }}</span>
            <span class="ml-auto text-[11px] text-ink-3">更新 {{ active.updated || '—' }}</span>
          </div>

          <h2 class="mt-2 text-[18px] font-semibold leading-tight text-ink">{{ active.title }}</h2>
          <p v-if="active.oneLine" class="mt-1.5 text-[13px] leading-relaxed text-ink-2" v-html="inline(active.oneLine)" />

          <div class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-3">
            <span v-if="active.period">{{ active.period }}</span>
            <span v-if="active.role">角色：{{ active.role }}</span>
            <span v-if="active.scale">规模：{{ active.scale }}</span>
            <span class="font-mono">{{ active.file }}</span>
          </div>
        </section>

        <section v-if="active.impact.length" class="panel !p-0">
          <div class="group-head border-b border-line">影响</div>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-[13px]">
              <thead>
                <tr class="bg-base">
                  <th
                    v-for="h in active.impactHead"
                    :key="h"
                    class="border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, i) in active.impact"
                  :key="i"
                  class="border-b border-line last:border-b-0"
                  :class="i % 2 ? 'bg-white/[0.02]' : ''"
                >
                  <td v-for="h in active.impactHead" :key="h" class="px-3 py-2 align-top leading-relaxed text-ink-2" v-html="inline(r[h] || '')" />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 复用与岗位反查 -->
        <section class="panel !p-0">
          <div class="group-head border-b border-line">这条成果能被谁用</div>
          <div class="flex flex-col gap-1.5 p-3">
            <div v-if="active.reuse.length" class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] text-ink-3">可用于</span>
              <span v-for="r in active.reuse" :key="r" class="chip">
                <span class="dot" :class="reuseTone(r)" />
                {{ r }}
              </span>
            </div>
            <div v-if="usedBy(active.id).length" class="mt-1 flex flex-col gap-1">
              <p class="text-[11px] text-ink-3">正在被这些岗位引用</p>
              <div
                v-for="p in usedBy(active.id)"
                :key="p.key"
                class="row cursor-default py-1.5 text-[12px]"
              >
                <span class="min-w-0 flex-1 truncate text-ink-2">{{ p.company }} · {{ p.role }}</span>
                <span class="chip shrink-0">{{ p.stage }}</span>
              </div>
            </div>
            <p v-if="!usedBy(active.id).length && !active.reuse.length" class="text-[12px] text-ink-3">
              还没挂到任何岗位，也没标可复用场景 —— 一条没人用的成果，等于没写。
            </p>
          </div>
        </section>

        <section v-for="d in active.diagrams" :key="d.id" class="panel !p-0">
          <div class="group-head border-b border-line">
            <PhImage :size="12" weight="bold" />
            {{ d.name }}
          </div>
          <div class="p-3">
            <MermaidBlock :id="`ev-${active.id}-${d.id}`" :code="d.code" />
          </div>
        </section>

        <section v-for="(ch, ci) in detailChunks(active)" :key="ci" class="panel !p-0">
          <div class="group-head border-b border-line">{{ ch.name }}</div>
          <div class="px-3.5 py-3">
            <Blocks :blocks="ch.blocks" :mid-prefix="`ev-${active.id}-${ci}`" compact />
          </div>
        </section>
      </div>
    </div>

    <GuidePanel v-if="evidence.length" section-id="evidence" />
  </div>
</template>
