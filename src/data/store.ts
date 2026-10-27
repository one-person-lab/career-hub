import raw from './generated.json'
import {
  PhGauge,
  PhCompass,
  PhTrophy,
  PhGraph,
  PhTarget,
  PhMegaphone,
  PhBuildings,
  PhPencil,
  PhInfo,
  PhNotebook,
  PhFileText,
  PhWrench,
  PhFiles,
  PhKanban,
  PhMicrophone,
} from '@phosphor-icons/vue'

/* ==================== 通用块 ==================== */

export type Block =
  | { type: 'para'; text: string }
  | { type: 'h'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; head: string[]; rows: Record<string, string>[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'mermaid'; lang: string; text: string }

export interface Chunk {
  name: string
  blocks: Block[]
}

export interface Diagram {
  id: string
  name: string
  code: string
}

/* ==================== 成果卡 ==================== */

export interface EvidenceCard {
  id: string
  file: string
  name: string
  title: string
  oneLine: string
  type: string
  period: string
  role: string
  scale: string
  reuse: string[]
  updated: string
  impact: Record<string, string>[]
  impactHead: string[]
  diagrams: Diagram[]
  chunks: Chunk[]
  hasStar: boolean
  dir: string
  chars: number
}

/* ==================== 知识卡 ==================== */

export interface KnowledgeCard {
  id: string
  file: string
  name: string
  title: string
  oneLine: string
  domain: string
  level: string
  levelScore: number
  lastReview: string
  reviewAge: number | null
  jobs: string[]
  updated: string
  tradeoffs: Record<string, string>[]
  numbers: string[]
  questions: string[]
  anchors: string[]
  diagrams: Diagram[]
  chunks: Chunk[]
  dir: string
  chars: number
}

/* ==================== 岗位管道 ==================== */

export interface PipelineRow {
  key: string
  company: string
  role: string
  stage: string
  stageKnown: boolean
  applied: string | null
  /** 表格里原样写的日期，可能只到月份（2026-07）——解析不出 ISO 时用它兜底显示 */
  appliedRaw: string
  appliedAge: number | null
  nextAt: string | null
  /** 距今天还有几天；负数=已过但没记录结果 */
  nextIn: number | null
  nextRound: string
  action: string
  readiness: string
  readinessScore: number
  evidenceIds: string[]
  knowledgeIds: string[]
  row: number
}

/* ==================== 通用板块 ==================== */

export interface SectionDoc {
  name: string
  path: string
  title: string
  version: string
  status: string
  updated: string
  intro: string[]
  chunks: Chunk[]
  flowCount: number
  chars: number
}

export interface Section {
  id: string
  label: string
  group: string
  order: number
  icon: string
  /** 导航里的色块底色 class */
  tone: string
  builtin: boolean
  /** 内容板块对应的 content/ 子目录名；内置视图没有 */
  dir?: string
  /** 卡片型板块由专用视图渲染，docs 恒为空 */
  cardDir?: boolean
  docs: SectionDoc[]
}

/* ==================== 旧库盘点 ==================== */

export interface LegacyStat {
  root: string
  mdTotal: number
  htmlTotal: number
  byDir: { dir: string; count: number }[]
}

/* ==================== 导出 ==================== */

const r = raw as Record<string, unknown>
export const sections: Section[] = r.sections as Section[]
export const evidence: EvidenceCard[] = r.evidence as EvidenceCard[]
export const knowledge: KnowledgeCard[] = r.knowledge as KnowledgeCard[]
export const pipeline: PipelineRow[] = (r.pipeline as PipelineRow[]) ?? []
export const legacy: LegacyStat | null = (r.legacy as LegacyStat) ?? null
export const generatedAt: string = r.generatedAt as string

/* ==================== 派生指标 ==================== */

export const sectionGroups: { group: string; items: Section[] }[] = (() => {
  const map = new Map<string, Section[]>()
  for (const s of sections) {
    if (!map.has(s.group)) map.set(s.group, [])
    map.get(s.group)!.push(s)
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }))
})()

export const sectionById = (id: string): Section | undefined => sections.find((s) => s.id === id)

/** 内容板块（不含内置视图） */
export const contentSections = (): Section[] => sections.filter((s) => !s.builtin)

/** 知识卡按领域分组，按领域内的最高掌握度排序 */
export const knowledgeByDomain = (): { domain: string; cards: KnowledgeCard[] }[] => {
  const map = new Map<string, KnowledgeCard[]>()
  for (const c of knowledge) {
    if (!map.has(c.domain)) map.set(c.domain, [])
    map.get(c.domain)!.push(c)
  }
  return [...map.entries()]
    .map(([domain, cards]) => ({ domain, cards: cards.sort((a, b) => b.levelScore - a.levelScore) }))
    .sort((a, b) => b.cards.length - a.cards.length)
}

/** 成果卡按类型分组 */
export const evidenceByType = (): { type: string; cards: EvidenceCard[] }[] => {
  const map = new Map<string, EvidenceCard[]>()
  for (const c of evidence) {
    const t = c.type || '未分类'
    if (!map.has(t)) map.set(t, [])
    map.get(t)!.push(c)
  }
  return [...map.entries()].map(([type, cards]) => ({ type, cards }))
}

/** 需要复习的知识点：越久没看越靠前；没记过复习日期的排最前 */
export const dueForReview = (): KnowledgeCard[] =>
  [...knowledge].sort((a, b) => (b.reviewAge ?? 9999) - (a.reviewAge ?? 9999))

/** 掌握度分布 */
export const levelDistribution = (): { level: string; score: number; count: number }[] =>
  ['能讲', '熟练', '理解', '生疏']
    .map((level, i) => ({
      level,
      score: 4 - i,
      count: knowledge.filter((k) => k.level === level).length,
    }))
    .filter((x) => x.count > 0)

/** 空内容板块（有目录、还没写 md） */
export const emptySections = (): Section[] => contentSections().filter((s) => s.docs.length === 0)

export const emptyCardDirs = (): { dir: string; count: number }[] =>
  [
    { dir: '项目成果', count: evidence.length },
    { dir: '知识点', count: knowledge.length },
  ].filter((x) => x.count === 0)

/* ==================== 管道派生 ==================== */

/** 看板列顺序；终态列排在最后 */
export const PIPELINE_STAGES = [
  '待投',
  '已投',
  '笔试测评',
  '一面',
  '二面',
  '三面',
  'HR面',
  'Offer',
  '暂停',
  '已结束',
]

/** 还在推进的岗位 —— 终态的不参与「下一步做什么」 */
const LIVE = new Set(['待投', '已投', '笔试测评', '一面', '二面', '三面', 'HR面', 'Offer'])
export const isLive = (row: PipelineRow): boolean => LIVE.has(row.stage)

export const stageTone = (stage: string): string =>
  ({
    待投: 'b-gray',
    已投: 'b-gray',
    笔试测评: 'b-blue',
    一面: 'b-blue',
    二面: 'b-blue',
    三面: 'b-blue',
    HR面: 'b-purple',
    Offer: 'b-green',
    暂停: 'b-amber',
    已结束: 'b-red',
  })[stage] || 'b-gray'

export const readinessTone = (score: number): string =>
  score >= 3 ? 'text-green' : score === 2 ? 'text-amber' : score === 1 ? 'text-red' : 'text-ink-3'

/** 按阶段分组，只保留有行的列 */
export const pipelineByStage = (): { stage: string; rows: PipelineRow[] }[] =>
  PIPELINE_STAGES.map((stage) => ({ stage, rows: pipeline.filter((p) => p.stage === stage) })).filter(
    (g) => g.rows.length > 0,
  )

/** 近期面试：已安排下一轮、且还没过期的，按时间升序 */
export const upcomingInterviews = (limit = 5): PipelineRow[] =>
  pipeline
    .filter((p) => p.nextIn !== null && p.nextIn >= 0)
    .sort((a, b) => (a.nextIn ?? 0) - (b.nextIn ?? 0))
    .slice(0, limit)

/** 逾期未记录：约了时间却已经过去 */
export const overdueRounds = (): PipelineRow[] =>
  pipeline.filter((p) => p.nextIn !== null && p.nextIn < 0)

/** 投出去超过 N 天没回音 */
export const staleApplications = (days = 7): PipelineRow[] =>
  pipeline.filter((p) => p.stage === '已投' && (p.appliedAge ?? 0) >= days)

/** 还没长熟就进了面试的行：准备度低/中 */
export const unreadyRows = (): PipelineRow[] =>
  pipeline.filter((p) => isLive(p) && p.readinessScore > 0 && p.readinessScore <= 2)

/* ==================== 卡片索引 ==================== */

export const evidenceById = (id: string): EvidenceCard | undefined => evidence.find((e) => e.id === id)
export const knowledgeById = (id: string): KnowledgeCard | undefined => knowledge.find((k) => k.id === id)

/** 薄弱项：掌握度最低优先，其次越久没复习越靠前 */
export const weakKnowledge = (limit = 6): KnowledgeCard[] =>
  [...knowledge]
    .filter((k) => k.levelScore <= 2)
    .sort((a, b) => a.levelScore - b.levelScore || (b.reviewAge ?? 9999) - (a.reviewAge ?? 9999))
    .slice(0, limit)

/* ==================== 图标 ==================== */

const SECTION_ICONS: Record<string, unknown> = {
  gauge: PhGauge,
  compass: PhCompass,
  trophy: PhTrophy,
  graph: PhGraph,
  target: PhTarget,
  megaphone: PhMegaphone,
  buildings: PhBuildings,
  pencil: PhPencil,
  info: PhInfo,
  notebook: PhNotebook,
  doc: PhFileText,
  wrench: PhWrench,
  files: PhFiles,
  kanban: PhKanban,
  mic: PhMicrophone,
}

export const sectionIcon = (key: string): unknown => SECTION_ICONS[key] || PhFileText

/* ==================== 行内渲染 ==================== */

/**
 * md 行内标记 → 安全 HTML（先转义再放行 ** 与 `）。
 * 全站唯一的富文本出口，别在视图里另写一套。
 */
export function inline(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded-[3px] bg-white/10 px-1 py-px font-mono text-[0.9em] text-ink">$1</code>',
    )
}
