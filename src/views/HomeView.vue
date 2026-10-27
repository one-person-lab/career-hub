<script setup lang="ts">
import { computed } from 'vue'
import {
  PhTarget,
  PhArrowRight,
  PhCalendar,
  PhBrain,
  PhHourglass,
  PhFlagBanner,
  PhArrowClockwise,
} from '@phosphor-icons/vue'
import {
  pipeline,
  knowledge,
  upcomingInterviews,
  overdueRounds,
  staleApplications,
  unreadyRows,
  weakKnowledge,
  staleReview,
  STALE_REVIEW_DAYS,
  isLive,
  stageTone,
  readinessTone,
  type PipelineRow,
} from '../data/store'

const emit = defineEmits<{ (e: 'go', id: string): void }>()

/**
 * 首页只回答一个问题：我现在最该做什么。
 * 所以这里没有统计卡墙，只有排过序的行动行 —— 每行都能一键跳到能干活的那个页面。
 */

const soonest = computed<PipelineRow | undefined>(() => upcomingInterviews(1)[0])
const soon = computed(() => upcomingInterviews(5))
const overdue = computed(() => overdueRounds())
const silent = computed(() => staleApplications(7))
const unready = computed(() => unreadyRows())
const dueReview = computed(() => staleReview())
const weak = computed(() => weakKnowledge(5))

/** 今日三件事：按「离现场的远近」排序，越近越靠前 */
const focus = computed(() => {
  const items: { key: string; tone: string; text: string; sub: string; go: string }[] = []

  // 最近一场的动作已在顶部大卡说过，这里只列其余的，避免同一句话出现两次
  for (const p of soon.value.filter((x) => x.key !== soonest.value?.key).slice(0, 2)) {
    items.push({
      key: `s-${p.key}`,
      tone: stageTone(p.stage),
      text: p.action || `准备 ${p.company} 的 ${p.stage}`,
      sub: `${p.company} · ${p.nextRound}`,
      go: 'coach',
    })
  }
  for (const p of unready.value.slice(0, 1)) {
    items.push({
      key: `u-${p.key}`,
      tone: 'b-red',
      text: `${p.company} 准备度只有「${p.readiness}」，先补证据再进去`,
      sub: p.evidenceIds.length ? '已关联成果卡' : '还没有关联任何成果卡',
      go: 'pipeline',
    })
  }
  for (const k of dueReview.value.slice(0, 1)) {
    items.push({
      key: `r-${k.id}`,
      tone: 'b-amber',
      text: `复习 ${k.title}`,
      sub: `${k.reviewAge === null ? '从未复习' : k.reviewAge + ' 天没碰'} · 掌握度 ${k.level || '未标'}`,
      go: 'knowledge',
    })
  }
  for (const p of silent.value.slice(0, 1)) {
    items.push({
      key: `w-${p.key}`,
      tone: 'b-gray',
      text: `${p.company} 投出去 ${p.appliedAge} 天没回音`,
      sub: p.action || '决定是跟一次还是标暂停，别挂着',
      go: 'pipeline',
    })
  }
  return items.slice(0, 3)
})

const liveTotal = computed(() => pipeline.filter(isLive).length)
</script>

<template>
  <div class="mx-auto flex max-w-[1120px] flex-col gap-3">
    <!-- 下一场面试 -->
    <section class="panel flex items-center gap-4 !py-4">
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-weak text-brand-hi">
        <PhFlagBanner :size="16" weight="bold" />
      </span>
      <div v-if="soonest" class="min-w-0 flex-1">
        <p class="text-[15px] font-semibold text-ink">
          {{ soonest.company }} · {{ soonest.role }}
          <span class="chip ml-2"><span class="dot" :class="stageTone(soonest.stage)" />{{ soonest.stage }}</span>
        </p>
        <p class="mt-1 text-[12px] text-ink-2">
          {{ soonest.nextRound }} 开始 · 距今 {{ soonest.nextIn }} 天<template v-if="soonest.action"> · 下一步：{{ soonest.action }}</template>
          <span v-if="soonest.readiness" :class="readinessTone(soonest.readinessScore)" class="ml-2">
            准备度 {{ soonest.readiness }}
          </span>
        </p>
      </div>
      <div v-else class="min-w-0 flex-1">
        <p class="text-[15px] font-semibold text-ink">眼下没有排定面试</p>
        <p class="mt-1 text-[12px] text-ink-2">
          {{ liveTotal ? `${liveTotal} 个岗位在推进，但都没约时间` : '还没有岗位在推进' }}
        </p>
      </div>
      <button class="btn btn-primary shrink-0" @click="emit('go', soonest ? 'coach' : 'pipeline')">
        {{ soonest ? '去训练这场' : '去管道' }}
        <PhArrowRight :size="13" weight="bold" />
      </button>
    </section>

    <!-- 今日三件事 -->
    <section class="panel !p-0">
      <div class="group-head border-b border-line">
        <PhTarget :size="13" weight="bold" />
        今日三件事
      </div>
      <div class="p-1.5">
        <p v-if="!focus.length" class="px-3 py-6 text-center text-[12px] text-ink-3">没有卡住的行动。</p>
        <button v-for="f in focus" :key="f.key" class="row" @click="emit('go', f.go)">
          <span class="dot shrink-0" :class="f.tone" />
          <span class="min-w-0 flex-1 truncate text-[13px] text-ink">{{ f.text }}</span>
          <span class="hidden min-w-0 shrink-0 truncate text-[11px] text-ink-3 sm:block">{{ f.sub }}</span>
          <PhArrowRight :size="12" weight="bold" class="shrink-0 text-ink-3" />
        </button>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <!-- 近期面试 -->
      <section class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhCalendar :size="13" weight="bold" />
          近期面试
        </div>
        <div class="p-1.5">
          <p v-if="!soon.length && !overdue.length" class="px-3 py-6 text-center text-[12px] text-ink-3">
            没有排期的面试。
          </p>
          <button
            v-for="p in [...overdue, ...soon]"
            :key="p.key"
            class="row"
            :class="p.nextIn !== null && p.nextIn < 0 ? 'opacity-70' : ''"
            @click="emit('go', 'pipeline')"
          >
            <span class="w-[70px] shrink-0 font-mono text-[11px]" :class="p.nextIn !== null && p.nextIn < 0 ? 'text-red' : 'text-amber'">
              {{ p.nextIn !== null && p.nextIn < 0 ? '已过' : `${p.nextIn} 天后` }}
            </span>
            <span class="min-w-0 flex-1 truncate text-[13px] text-ink">{{ p.company }}</span>
            <span class="chip shrink-0"><span class="dot" :class="stageTone(p.stage)" />{{ p.stage }}</span>
          </button>
        </div>
      </section>

      <!-- 能力短板 -->
      <section class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhBrain :size="13" weight="bold" />
          能力短板
        </div>
        <div class="p-1.5">
          <p v-if="!weak.length" class="px-3 py-6 text-center text-[12px] text-ink-3">
            {{ knowledge.length ? '没有薄弱项。' : '还没有知识卡。' }}
          </p>
          <button v-for="k in weak" :key="k.id" class="row" @click="emit('go', 'knowledge')">
            <span class="min-w-0 flex-1 truncate text-[13px] text-ink">{{ k.title }}</span>
            <span class="chip shrink-0">{{ k.level || '未标' }}</span>
            <span class="w-[58px] shrink-0 text-right font-mono text-[10px] text-ink-3">
              {{ k.reviewAge === null ? '从未复习' : k.reviewAge + ' 天' }}
            </span>
          </button>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <!-- 复习队列 -->
      <section class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhArrowClockwise :size="13" weight="bold" />
          复习队列
          <span class="ml-auto font-mono text-[10px] text-ink-3">&gt; {{ STALE_REVIEW_DAYS }} 天没碰</span>
        </div>
        <div class="max-h-[188px] overflow-y-auto p-1.5">
          <p v-if="!dueReview.length" class="px-3 py-6 text-center text-[12px] text-ink-3">没有到期的知识点。</p>
          <button v-for="k in dueReview.slice(0, 12)" :key="k.id" class="row" @click="emit('go', 'knowledge')">
            <span class="min-w-0 flex-1 truncate text-[13px] text-ink">{{ k.title }}</span>
            <span class="shrink-0 font-mono text-[10px]" :class="k.reviewAge === null ? 'text-red' : 'text-amber'">
              {{ k.reviewAge === null ? '从未' : k.reviewAge + ' 天' }}
            </span>
          </button>
        </div>
      </section>

      <!-- 等回音 -->
      <section class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhHourglass :size="13" weight="bold" />
          等回音
          <span class="ml-auto font-mono text-[10px] text-ink-3">投递 &ge; 7 天</span>
        </div>
        <div class="max-h-[188px] overflow-y-auto p-1.5">
          <p v-if="!silent.length" class="px-3 py-6 text-center text-[12px] text-ink-3">没有已投出去却安静的岗位。</p>
          <button v-for="p in silent" :key="p.key" class="row" @click="emit('go', 'pipeline')">
            <span class="min-w-0 flex-1 truncate text-[13px] text-ink">{{ p.company }}</span>
            <span class="shrink-0 font-mono text-[10px] text-amber">{{ p.appliedAge }} 天</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
