<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  PhMicrophone,
  PhPlay,
  PhStop,
  PhClock,
  PhBrain,
  PhTrophy,
  PhArrowRight,
  PhSpinner,
  PhCheckCircle,
  PhWarningCircle,
} from '@phosphor-icons/vue'
import {
  pipeline,
  knowledgeById,
  evidenceById,
  sectionById,
  isLive,
  upcomingInterviews,
  stageTone,
  questionsFor,
  questionBank,
  blocksPlain,
  readCoachHistory,
  COACH_HISTORY_KEY,
  type CoachSession,
  type KnowledgeCard,
  type PipelineRow,
  type EvidenceCard,
} from '../data/store'

const emit = defineEmits<{ (e: 'go', id: string): void }>()

/* ── 类型 ─────────────────────────────────────────────── */

interface Turn {
  question: string
  answer: string
  seconds: number
  feedback: Feedback | null
}

interface Feedback {
  score: number
  structure: number
  evidence: number
  depth: number
  verdict: string
  improve: string[]
  followup: string
  /** 自评只有一档，不编造三个分项的差别 */
  self?: boolean
}

type Session = CoachSession

/* ── 练习对象 ─────────────────────────────────────────── */

const liveRows = computed(() => pipeline.filter(isLive))

/** 和面试场次列表同序：有排期的按最临近在前 */
const orderedJobs = computed(() => {
  const due = (p: PipelineRow): number => (p.nextIn === null ? Number.POSITIVE_INFINITY : p.nextIn)
  return [...pipeline].sort((a, b) => due(a) - due(b))
})
const picked = ref('')

/** 默认停在最近的一场面试上；没排期就停在第一个还在推进的岗位 */
const job = computed(() => {
  const byPick = pipeline.find((p) => p.key === picked.value)
  if (byPick) return byPick
  const soon = upcomingInterviews(1)[0]
  return soon || liveRows.value[0] || pipeline[0]
})

const relatedKnowledge = computed<KnowledgeCard[]>(() =>
  (job.value?.knowledgeIds || []).map(knowledgeById).filter(Boolean) as KnowledgeCard[],
)
const relatedEvidence = computed<EvidenceCard[]>(() =>
  (job.value?.evidenceIds || []).map(evidenceById).filter(Boolean) as EvidenceCard[],
)
/** 公司作战室同一篇文档，作为「这家在意什么」的上下文 */
const companyDoc = computed(() => {
  const name = job.value?.companyDoc
  if (!name) return null
  return sectionById('companies')?.docs.find((d) => d.name === name) || null
})

/* ── 出题 ─────────────────────────────────────────────── */

const FALLBACK_QUESTIONS = [
  '挑一个你主导的项目，讲讲架构上最难的那个决策，以及为什么不用另一种做法。',
  '说一件你把指标真正推动起来的事，数字前后各是多少，你的动作是哪一步。',
  '你最近一次判断失误是什么时候？当时你怎么定的，后来怎么改的。',
]

/** 题库优先级：这家没底的点 → 岗位关联知识的追问链 → 这家公司的真题 → 全部真题 → 兜底题 */
function nextQuestion(used: Set<string>): string {
  const company = job.value?.company || ''
  const weak = (job.value?.brief?.gaps || [])
    .filter((g) => g.cover === '缺' || g.cover === '部分')
    .map((g) => `岗位要求「${g.need}」，你准备怎么答？`)
  const pools = [
    weak,
    relatedKnowledge.value.flatMap((k) => k.questions),
    questionsFor(company),
    questionBank().flatMap((g) => g.questions),
  ]
  for (const pool of pools) {
    const fresh = pool.filter((q) => q && !used.has(q))
    if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)]
  }
  const spare = FALLBACK_QUESTIONS.filter((q) => !used.has(q))
  return spare.length ? spare[Math.floor(Math.random() * spare.length)] : FALLBACK_QUESTIONS[0]
}

/* ── 会话状态 ─────────────────────────────────────────── */

const MAX_ROUNDS = 4

const turns = ref<Turn[]>([])
const question = ref('')
const answer = ref('')
const elapsed = ref(0)
const busy = ref(false)
const error = ref('')
const finished = ref(false)
const history = ref<Session[]>(readCoachHistory())

let timer = window.setInterval(() => {
  if (question.value && !busy.value && !finished.value) elapsed.value += 1
}, 1000)
onBeforeUnmount(() => window.clearInterval(timer))

/** 这台机器配了模型就交给教练评分，没配就当场自评 */
const coachReady = ref(false)
fetch('/api/coach')
  .then((r) => r.json())
  .then((d: { ready?: boolean }) => (coachReady.value = Boolean(d.ready)))
  .catch(() => (coachReady.value = false))

const usedQuestions = computed(() => new Set(turns.value.map((t) => t.question)))
const gradedTurns = computed(() => turns.value.filter((t) => t.feedback))
const avgScore = computed(() =>
  gradedTurns.value.length
    ? Math.round(gradedTurns.value.reduce((s, t) => s + (t.feedback?.score || 0), 0) / gradedTurns.value.length)
    : null,
)

const fmt = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function start() {
  turns.value = []
  finished.value = false
  error.value = ''
  elapsed.value = 0
  answer.value = ''
  question.value = nextQuestion(new Set())
}

function scoreOf(n: number): string {
  return n >= 80 ? 'text-green' : n >= 60 ? 'text-amber' : 'text-red'
}

/* ── 交给教练 ─────────────────────────────────────────── */

function buildMessages(): unknown[] {
  const brief = job.value?.brief
  const context = [
    job.value ? `目标岗位：${job.value.company} / ${job.value.role}（阶段 ${job.value.stage}）` : '目标岗位：未指定',
    brief && brief.what.length ? `公司是做什么的：${blocksPlain(brief.what)}` : '',
    brief && brief.duties.length ? `岗位职责：${blocksPlain(brief.duties)}` : '',
    brief && brief.gaps.length
      ? `这场没底的点：${brief.gaps.map((g) => `${g.cover}·${g.need}${g.ask ? `（${g.ask}）` : ''}`).join('；')}`
      : '',
    ...relatedEvidence.value.map(
      (e) => `可用成果 ${e.id}《${e.title}》：${e.oneLine || ''} ${e.impact.map((r) => Object.values(r).join(' ')).join('；')}`,
    ),
    ...relatedKnowledge.value.map(
      (k) =>
        `知识卡 ${k.id}《${k.title}》掌握度 ${k.level}：必须记住的数字 ${k.numbers.join('；')}；关键 trade-off ${k.tradeoffs
          .map((t) => Object.values(t).join(' '))
          .join('；')}`,
    ),
    companyDoc.value ? `公司关注点（${companyDoc.value.title}）：${companyDoc.value.intro.join(' ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const dialog = turns.value
    .map((t) => `面试官：${t.question}\n候选人：${t.answer}\n教练评分：${t.feedback?.score ?? '未评'}，${t.feedback?.verdict ?? ''}`)
    .join('\n')

  return [
    {
      role: 'system',
      content: [
        '你是一位严格的技术面试教练，为候选人做模拟面试反馈。',
        '只根据给出的个人材料评价，材料里没有的数字不得替候选人编造。',
        '评分看四点：结构是否清楚、是否用上了真实数字与具体决策、深度（能否经住追问）、与岗位的匹配度。',
        '必须只输出 JSON，不要代码围栏，形状为：',
        '{"score":0-100,"structure":0-100,"evidence":0-100,"depth":0-100,"verdict":"一句话结论","improve":["最多3条改进动作"],"followup":"下一句追问"}',
      ].join('\n'),
    },
    { role: 'user', content: `【个人材料】\n${context || '（未关联任何成果与知识卡）'}\n\n【已进行的对话】\n${dialog}\n\n【当前问题】\n${question.value}\n\n【候选人回答】\n${answer.value}` },
  ]
}

function parseFeedback(raw: string): Feedback | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end < 0) return null
  try {
    const o = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
    const num = (v: unknown): number => (typeof v === 'number' ? Math.round(v) : Number(v) || 0)
    return {
      score: num(o.score),
      structure: num(o.structure),
      evidence: num(o.evidence),
      depth: num(o.depth),
      verdict: String(o.verdict || ''),
      improve: Array.isArray(o.improve) ? o.improve.slice(0, 3).map(String) : [],
      followup: String(o.followup || ''),
    }
  } catch {
    return null
  }
}

async function submit() {
  if (!answer.value.trim() || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: buildMessages() }),
    })
    const data = (await res.json()) as { text?: string; error?: string }
    if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`)
    const fb = parseFeedback(data.text || '')
    if (!fb) throw new Error('教练返回的不是可解析的评分 JSON，重试一次')
    commit(fb)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

/** 没接模型时也能练：自评同样进历史 */
function selfScore(score: number) {
  commit({
    score,
    structure: score,
    evidence: score,
    depth: score,
    verdict: score >= 80 ? '自评：讲顺了，换个岗位该能复用' : score >= 60 ? '自评：骨架在，缺具体数字' : '自评：没讲清楚，回去重写',
    improve: [],
    followup: '',
    self: true,
  })
}

function commit(fb: Feedback) {
  turns.value.push({ question: question.value, answer: answer.value.trim(), seconds: elapsed.value, feedback: fb })
  answer.value = ''
  elapsed.value = 0
  if (turns.value.length >= MAX_ROUNDS) {
    stop()
    return
  }
  question.value = fb.followup || nextQuestion(usedQuestions.value)
}

function stop() {
  finished.value = true
  question.value = ''
  if (!gradedTurns.value.length) return
  history.value = [
    {
      id: `${Date.now()}`,
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      job: job.value ? `${job.value.company} · ${job.value.role}` : '通用',
      rounds: gradedTurns.value.length,
      score: avgScore.value || 0,
    },
    ...history.value,
  ].slice(0, 20)
  saveHistory(history.value)
}

/* ── 历史（localStorage） ─────────────────────────────── */

function saveHistory(list: Session[]): void {
  try {
    localStorage.setItem(COACH_HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* 隐私模式下写入失败不影响训练本身 */
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-[1240px] gap-3">
    <!-- 左：岗位选择 + 记录 -->
    <aside class="w-[236px] shrink-0 flex flex-col gap-3">
      <section class="panel !p-0">
        <div class="group-head border-b border-line">练习对象</div>
        <div class="max-h-[210px] overflow-y-auto p-1.5">
          <p v-if="!pipeline.length" class="px-2 py-4 text-[11px] text-ink-3">管道里还没有岗位，先回首页填管道。</p>
          <button
            v-for="p in orderedJobs"
            :key="p.key"
            class="row py-1.5 text-[12px]"
            :class="job?.key === p.key ? 'bg-raised text-ink' : 'text-ink-2'"
            @click="picked = p.key"
          >
            <span class="dot shrink-0" :class="stageTone(p.stage)" />
            <span class="min-w-0 flex-1 truncate">{{ p.company }}</span>
          </button>
        </div>
      </section>

      <section class="panel !p-0">
        <div class="group-head border-b border-line">练习记录</div>
        <div class="max-h-[240px] overflow-y-auto p-1.5">
          <p v-if="!history.length" class="px-2 py-4 text-[11px] leading-relaxed text-ink-3">
            还没有练习记录。
          </p>
          <div v-for="s in history" :key="s.id" class="row cursor-default text-[12px]">
            <span class="min-w-0 flex-1 truncate text-ink-2">{{ s.job }}</span>
            <span class="shrink-0 font-mono text-[10px] text-ink-3">{{ s.rounds }} 轮</span>
            <span class="w-[26px] shrink-0 text-right font-mono text-[11px]" :class="scoreOf(s.score || 0)">{{ s.score ?? '' }}</span>
          </div>
        </div>
      </section>
    </aside>

    <!-- 中：问答主区 -->
    <main class="min-w-0 flex-1 flex flex-col gap-3">
      <section class="panel flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-[14px] font-semibold text-ink">
            {{ job ? `${job.company} · ${job.role}` : '通用题' }}
          </p>
          <p class="mt-0.5 text-[11px] text-ink-2">
            {{ job ? (job.action ? `${job.stage} · 下一步：${job.action}` : job.stage) : '管道为空，练的是通用题' }}
          </p>
        </div>
        <span v-if="question" class="chip shrink-0">
          <PhClock :size="11" weight="bold" />
          {{ fmt(elapsed) }}
        </span>
        <button v-if="!question && !finished" class="btn btn-primary shrink-0" @click="start">
          <PhPlay :size="12" weight="bold" />
          开始
        </button>
        <button v-else-if="!finished" class="btn shrink-0" @click="stop">
          <PhStop :size="12" weight="bold" />
          结束
        </button>
      </section>

      <!-- 当前问题 -->
      <section v-if="question" class="panel">
        <p class="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-3">
          <PhMicrophone :size="12" weight="bold" />
          面试官提问（第 {{ turns.length + 1 }} 轮）
        </p>
        <p class="text-[16px] font-medium leading-relaxed text-ink">{{ question }}</p>

        <textarea
          v-model="answer"
          class="input mt-3 w-full"
          rows="7"
          placeholder="像当场回答那样写出来：先结论，再你的动作，最后数字。别写提纲。"
          @keydown.meta.enter.prevent="coachReady && submit()"
        />

        <div class="mt-2 flex flex-wrap items-center gap-2">
          <template v-if="coachReady">
            <button class="btn btn-primary" :disabled="!answer.trim() || busy" @click="submit">
              <PhSpinner v-if="busy" :size="12" class="animate-spin" />
              {{ busy ? '教练在评…' : '交卷评分' }}
            </button>
            <span class="text-[11px] text-ink-3"><span class="kbd">Cmd</span><span class="kbd">Enter</span></span>
          </template>
          <template v-else>
            <span class="text-[11px] text-ink-3">这题讲得怎么样</span>
            <button class="btn" :disabled="!answer.trim()" @click="selfScore(88)">讲清楚了</button>
            <button class="btn" :disabled="!answer.trim()" @click="selfScore(62)">一般</button>
            <button class="btn" :disabled="!answer.trim()" @click="selfScore(38)">没讲清</button>
          </template>
        </div>

        <p v-if="error" class="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-red">
          <PhWarningCircle :size="13" weight="bold" class="mt-0.5 shrink-0" />
          <span>{{ error }}</span>
        </p>
      </section>

      <section v-else-if="!finished" class="panel flex items-center gap-2 text-[13px] text-ink-2">
        <PhBrain :size="15" weight="bold" class="text-ink-3" />
        点「开始」出题。
      </section>

      <section v-else class="panel flex items-center gap-3">
        <PhCheckCircle :size="18" weight="bold" :class="avgScore && avgScore >= 70 ? 'text-green' : 'text-amber'" />
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-semibold text-ink">
            这一场练完了 · {{ turns.length }} 轮{{ avgScore !== null ? ` · 平均 ${avgScore} 分` : '' }}
          </p>
        </div>
        <button class="btn" @click="start"><PhPlay :size="12" weight="bold" />再来一场</button>
      </section>

      <!-- 逐轮反馈 -->
      <section v-for="(t, i) in turns" :key="i" class="panel !p-0">
        <div class="flex items-center gap-2 border-b border-line px-3.5 py-2">
          <span class="font-mono text-[10px] text-ink-3">第 {{ i + 1 }} 轮</span>
          <span class="min-w-0 flex-1 truncate text-[12px] text-ink-2">{{ t.question }}</span>
          <span class="chip shrink-0">{{ fmt(t.seconds) }}</span>
          <span v-if="t.feedback" class="font-mono text-[13px] font-semibold" :class="scoreOf(t.feedback.score)">
            {{ t.feedback.score }}
          </span>
        </div>

        <div class="px-3.5 py-3 flex flex-col gap-3">
          <p class="text-[13px] leading-relaxed text-ink-2">{{ t.answer }}</p>

          <div v-if="t.feedback">
            <div class="flex flex-wrap items-center gap-1.5">
              <span v-if="!t.feedback.self" class="chip">结构 {{ t.feedback.structure }}</span>
              <span v-if="!t.feedback.self" class="chip">实例 {{ t.feedback.evidence }}</span>
              <span v-if="!t.feedback.self" class="chip">深度 {{ t.feedback.depth }}</span>
              <span class="ml-1 text-[13px] text-ink">{{ t.feedback.verdict }}</span>
            </div>
            <ul v-if="t.feedback.improve.length" class="mt-2 flex flex-col gap-1">
              <li v-for="(x, xi) in t.feedback.improve" :key="xi" class="flex gap-2 text-[12px] leading-relaxed text-ink-2">
                <PhArrowRight :size="12" weight="bold" class="mt-0.5 shrink-0 text-brand-hi" />
                <span class="min-w-0">{{ x }}</span>
              </li>
            </ul>
            <p v-if="t.feedback.followup && i === turns.length - 1 && !finished" class="mt-2 text-[12px] text-ink-3">
              已接着追问 ↓
            </p>
          </div>
        </div>
      </section>
    </main>

    <!-- 右：参考资料 -->
    <aside class="w-[288px] shrink-0 flex flex-col gap-3">
      <section class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhTrophy :size="13" weight="bold" />
          可用成果
        </div>
        <div class="p-1.5">
          <p v-if="!relatedEvidence.length" class="px-2 py-3 text-[11px] leading-relaxed text-ink-3">
            这个岗位还没挂成果卡。
          </p>
          <button v-for="e in relatedEvidence" :key="e.id" class="row py-2 text-[12px]" @click="emit('go', 'evidence')">
            <div class="min-w-0 flex-1">
              <p class="truncate text-ink">{{ e.title }}</p>
              <p v-if="e.impact.length" class="mt-0.5 truncate text-[10px] text-ink-3">
                {{ Object.values(e.impact[0]).join(' ') }}
              </p>
            </div>
          </button>
        </div>
      </section>

      <section v-if="relatedKnowledge.length" class="panel !p-0">
        <div class="group-head border-b border-line">
          <PhBrain :size="13" weight="bold" />
          知识与追问素材
        </div>
        <div class="max-h-[420px] overflow-y-auto p-1.5">
          <div v-for="k in relatedKnowledge" :key="k.id" class="border-b border-line px-2 py-2.5 last:border-b-0">
            <button class="flex w-full items-center gap-1.5 text-left" @click="emit('go', 'prep-know')">
              <span class="min-w-0 flex-1 truncate text-[12px] text-ink">{{ k.title }}</span>
              <span class="chip shrink-0">{{ k.level || '未标' }}</span>
            </button>
            <ul v-if="k.numbers.length" class="mt-1.5 flex flex-col gap-0.5">
              <li v-for="(n, ni) in k.numbers.slice(0, 3)" :key="ni" class="text-[11px] leading-relaxed text-ink-3">
                {{ n }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="companyDoc" class="panel !p-0">
        <div class="group-head border-b border-line">这家公司在意什么</div>
        <div class="p-3">
          <p v-for="(l, i) in companyDoc.intro" :key="i" class="text-[12px] leading-relaxed text-ink-2">{{ l }}</p>
          <button class="btn btn-ghost mt-2" @click="emit('go', 'companies')">
            打开公司资料
            <PhArrowRight :size="11" weight="bold" />
          </button>
        </div>
      </section>
    </aside>
  </div>
</template>
