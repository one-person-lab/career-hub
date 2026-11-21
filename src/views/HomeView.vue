<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowRight } from '@phosphor-icons/vue'
import {
  upcomingInterviews,
  overdueRounds,
  staleApplications,
  staleReview,
  weakKnowledge,
  isLive,
  pipeline,
  stageTone,
  readinessTone,
  questionsFor,
  readCoachHistory,
  type PipelineRow,
} from '../data/store'

const emit = defineEmits<{ (e: 'go', id: string): void }>()

const soonest = computed<PipelineRow | undefined>(() => upcomingInterviews(1)[0])
const liveTotal = computed(() => pipeline.filter(isLive).length)

/** 今天要完成：按「离现场远近」排，最多三条，指向能直接干活的页面 */
const todo = computed(() => {
  const out: { key: string; tone: string; text: string; go: string }[] = []
  const p = soonest.value
  if (p) {
    if (p.action) out.push({ key: 'action', tone: 'b-amber', text: p.action, go: 'prep' })
    const bank = questionsFor(p.company)
    if (bank.length) out.push({ key: 'bank', tone: 'b-gray', text: `过一遍 ${p.company} 的 ${bank.length} 道真题`, go: 'pitch::高频真题' })
    const today = new Date().toISOString().slice(0, 10)
    const practiced = readCoachHistory().some((s) => s.job.startsWith(p.company) && s.at.startsWith(today))
    if (!practiced) out.push({ key: 'mock', tone: 'b-blue', text: `模拟一轮，让 ${p.company} 的真题把自己问住`, go: 'coach' })
  }
  for (const s of overdueRounds()) {
    out.push({ key: `o-${s.key}`, tone: 'b-red', text: `${s.company} 的面试时间已过，记录结果或改期`, go: 'prep' })
  }
  for (const s of staleApplications()) {
    out.push({ key: `s-${s.key}`, tone: 'b-amber', text: `${s.company} 投出 ${s.appliedAge} 天没回音，决定跟或停`, go: 'prep' })
  }
  return out.slice(0, 3)
})

const review = computed(() =>
  [...staleReview(), ...weakKnowledge(3)].filter((k, i, all) => all.findIndex((x) => x.id === k.id) === i).slice(0, 3),
)
</script>

<template>
  <div class="mx-auto flex max-w-[760px] flex-col">
    <!-- 下一场面试：整页只有这一个主行动 -->
    <section class="flex items-start gap-4 py-6">
      <div class="min-w-0 flex-1">
        <template v-if="soonest">
          <p class="text-[22px] font-semibold leading-[30px] text-ink">
            {{ soonest.company }} · {{ soonest.role }}
          </p>
          <p class="mt-1.5 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-2">
            <span>{{ soonest.nextRound }}</span>
            <span class="font-mono text-ink-3">{{ soonest.nextIn }} 天后</span>
            <span class="flex items-center gap-1.5">
              <span class="dot" :class="stageTone(soonest.stage)" />{{ soonest.stage }}
            </span>
            <span v-if="soonest.readiness" :class="readinessTone(soonest.readinessScore)">准备度 {{ soonest.readiness }}</span>
          </p>
        </template>
        <template v-else>
          <p class="text-[22px] font-semibold leading-[30px] text-ink">眼下没有排定面试</p>
          <p class="mt-1.5 text-[13px] text-ink-2">
            {{ liveTotal ? `${liveTotal} 个岗位在推进，都还没约时间` : '还没有岗位在推进' }}
          </p>
        </template>
      </div>
      <button class="btn btn-primary shrink-0" @click="emit('go', soonest ? 'prep' : 'prep')">
        进入准备
        <PhArrowRight :size="13" weight="bold" />
      </button>
    </section>

    <section class="border-t border-line py-5">
      <h2 class="mb-1 text-[12px] font-medium text-ink-3">今天要完成</h2>
      <p v-if="!todo.length" class="py-3 text-[13px] text-ink-2">没有卡住的行动。</p>
      <button v-for="t in todo" :key="t.key" class="row items-start py-2 text-[14px] text-ink" @click="emit('go', t.go)">
        <span class="dot mt-[9px] shrink-0" :class="t.tone" />
        <span class="min-w-0 flex-1 leading-[22px] line-clamp-2">{{ t.text }}</span>
        <PhArrowRight :size="12" weight="bold" class="mt-[5px] shrink-0 text-ink-3" />
      </button>
    </section>

    <section v-if="review.length" class="border-t border-line py-5">
      <h2 class="mb-1 text-[12px] font-medium text-ink-3">待复习问题</h2>
      <button v-for="k in review" :key="k.id" class="row py-2 text-[14px] text-ink" @click="emit('go', 'prep-know')">
        <span class="min-w-0 flex-1 truncate">{{ k.title }}</span>
        <span class="shrink-0 font-mono text-[11px]" :class="k.reviewAge === null ? 'text-red' : 'text-amber'">
          {{ k.reviewAge === null ? '从未复习' : `${k.reviewAge} 天没碰` }}
        </span>
      </button>
    </section>
  </div>
</template>
