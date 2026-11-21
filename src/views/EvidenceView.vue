<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { evidence, pipeline, inline, type EvidenceCard, type PipelineRow } from '../data/store'
import Blocks from '../components/Blocks.vue'
import MermaidBlock from '../components/MermaidBlock.vue'

/**
 * 项目资产：唯一事实源。
 * 左侧挑一条成果，右侧看它的数字、图与可复用场景 —— 并回答「哪几个岗位正在用它」。
 */

const list = computed(() => evidence)

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
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
    <p v-if="!evidence.length" class="text-[13px] leading-[20px] text-ink-2">还没有成果卡。</p>

    <div v-else class="flex min-h-0 gap-6">
      <!-- 左：成果列表 -->
      <aside class="flex w-[248px] shrink-0 flex-col">
        <p class="mb-1 px-2 text-[12px] leading-[18px] text-ink-3">成果</p>
        <button
          v-for="c in list"
          :key="c.id"
          class="row py-2 text-[13px]"
          :class="c.id === selected ? 'bg-raised text-ink' : 'text-ink-2'"
          @click="selected = c.id"
        >
          <span class="min-w-0 flex-1 truncate">{{ c.title }}</span>
        </button>
      </aside>

      <!-- 右：档案正文 -->
      <div v-if="active" class="flex min-w-0 flex-1 flex-col gap-6">
        <header>
          <div class="flex items-center gap-2 text-[12px] leading-[18px] text-ink-3">
            <span v-if="active.type">{{ active.type }}</span>
            <span v-if="active.updated" class="ml-auto">更新 {{ active.updated }}</span>
          </div>
          <h1 class="mt-1.5 text-[22px] font-semibold leading-[30px] text-ink">{{ active.title }}</h1>
          <p v-if="active.oneLine" class="mt-2 text-[14px] leading-[22px] text-ink-2" v-html="inline(active.oneLine)" />
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] leading-[18px] text-ink-3">
            <span v-if="active.period">{{ active.period }}</span>
            <span v-if="active.role">角色：{{ active.role }}</span>
            <span v-if="active.scale">规模：{{ active.scale }}</span>
          </div>
        </header>

        <section v-if="active.impact.length">
          <h2 class="mb-2 text-[13px] font-semibold leading-[20px] text-ink">影响</h2>
          <div class="overflow-x-auto border-y border-line">
            <table class="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th
                    v-for="h in active.impactHead"
                    :key="h"
                    class="border-b border-line px-3 py-2 text-left text-[11px] font-medium text-ink-3"
                  >
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in active.impact" :key="i" class="border-b border-line last:border-b-0">
                  <td
                    v-for="h in active.impactHead"
                    :key="h"
                    class="px-3 py-2 align-top leading-relaxed text-ink-2"
                    v-html="inline(r[h] || '')"
                  />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="mb-1.5 text-[13px] font-semibold leading-[20px] text-ink">能被谁用</h2>
          <p v-if="active.reuse.length" class="text-[13px] leading-[20px] text-ink-2">
            可用于 {{ active.reuse.join(' / ') }}
          </p>
          <template v-if="usedBy(active.id).length">
            <p class="mt-1 text-[13px] leading-[20px] text-ink-2">
              正在被
              <template v-for="(p, pi) in usedBy(active.id)" :key="p.key">
                <span v-if="pi" class="text-ink-3"> · </span>
                <span class="text-ink">{{ p.company }}</span>
                <span class="text-ink-3">（{{ p.stage }}）</span>
              </template>
              引用
            </p>
          </template>
          <p v-if="!usedBy(active.id).length && !active.reuse.length" class="text-[13px] leading-[20px] text-ink-3">
            还没有岗位引用这张卡。
          </p>
        </section>

        <section v-for="d in active.diagrams" :key="d.id">
          <h2 class="mb-2 text-[13px] font-semibold leading-[20px] text-ink">{{ d.name }}</h2>
          <MermaidBlock :id="`ev-${active.id}-${d.id}`" :code="d.code" />
        </section>

        <section v-for="(ch, ci) in detailChunks(active)" :key="ci">
          <h2 class="mb-2 text-[13px] font-semibold leading-[20px] text-ink">{{ ch.name }}</h2>
          <Blocks :blocks="ch.blocks" :mid-prefix="`ev-${active.id}-${ci}`" />
        </section>
      </div>
    </div>
  </div>
</template>
