<script setup lang="ts">
import { computed } from 'vue'
import { PhGauge, PhArrowRight, PhWarningCircle, PhArchive } from '@phosphor-icons/vue'
import {
  sections,
  sectionById,
  sectionGroups,
  emptySections,
  emptyCardDirs,
  evidence,
  knowledge,
  legacy,
  generatedAt,
} from '../data/store'
import MermaidBlock from '../components/MermaidBlock.vue'

defineEmits<{ (e: 'go', id: string): void }>()

/**
 * 总览：两条腿的状态 + 系统怎么用 + 还缺什么。
 * 这里只做「指向」不做「复述」—— 具体内容都在各板块里。
 */

const sec = (id: string) => sectionById(id)

const countDocs = (id: string): number => sec(id)?.docs.length || 0

const legs = computed(() => [
  {
    key: '长期积累',
    desc: '长期资产：我做过什么、我懂什么。越用越值钱，不随某次求职结束而作废。',
    tone: 'bg-neo-blue',
    items: [
      { id: 'evidence', label: '成果卡', n: evidence.length, unit: '张' },
      { id: 'knowledge', label: '知识点', n: knowledge.length, unit: '个' },
      { id: 'position', label: '定位文档', n: countDocs('position'), unit: '篇' },
    ],
  },
  {
    key: '求职',
    desc: '找工作时用：对着具体岗位和公司准备材料，每轮面试结束当天记录下来。',
    tone: 'bg-neo-yellow',
    items: [
      { id: 'jobs', label: '目标岗位', n: countDocs('jobs'), unit: '篇' },
      { id: 'pitch', label: '面试问答', n: countDocs('pitch'), unit: '篇' },
      { id: 'companies', label: '公司准备', n: countDocs('companies'), unit: '篇' },
      { id: 'reviews', label: '面试记录', n: countDocs('reviews'), unit: '篇' },
    ],
  },
])

/** 派生关系图从 content/使用说明/系统说明.md 里取第一张 mermaid 图 —— 不写死在视图里 */
const methodDiagram = computed(() => {
  const s = sec('method')
  const doc = s?.docs.find((d) => d.name.includes('系统说明')) || s?.docs[0]
  for (const c of doc?.chunks || []) {
    const m = c.blocks.find((b) => b.type === 'mermaid') as { text: string } | undefined
    if (m) return m.text
  }
  return ''
})

const todoList = computed(() => [
  ...emptyCardDirs().map((x) => ({ id: x.dir === '项目成果' ? 'evidence' : 'knowledge', label: x.dir, hint: '还没有任何卡片' })),
  ...emptySections().map((s) => ({ id: s.id, label: s.label, hint: '目录已建，还没放 md' })),
])

const cardCount = computed(() => evidence.length + knowledge.length)
const sectionCount = computed(() => sections.length)
const groupCount = computed(() => sectionGroups.length)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="neo-card">
      <div class="flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border-2 border-black bg-neo-blue text-black">
          <PhGauge :size="18" weight="bold" />
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="text-2xl font-black leading-tight">职业工作台</h2>
          <p class="mt-0.5 text-xs font-bold text-neutral-500">
            {{ groupCount }} 组板块 · {{ sectionCount }} 个板块 · {{ cardCount }} 张卡 · 生成于 {{ generatedAt.slice(0, 10) }}
          </p>
        </div>
      </div>
      <p class="mt-3 text-sm leading-relaxed text-neutral-700">
        三条主线的第三个工作台。前两个（媒体、产品）是「长期建设型」——每天用、越用越值钱；
        这个不一样：<span class="font-black">它的价值峰值集中在求职与面试周期里</span>。
        所以设计目标不是「把文档排得好看」，而是<span class="font-black">面试前几分钟能翻到要看的那个答案</span>。
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section v-for="leg in legs" :key="leg.key" class="neo-card flex flex-col">
        <div class="flex items-center gap-2">
          <span class="h-3 w-3 shrink-0 rounded-[3px] border-2 border-black" :class="leg.tone" />
          <h3 class="text-lg font-black">{{ leg.key }}</h3>
        </div>
        <p class="mt-1 text-xs font-bold leading-relaxed text-neutral-500">{{ leg.desc }}</p>
        <div class="mt-3 flex flex-col gap-2">
          <button
            v-for="it in leg.items"
            :key="it.id"
            class="flex items-center gap-3 rounded-lg border-2 border-black bg-white px-3 py-2 text-left shadow-neo-sm transition-transform hover:-translate-y-px"
            @click="$emit('go', it.id)"
          >
            <span class="min-w-0 flex-1 text-sm font-bold">{{ it.label }}</span>
            <span class="text-lg font-black leading-none">{{ it.n }}</span>
            <span class="text-[11px] font-bold text-neutral-500">{{ it.unit }}</span>
            <PhArrowRight :size="14" weight="bold" class="shrink-0 text-neutral-400" />
          </button>
        </div>
      </section>
    </div>

    <div class="neo-card">
      <h3 class="text-lg font-black">这套系统靠什么运转</h3>
      <p class="mt-1 text-sm leading-relaxed text-neutral-700">
        只有一个原则：<span class="font-black">项目成果是唯一事实源</span>。简历、故事库、自我介绍、作品集都是它的派生视图。
        所以你不需要维护四份互相矛盾的稿子 —— 改一条成果，四处同时更新。
      </p>
      <div v-if="methodDiagram" class="mt-3">
        <MermaidBlock id="overview-method" :code="methodDiagram" />
      </div>
      <p v-else class="mt-3 rounded-lg border-2 border-dashed border-neutral-300 p-3 text-xs font-bold text-neutral-500">
        在 <code class="rounded bg-black/10 px-1">content/使用说明/系统说明.md</code> 里放一张 mermaid 图，这里就会显示。
      </p>
    </div>

    <div v-if="todoList.length" class="neo-card !bg-neo-pink/30">
      <h3 class="flex items-center gap-2 text-lg font-black">
        <PhWarningCircle :size="17" weight="bold" />
        还差什么
      </h3>
      <p class="mt-1 text-xs font-bold text-neutral-600">
        骨架已经就位，这些位置填内容不用改任何代码。往对应目录放一个 .md 即可。
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="t in todoList"
          :key="t.label"
          class="neo-chip !border-2 bg-white hover:bg-neo-yellow/60"
          @click="$emit('go', t.id)"
        >
          {{ t.label }} · {{ t.hint }}
        </button>
      </div>
    </div>

    <div v-if="legacy" class="neo-card">
      <h3 class="flex items-center gap-2 text-lg font-black">
        <PhArchive :size="17" weight="bold" />
        旧库盘点
      </h3>
      <p class="mt-1 text-xs font-bold text-neutral-500">
        <code class="rounded bg-black/10 px-1">../career-os/</code> 只读扫描，正文没有被导入 —— 骨架先立，内容再挑。
        现有 {{ legacy.mdTotal }} 篇 md / {{ legacy.htmlTotal }} 个 html。
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <span v-for="d in legacy.byDir" :key="d.dir" class="neo-chip !border-2 !py-0.5 bg-white">
          {{ d.dir }} <span class="font-black">{{ d.count }}</span>
        </span>
      </div>
    </div>

    <div class="neo-card">
      <h3 class="text-lg font-black">日常怎么用</h3>
      <ol class="mt-2 flex flex-col gap-2">
        <li v-for="(s, i) in [
          { t: '做完一件事，就往项目成果加一张卡', d: '时间 / 我做了什么 / 影响是什么数字 / 学到什么。四行就够，别攒着 —— 一周后你就忘掉 70%。' },
          { t: '遇到一个新的知识盲点，就往知识点加一张卡', d: '重点不是「定义」，是 trade-off、必须记住的数字、以及会被怎么追问。再配一张图。' },
          { t: '要投一家公司，就去公司准备开一页', d: '从项目成果挑对应的例子组成回答，面试完当天把问答记到面试记录。' },
          { t: '隔一段时间回来看「该复习了」', d: '知识和成果都会过期。间隔重复比一次性背完有效得多。' },
        ]" :key="i" class="flex gap-2.5 rounded-lg border-2 border-black bg-white p-2.5 shadow-neo-sm">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] border-2 border-black bg-neo-yellow text-xs font-black">
            {{ i + 1 }}
          </span>
          <div class="min-w-0">
            <div class="text-sm font-black">{{ s.t }}</div>
            <div class="mt-0.5 text-xs leading-relaxed text-neutral-600">{{ s.d }}</div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>
