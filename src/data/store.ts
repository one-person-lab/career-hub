import raw from './generated.json'
import type { Block, Chunk, Diagram } from './types'
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
  PhBookOpenText,
  PhArchive,
  PhBooks,
  PhGear,
} from '@phosphor-icons/vue'

/* ==================== 通用块 ==================== */

// 类型与 inline 定义在 ./types（无数据依赖，演示产物只引那边），
// 这里 re-export 出去，既有 11 个消费方的 import 路径不用改。
export * from './types'

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

/** 这场面试要什么：公司简介、职责、要求、我缺的那几块 */
export interface PipelineBrief {
  doc: string
  /** 基本信息摊到场页：公司、薪资、地点、硬性要求 */
  facts: { k: string; v: string }[]
  jdLink: string
  what: Block[]
  duties: Block[]
  requirements: Block[]
  gaps: { need: string; cover: string; ask: string }[]
  /** 「面试前要做完」清单 */
  todo: string[]
}

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
  brief?: PipelineBrief
  /** 同名公司资料的文档名；有它才有「完整资料」可点，哪怕职责还没录 */
  companyDoc?: string
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
  /** 列表里的一句话，取引用或正文第一段 */
  summary: string
  chunks: Chunk[]
  flowCount: number
  chars: number
}

export interface Section {
  id: string
  label: string
  /** 挂在哪张页面里：nav = 一级导航；prep-jobs / prep-know 是面试准备的两个页签；evidence / help */
  host: string
  /** 知识库里的分组：技术 / 项目 / 求职；其他页面没有 */
  group?: string
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

/* ==================== 导出 ==================== */

const r = raw as Record<string, unknown>
export const sections: Section[] = r.sections as Section[]
export const evidence: EvidenceCard[] = r.evidence as EvidenceCard[]
export const knowledge: KnowledgeCard[] = r.knowledge as KnowledgeCard[]
export const pipeline: PipelineRow[] = (r.pipeline as PipelineRow[]) ?? []

/* ==================== 岗位作战室 ==================== */

export interface WarQuestion {
  id: string
  level: string
  q: string
  asked: string[]
  answer: Block[]
  diagram: Block[]
  followups: string[]
}

export interface WarGroup {
  code: string
  title: string
  questions: WarQuestion[]
}

export interface WarRoom {
  company: string
  role: string
  doc: string
  groups: WarGroup[]
  total: number
}

export const warrooms: WarRoom[] = (r.warroom as WarRoom[]) ?? []

/** 岗位名对不上时退回第一篇，作战室永远有东西可看 */
export const warRoomFor = (company: string): WarRoom | undefined =>
  warrooms.find((w) => company && (company.includes(w.company) || w.company.includes(company))) || warrooms[0]
export const generatedAt = String(r.generatedAt || '')

/* ==================== 派生指标 ==================== */

/** 一级导航：首页 / 面试准备 / 项目资产 / 知识库 / 设置 */
export const primaryNav = (): Section[] => sections.filter((s) => s.host === 'nav').sort((a, b) => a.order - b.order)

export const sectionById = (id: string): Section | undefined => sections.find((s) => s.id === id)

/** 内容板块（不含内置视图） */
export const contentSections = (): Section[] => sections.filter((s) => !s.builtin)

/** 某张页面里挂着的板块。空板块不出现，避免点进去一片空 */
export const docsByHost = (host: string): Section[] =>
  sections.filter((s) => !s.builtin && s.host === host && s.docs.length > 0).sort((a, b) => a.order - b.order)

/** 知识库：除面试题与设置之外的全部文档 */
export const librarySections = (): Section[] => docsByHost('library')

/** 设置页的正文 */
export const settingsSection = (): Section | undefined => sections.find((s) => s.host === 'settings')

/* ==================== 岗位职责 → 我的技术材料 ==================== */

/** 岗位描述里出现这些词，就算用到这个技术方向 */
const TECH_MATCH: { id: string; words: string[] }[] = [
  { id: 'ai', words: ['ai', 'llm', '大模型', 'rag', 'agent', 'prompt', '向量', '知识库', '评测', 'mcp', 'langchain', 'langgraph', 'dify', 'coze', '幻觉', '工作流', '智能问答'] },
  { id: 'java', words: ['java', 'jvm', 'spring', '并发', '多线程', '线程池', '后端'] },
  { id: 'go', words: ['golang', 'go 服务', 'go语言', 'go 语言'] },
  { id: 'db', words: ['mysql', 'redis', '缓存', '数据库', 'elasticsearch', 'postgresql', '分库分表', '对象存储'] },
  { id: 'middleware', words: ['kafka', 'rabbitmq', '消息队列', 'netty', 'websocket', 'spring cloud', 'springcloud', 'dubbo', '微服务'] },
  { id: 'architecture', words: ['架构', '高可用', '稳定性', '性能', '扩展', '认证', '授权', '权限', '租户', '安全', '监控', '链路'] },
  { id: 'devops', words: ['docker', 'kubernetes', 'k8s', 'ci/cd', 'cicd', '容器', '部署', '发布', '告警', '自动化测试'] },
  { id: 'frontend', words: ['前端', 'vue', 'react', 'uni-app', '对话页'] },
]

/** 块序列拍平成文本：给提示词和关键词匹配共用 */
export const blocksPlain = (blocks: Block[]): string =>
  blocks
    .flatMap((b) =>
      b.type === 'list'
        ? b.items
        : b.type === 'quote'
          ? b.lines
          : b.type === 'table'
            ? b.rows.flatMap((r) => Object.values(r))
            : 'text' in b
              ? [b.text]
              : [],
    )
    .join(' ')

/** 小写版，用来和 TECH_MATCH 的词表对 */
export const blocksText = (blocks: Block[]): string => blocksPlain(blocks).toLowerCase()
    .toLowerCase()

/** 岗位职责点到哪几块技术，直接给知识库里的对应方向 */
export const materialsFor = (blocks: Block[]): { id: string; label: string; count: number }[] => {
  const text = blocksText(blocks)
  if (!text.trim()) return []
  return TECH_MATCH.flatMap(({ id, words }) => {
    const s = sectionById(id)
    if (!s || s.docs.length === 0) return []
    if (!words.some((w) => text.includes(w))) return []
    return [{ id, label: s.label, count: s.docs.length }]
  })
}

/** 任意板块归到哪张页面，文档页的返回按钮与侧栏点亮都用它 */
/** 面试准备下的三个页签都挂同一个侧栏入口 */
const PREP_HOSTS = new Set(['prep-jobs', 'prep-war'])
export const navIdOf = (id: string): string => {
  const s = sectionById(id)
  if (!s || s.host === 'nav') return id
  return PREP_HOSTS.has(s.host) ? 'prep' : s.host
}

/** 真题库：高频真题一篇里，一节是一个公司，一节下面的条目是题 */
export const questionBank = (): { company: string; questions: string[] }[] => {
  const doc = sectionById('pitch')?.docs.find((d) => d.name === '高频真题')
  if (!doc) return []
  return doc.chunks
    .filter((c) => c.name !== '正文')
    .map((c) => ({ company: c.name, questions: c.blocks.flatMap((b) => (b.type === 'list' ? b.items : [])) }))
    .filter((g) => g.questions.length > 0)
}

/** 这一场面试的真题；公司名对不上就返回空 */
export const questionsFor = (company: string): string[] =>
  questionBank()
    .filter((g) => company && (company.includes(g.company) || g.company.includes(company)))
    .flatMap((g) => g.questions)

/* ==================== 练习记录 ==================== */

export interface CoachSession {
  id: string
  at: string
  job: string
  rounds: number
  score: number | null
}

export const COACH_HISTORY_KEY = 'career-hub:coach-sessions'

export const readCoachHistory = (): CoachSession[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(COACH_HISTORY_KEY) || '[]')
    return Array.isArray(raw) ? (raw as CoachSession[]) : []
  } catch {
    return []
  }
}

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

/** 超过这个天数没碰，才算「到期」 */
export const STALE_REVIEW_DAYS = 21

/** 真正到期的复习队列 —— 全站唯一口径，导航徽标与各视图都用它 */
export const staleReview = (): KnowledgeCard[] =>
  dueForReview().filter((k) => (k.reviewAge ?? 9999) > STALE_REVIEW_DAYS)

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
  book: PhBookOpenText,
  archive: PhArchive,
  books: PhBooks,
  gear: PhGear,
}

export const sectionIcon = (key: string): unknown => SECTION_ICONS[key] || PhFileText
