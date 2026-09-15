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
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded-[3px] bg-black/10 px-1 py-px text-[0.92em]">$1</code>')
}
