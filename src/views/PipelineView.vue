<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhKanban, PhListBullets, PhArrowRight, PhTrophy, PhGraph, PhCalendar, PhLightning } from '@phosphor-icons/vue'
import {
  pipeline,
  pipelineByStage,
  PIPELINE_STAGES,
  stageTone,
  readinessTone,
  evidenceById,
  knowledgeById,
  isLive,
  type PipelineRow,
} from '../data/store'

const emit = defineEmits<{ (e: 'go', id: string): void }>()

/**
 * 管道：一行一个「公司 × 岗位」，内容真身在 content/00-Projects/岗位管道.md 的表格里。
 * 这一页只做两件事——按阶段看清楚都卡在哪，以及点开某一行时把关联的成果和知识调出来。
 */

const view = ref<'list' | 'board'>('list')
const stageFilter = ref('')
const selected = ref<string>('')

const rows = computed(() => (stageFilter.value ? pipeline.filter((p) => p.stage === stageFilter.value) : pipeline))

/** 选中行兜底：默认停在最近一场面试上 */
watch(
  () => rows.value,
  (list) => {
    if (!list.some((p) => p.key === selected.value)) selected.value = list[0]?.key || ''
  },
  { immediate: true },
)

const active = computed(() => pipeline.find((p) => p.key === selected.value))
const groups = computed(() => pipelineByStage())
const liveCount = computed(() => pipeline.filter(isLive).length)

const dayLabel = (p: PipelineRow): string =>
  p.nextIn === null ? '' : p.nextIn < 0 ? `已过 ${Math.abs(p.nextIn)} 天` : p.nextIn === 0 ? '今天' : `${p.nextIn} 天后`

const timeline = (stage: string): string[] => {
  const i = PIPELINE_STAGES.indexOf(stage)
  return PIPELINE_STAGES.slice(0, Math.max(0, i)).filter((s) => s !== '暂停' && s !== '已结束')
}
</script>

<template>
  <div class="mx-auto flex max-w-[1240px] flex-col gap-3">
    <div v-if="!pipeline.length" class="panel">
      <p class="text-[13px] text-ink-2">
        管道是空的。往 <code class="font-mono text-ink">content/00-Projects/岗位管道.md</code> 的「## 管道」表格里加一行，
        <code class="font-mono text-ink">npm run gen:data</code> 后即可显示。
      </p>
    </div>

    <template v-else>
      <!-- 工具栏 -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="tabs">
          <button class="tab" :class="view === 'list' ? 'tab-active' : ''" @click="view = 'list'">
            <PhListBullets :size="12" weight="bold" class="mr-1 inline" />
            列表
          </button>
          <button class="tab" :class="view === 'board' ? 'tab-active' : ''" @click="view = 'board'">
            <PhKanban :size="12" weight="bold" class="mr-1 inline" />
            看板
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-1">
          <button
            class="chip transition-colors hover:bg-hover hover:text-ink"
            :class="!stageFilter ? 'chip-solid text-ink' : ''"
            @click="stageFilter = ''"
          >
            全部 {{ pipeline.length }}
          </button>
          <button
            v-for="g in groups"
            :key="g.stage"
            class="chip transition-colors hover:bg-hover hover:text-ink"
            :class="stageFilter === g.stage ? 'chip-solid text-ink' : ''"
            @click="stageFilter = g.stage"
          >
            <span class="dot" :class="stageTone(g.stage)" />
            {{ g.stage }} {{ g.rows.length }}
          </button>
        </div>

        <span class="ml-auto text-[11px] text-ink-3">{{ liveCount }} 个仍在推进</span>
      </div>

      <div class="flex min-h-0 gap-3">
        <!-- 主区 -->
        <div class="panel min-w-0 flex-1 !p-0">
          <!-- 列表 -->
          <div v-if="view === 'list'" class="overflow-x-auto">
            <table class="w-full border-collapse text-[13px]">
              <thead>
                <tr class="bg-base">
                  <th class="w-[150px] border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">公司</th>
                  <th class="border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">岗位</th>
                  <th class="w-[96px] border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">阶段</th>
                  <th class="w-[104px] border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">下一轮</th>
                  <th class="w-[68px] border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">准备度</th>
                  <th class="border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">下一步</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in rows"
                  :key="p.key"
                  class="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-hover"
                  :class="p.key === selected ? 'bg-raised' : ''"
                  @click="selected = p.key"
                >
                  <td class="px-3 py-2 font-medium text-ink">{{ p.company }}</td>
                  <td class="px-3 py-2 text-ink-2">{{ p.role }}</td>
                  <td class="px-3 py-2">
                    <span class="chip"><span class="dot" :class="stageTone(p.stage)" />{{ p.stage }}</span>
                    <span v-if="!p.stageKnown" class="ml-1 text-[10px] text-amber">阶段未识别</span>
                  </td>
                  <td class="px-3 py-2">
                    <template v-if="p.nextRound">
                      <div class="text-ink-2">{{ p.nextRound }}</div>
                      <div class="font-mono text-[10px]" :class="p.nextIn !== null && p.nextIn < 0 ? 'text-red' : 'text-amber'">
                        {{ dayLabel(p) }}
                      </div>
                    </template>
                    <span v-else class="text-[11px] text-ink-3">—</span>
                  </td>
                  <td class="px-3 py-2">
                    <span :class="readinessTone(p.readinessScore)">{{ p.readiness || '—' }}</span>
                  </td>
                  <td class="max-w-[280px] truncate px-3 py-2 text-ink-2" :title="p.action">{{ p.action || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 看板 -->
          <div v-else class="flex gap-3 overflow-x-auto p-3">
            <div v-for="g in groups" :key="g.stage" class="w-[220px] shrink-0">
              <div class="group-head">
                <span class="dot" :class="stageTone(g.stage)" />
                {{ g.stage }}
                <span class="ml-auto font-mono text-[10px] text-ink-3">{{ g.rows.length }}</span>
              </div>
              <div class="mt-1 flex flex-col gap-1.5">
                <button
                  v-for="p in g.rows"
                  :key="p.key"
                  class="rounded-md border border-line bg-base p-2.5 text-left transition-colors hover:border-line-strong"
                  :class="p.key === selected ? 'border-brand' : ''"
                  @click="selected = p.key"
                >
                  <p class="truncate text-[13px] font-medium text-ink">{{ p.company }}</p>
                  <p class="mt-0.5 truncate text-[11px] text-ink-3">{{ p.role }}</p>
                  <p v-if="p.nextRound" class="mt-1.5 flex items-center gap-1 text-[10px]" :class="p.nextIn !== null && p.nextIn < 0 ? 'text-red' : 'text-amber'">
                    <PhCalendar :size="10" weight="bold" />
                    {{ p.nextRound }} · {{ dayLabel(p) }}
                  </p>
                  <p v-if="p.action" class="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-2">{{ p.action }}</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 详情栏 -->
        <aside v-if="active" class="panel w-[300px] shrink-0 self-start !p-0">
          <div class="border-b border-line px-3.5 py-3">
            <p class="text-[14px] font-semibold text-ink">{{ active.company }}</p>
            <p class="mt-0.5 text-[12px] text-ink-2">{{ active.role }}</p>
            <div class="mt-2 flex items-center gap-2">
              <span class="chip"><span class="dot" :class="stageTone(active.stage)" />{{ active.stage }}</span>
              <span v-if="active.applied" class="text-[11px] text-ink-3">投递于 {{ active.applied }}（{{ active.appliedAge }} 天前）</span>
              <span v-else-if="active.appliedRaw" class="text-[11px] text-ink-3">投递于 {{ active.appliedRaw }} · 具体日期待补</span>
            </div>
          </div>

          <!-- 阶段进度 -->
          <div class="border-b border-line px-3.5 py-3">
            <p class="mb-2 text-[11px] uppercase tracking-wide text-ink-3">走到哪了</p>
            <div class="flex flex-wrap items-center gap-1">
              <template v-for="(s, i) in timeline(active.stage)" :key="s">
                <span class="chip">{{ s }}</span>
                <span v-if="i < timeline(active.stage).length - 1" class="text-ink-3">›</span>
              </template>
              <span class="chip chip-solid text-ink">{{ active.stage }}</span>
            </div>
          </div>

          <div class="border-b border-line px-3.5 py-3">
            <p class="mb-1 text-[11px] uppercase tracking-wide text-ink-3">下一步</p>
            <p class="text-[13px] leading-relaxed text-ink">{{ active.action || '没写下个动作 —— 这一行等于卡住了' }}</p>
          </div>

          <div v-if="active.evidenceIds.length" class="border-b border-line px-3.5 py-3">
            <p class="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-3">
              <PhTrophy :size="12" weight="bold" />
              关联成果
            </p>
            <button v-for="id in active.evidenceIds" :key="id" class="row py-1.5" @click="emit('go', 'evidence')">
              <span class="w-[46px] shrink-0 font-mono text-[10px] text-ink-3">{{ id }}</span>
              <span class="min-w-0 flex-1 truncate text-[12px] text-ink">{{ evidenceById(id)?.title || '还没有这张卡' }}</span>
              <PhArrowRight v-if="!evidenceById(id)" :size="11" weight="bold" class="shrink-0 text-amber" />
            </button>
          </div>

          <div v-if="active.knowledgeIds.length" class="border-b border-line px-3.5 py-3">
            <p class="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-3">
              <PhGraph :size="12" weight="bold" />
              关联知识
            </p>
            <button v-for="id in active.knowledgeIds" :key="id" class="row py-1.5" @click="emit('go', 'knowledge')">
              <span class="w-[46px] shrink-0 font-mono text-[10px] text-ink-3">{{ id }}</span>
              <span class="min-w-0 flex-1 truncate text-[12px] text-ink">{{ knowledgeById(id)?.title || '还没有这张卡' }}</span>
              <span v-if="knowledgeById(id)" class="chip shrink-0">{{ knowledgeById(id)?.level }}</span>
            </button>
          </div>

          <div class="flex gap-2 px-3.5 py-3">
            <button class="btn btn-primary flex-1" @click="emit('go', 'coach')">
              <PhLightning :size="13" weight="bold" />
              训练这个岗位
            </button>
          </div>
          <p class="px-3.5 pb-3 text-[10px] text-ink-3">
            第 {{ active.row }} 行 · 改数据请回 <span class="font-mono text-ink-2">content/00-Projects/岗位管道.md</span>
          </p>
        </aside>
      </div>
    </template>
  </div>
</template>
