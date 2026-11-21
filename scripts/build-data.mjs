#!/usr/bin/env node
/**
 * 职业工作台数据管道：扫描 content/，生成 src/data/generated.json
 *
 * 来源：
 *  1. content/<PARA>/<板块>/*.md  —— 本仓库内的干净骨架（00-Projects / 10-Areas / 20-Resources / 30-Archive 只决定默认挂靠哪张页面）
 *  2. content/10-Areas/知识点/K-*.md —— 知识卡（知识点 + 图，能力图谱）
 *  3. ../career-os/**             —— **可选只读盘点**：旧库还剩多少资产、分布在哪，不导入正文（目录缺失时自动跳过）
 *
 * 这是工作台与文件系统之间的唯一接缝。
 * 与 media-hub / product-hub 的 build-data.mjs 同构：视图层零改动即可换数据源。
 *
 * 用法：npm run gen:data（dev/build 前自动执行）
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const CONTENT = join(ROOT, 'content')
// 本地私有副本：真实简历 / 成果卡 / 面试记录放这里，整目录 gitignored，只进构建产物不进公开仓。
// 同名文件以私有为准，公开仓那份自动被盖掉。
const PRIVATE = join(ROOT, 'content.private')
const LEGACY = join(ROOT, '..', 'career-os')
const OUT = join(ROOT, 'src/data/generated.json')
const OUT_SHOW = join(ROOT, 'src/data/generated.show.json')

const EXCLUDE_DIRS = new Set(['.git', 'node_modules', '.obsidian', '.trash', '.kiro', 'dist', '.vite'])

/** content.private/.hidden —— 一行一个 content 相对路径，把公开示例从真实部署里剔掉 */
const HIDDEN_FILE = join(PRIVATE, '.hidden')
const hidden = new Set(
  existsSync(HIDDEN_FILE)
    ? readFileSync(HIDDEN_FILE, 'utf8')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('#'))
    : [],
)
// 成果卡（EX）目录：本公开仓库默认不含真实成果卡（隐私），保留常量以便本地私有副本启用
const EVIDENCE_DIR = '项目成果'
// 知识卡（K）目录：随 PARA 重构嵌套在 10-Areas 下
const KNOWLEDGE_DIR = '10-Areas/知识点'

const today = new Date()
today.setHours(0, 0, 0, 0)

// ── 通用解析工具（与另两个工作台保持一致） ──────────────────────

/** frontmatter（--- 包裹的 键: 值） */
function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const o = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([^：:]+)[：:]\s*(.*)$/)
    if (kv) o[kv[1].trim()] = kv[2].trim()
  }
  return o
}

/** markdown 表格 → 对象数组（一个 body 里可有多张表） */
function tables(body) {
  const groups = []
  let cur = []
  for (const line of (body || '').split('\n')) {
    if (/^\s*\|/.test(line)) cur.push(line)
    else {
      if (cur.length) groups.push(cur)
      cur = []
    }
  }
  if (cur.length) groups.push(cur)

  return groups.map((rows) => {
    const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((s) => s.trim())
    const head = cells(rows[0]).map(plainText)
    return rows
      .slice(1)
      .filter((r) => !/^[\s|:-]+$/.test(r))
      .map((r) => {
        const c = cells(r)
        const o = {}
        head.forEach((h, i) => (o[h] = c[i] ?? ''))
        return o
      })
  })
}

/** "- item" / "* item" / "1. item"（K 卡的追问链用编号，锚点与数字用短横线，两种都要抽到） */
function bullets(body) {
  return (body || '')
    .split('\n')
    .map((l) => l.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/))
    .filter(Boolean)
    .map((m) => m[1].trim())
}

/** 第一段引用块内容 */
function firstQuote(body) {
  const m = (body || '').match(/^>\s*(.+)$/m)
  return m ? m[1].replace(/\*\*/g, '').trim() : ''
}

/** 行内清洗：去掉链接语法，保留 ** 与 ` 交给前端做强调渲染 */
function cleanInline(s) {
  return (s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim()
}

/** 纯文本：列表行里只放一句话，标记全部去掉 */
function plainText(s) {
  return cleanInline(s).replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1').replace(/\s+/g, ' ').trim()
}

/** 按逗号 / 斜杠 / 顿号拆多值 */
function splitList(s) {
  return (s || '')
    .split(/[、,，/|]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/**
 * 把 markdown 正文拆成可渲染的块序列。
 * 支持：围栏代码块（含 mermaid）/ 段落 / 列表 / 表格 / 引用 / 三四级标题。
 */
function parseBlocks(body) {
  const lines = (body || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  const isTable = (l) => /^\s*\|/.test(l)
  const isQuote = (l) => /^>/.test(l)
  const isList = (l) => /^\s*(?:[-*]|\d+\.)\s+/.test(l)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    const fence = line.match(/^```([\w-]*)\s*$/)
    if (fence) {
      const lang = (fence[1] || '').toLowerCase()
      const buf = []
      i += 1
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i])
        i += 1
      }
      i += 1
      blocks.push({ type: lang === 'mermaid' ? 'mermaid' : 'code', lang, text: buf.join('\n').trim() })
      continue
    }

    const h = line.match(/^(#{3,6})\s+(.+)$/)
    if (h) {
      blocks.push({ type: 'h', level: h[1].length, text: plainText(h[2]) })
      i += 1
      continue
    }

    if (isTable(line)) {
      const buf = []
      while (i < lines.length && isTable(lines[i])) {
        buf.push(lines[i])
        i += 1
      }
      const t = tables(buf.join('\n'))
      if (t[0] && t[0].length) blocks.push({ type: 'table', head: Object.keys(t[0][0]), rows: t[0] })
      continue
    }

    if (isQuote(line)) {
      const buf = []
      while (i < lines.length && isQuote(lines[i])) {
        buf.push(lines[i])
        i += 1
      }
      blocks.push({ type: 'quote', lines: buf.map((l) => cleanInline(l.replace(/^>\s?/, ''))).filter(Boolean) })
      continue
    }

    if (isList(line)) {
      const buf = []
      while (i < lines.length && (isList(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        buf.push(lines[i])
        i += 1
      }
      blocks.push({
        type: 'list',
        ordered: /^\s*\d+\./.test(buf[0]),
        items: buf.filter((l) => isList(l)).map((l) => cleanInline(l.replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))),
      })
      continue
    }

    const buf = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{3,6}\s|```|\s*\||>|\s*(?:[-*]|\d+\.)\s)/.test(lines[i])
    ) {
      buf.push(lines[i])
      i += 1
    }
    if (buf.length) blocks.push({ type: 'para', text: cleanInline(buf.join(' ')) })
    else i += 1
  }
  return blocks
}

/** 递归找文件 */
function walk(dir, filter, skipDirs = EXCLUDE_DIRS) {
  const out = []
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (skipDirs.has(e.name) || e.name.startsWith('.')) continue
      out.push(...walk(join(dir, e.name), filter, skipDirs))
    } else if (filter(join(dir, e.name), e.name)) out.push(join(dir, e.name))
  }
  return out
}

function daysAgo(dateStr) {
  if (!dateStr) return null
  const t = new Date(String(dateStr).slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(t.getTime())) return null
  return Math.max(0, Math.round((today - t) / 86400000))
}

/**
 * 从自由文本里抠出日期：`2026-10-28` / `10-28`（缺年份按今年补，落在过去则顺延一年）。
 * 管道表里的「下一轮时间」是手写的，不能要求格式严格。
 */
function parseDate(text) {
  const s = String(text || '')
  const full = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (full) return `${full[1]}-${pad(full[2])}-${pad(full[3])}`
  const short = s.match(/(?:^|[^\d])(\d{1,2})-(\d{1,2})(?!\d)/)
  if (!short) return null
  const y = today.getFullYear()
  let iso = `${y}-${pad(short[1])}-${pad(short[2])}`
  if (new Date(iso + 'T00:00:00') < today) {
    iso = `${y + 1}-${pad(short[1])}-${pad(short[2])}`
  }
  return iso
}

const pad = (n) => String(n).padStart(2, '0')

/** 距今天还有几天：负数=已过期 */
function daysUntil(dateStr) {
  if (!dateStr) return null
  const t = new Date(String(dateStr) + 'T00:00:00')
  if (Number.isNaN(t.getTime())) return null
  return Math.round((t - today) / 86400000)
}

/** 把 md 拆成 { frontmatter, h1, intro, chunks } 通用结构 */
function parseDoc(md) {
  const fm = frontmatter(md)
  const h1 = (md.match(/^#\s+(.+)$/m) || [])[1] || ''
  const body = md.replace(/^---\n[\s\S]*?\n---\n?/, '').replace(/^#\s+.*$/m, '')
  const parts = body.split(/^##\s+(.+)$/m)
  const chunks = []
  for (let i = 1; i < parts.length; i += 2) {
    chunks.push({
      name: plainText(parts[i].replace(/[（(].*$/, '')),
      raw: parts[i + 1] || '',
      blocks: parseBlocks(parts[i + 1] || ''),
    })
  }
  const head = parseBlocks(parts[0] || '')
  const intro = (head.find((b) => b.type === 'quote') || {}).lines || []
  return { fm, h1: h1.replace(/\*\*/g, '').trim(), intro, chunks, head, md }
}

/** 抽取所有 mermaid 图，并用最近的 H3/H4 或所在 H2 命名 */
function extractDiagrams(md) {
  const out = []
  const re = /```mermaid\n([\s\S]*?)```/g
  let m
  let i = 0
  while ((m = re.exec(md))) {
    i += 1
    const before = md.slice(0, m.index)
    const heads = [...before.matchAll(/^#{2,4}\s+(.+)$/gm)]
    const name = heads.length ? heads.at(-1)[1].replace(/\*\*/g, '').trim() : `图 ${i}`
    out.push({ id: `d${i}`, name, code: m[1].trim() })
  }
  return out
}

const chunk = (chunks, name) => chunks.find((c) => c.name === name)
const chunkTable = (chunks, name) => (chunk(chunks, name) ? tables(chunk(chunks, name).raw)[0] || [] : [])
const chunkBullets = (chunks, name) => (chunk(chunks, name) ? bullets(chunk(chunks, name).raw) : [])

// ── 1. 成果卡（content/项目成果/） ───────────────────────────────

const LEVEL_SCORE = { 生疏: 1, 理解: 2, 熟练: 3, 能讲: 4 }

function parseEvidenceCard(file, dir) {
  const md = readFileSync(file, 'utf8')
  const { fm, h1, intro, chunks } = parseDoc(md)
  const base = basename(file, '.md')
  const idm = base.match(/^([A-Z]+-\d+)/)
  const impact = chunkTable(chunks, '影响')
  return {
    id: idm ? idm[1] : base,
    file: relative(ROOT, file).replaceAll('\\', '/'),
    name: base,
    title: h1 || base,
    oneLine: intro[0] || firstQuote(md),
    type: fm['类型'] || '',
    period: fm['时间'] || '',
    role: fm['角色'] || '',
    scale: fm['规模'] || '',
    reuse: splitList(fm['可复用']),
    updated: (fm['最后更新'] || '').slice(0, 10),
    // 「影响」段的表格：第一列是指标，其余列是变化
    impact,
    impactHead: impact.length ? Object.keys(impact[0]) : [],
    diagrams: extractDiagrams(md),
    chunks,
    hasStar: /STAR|行为面/.test(md),
    // 面试演示发布开关：`演示: 是` 才进演示包；`演示隐藏: 复盘, 时间线` 按 H2 段名删段
    show: fm['演示'] === '是',
    showHidden: splitList(fm['演示隐藏']),
    showLink: (fm['演示链接'] || '').trim(),
    dir,
    chars: md.length,
  }
}

/**
 * 演示投影：把一张成果卡削成「现场讲解」的形状。
 * 只留讲解需要的字段（file / chars / hasStar / raw 这类内部字段一概不出门）。
 * 章节 = 卡里剩下的 H2 段，按文档顺序；每章自带自己的 mermaid 图，
 * 按 showHidden 整段删除时，段里的图一起消失 —— 图是从留下的块里重抽的，
 * 不复用 extractDiagrams(md) 的全量结果。
 * 「影响」表供概览章用，「讲解提纲」供右侧提词面板用，两者都不成章。
 */
const OUTLINE = '讲解提纲'

function toShowCard(c) {
  const hidden = new Set(c.showHidden)
  const kept = c.chunks.filter((ch) => !hidden.has(ch.name))
  const hasImpact = kept.some((ch) => ch.name === '影响')

  const outline = []
  for (const ch of kept) {
    if (ch.name !== OUTLINE) continue
    for (const b of ch.blocks) if (b.type === 'list') outline.push(...b.items)
  }

  const chapters = kept
    .filter((ch) => ch.name !== '影响' && ch.name !== OUTLINE)
    .map((ch) => ({
      name: ch.name,
      blocks: ch.blocks.filter((b) => b.type !== 'mermaid'),
      diagrams: ch.blocks.filter((b) => b.type === 'mermaid').map((b) => b.text),
    }))

  return {
    id: c.id,
    title: c.title,
    oneLine: c.oneLine,
    type: c.type,
    period: c.period,
    role: c.role,
    scale: c.scale,
    showLink: c.showLink,
    impact: hasImpact ? c.impact : [],
    impactHead: hasImpact ? c.impactHead : [],
    outline,
    chapters,
  }
}

// ── 2. 知识卡（content/知识点/） ─────────────────────────────

function parseKnowledgeCard(file, dir) {
  const md = readFileSync(file, 'utf8')
  const { fm, h1, intro, chunks } = parseDoc(md)
  const base = basename(file, '.md')
  const idm = base.match(/^([A-Z]+-\d+)/)
  const level = fm['掌握度'] || ''
  const lastReview = (fm['上次复习'] || '').slice(0, 10)
  return {
    id: idm ? idm[1] : base,
    file: relative(ROOT, file).replaceAll('\\', '/'),
    name: base,
    title: h1 || base,
    oneLine: intro[0] || firstQuote(md),
    domain: fm['领域'] || '未分类',
    level,
    levelScore: LEVEL_SCORE[level] || 0,
    lastReview,
    reviewAge: daysAgo(lastReview),
    jobs: splitList(fm['关联岗位']),
    updated: (fm['最后更新'] || '').slice(0, 10),
    tradeoffs: chunkTable(chunks, '关键 trade-off'),
    numbers: chunkBullets(chunks, '必须记住的数字'),
    questions: chunkBullets(chunks, '面试追问链'),
    anchors: chunkBullets(chunks, '我的项目锚点'),
    diagrams: extractDiagrams(md),
    chunks,
    dir,
    chars: md.length,
  }
}

// ── 3. 通用板块（content/<目录>/） ───────────────────────────
//
// 「加一个 md 目录 = 加一个板块」的实现处。
// 已在 SECTION_DEFS 登记的目录按配置归组；未登记的自动兜底排到「系统」末尾。

// PARA 顶层目录 → 默认挂在哪张页面下。板块自己可以用 host 覆盖。
const PARA_HOST = {
  '00-Projects': 'prep-jobs',
  '10-Areas': 'library',
  '20-Resources': 'library',
  '30-Archive': 'library',
}

// 排序用：先一级导航，再两张页面里的资料，最后设置
const HOST_ORDER = ['nav', 'prep-jobs', 'prep-know', 'prep-war', 'library', 'settings']

// 板块展示配置（键 = content/<PARA>/<板块> 的二层目录名）。
// host = 它归在哪张页面里：prep-jobs 是面试场次，prep-know 是知识与问题，
// library 是知识库，settings 是设置。侧栏只放一级导航，板块在页面内出现。
const SECTION_DEFS = {
  公司准备: { id: 'companies', label: '公司资料', root: '00-Projects', host: 'prep-jobs', order: 10, icon: 'buildings', tone: 'b-amber' },
  面试记录: { id: 'interviews', label: '面试记录', root: '00-Projects', host: 'prep-jobs', order: 11, icon: 'notebook', tone: 'b-amber' },
  作战室: { id: 'warroom', label: '岗位作战室', root: '00-Projects', host: 'prep-war', order: 12, icon: 'target', tone: 'b-purple' },

  // 知识库里的技术方向：按自己的技术栈找材料，一个方向一个板块
  Java: { id: 'java', label: 'Java', root: '10-Areas', host: 'library', group: '技术', order: 10, icon: 'doc', tone: 'b-blue' },
  Go: { id: 'go', label: 'Go', root: '10-Areas', host: 'library', group: '技术', order: 11, icon: 'doc', tone: 'b-blue' },
  数据库: { id: 'db', label: '数据库与缓存', root: '10-Areas', host: 'library', group: '技术', order: 12, icon: 'files', tone: 'b-blue' },
  中间件: { id: 'middleware', label: '中间件', root: '10-Areas', host: 'library', group: '技术', order: 13, icon: 'graph', tone: 'b-blue' },
  架构: { id: 'architecture', label: '架构与稳定性', root: '10-Areas', host: 'library', group: '技术', order: 14, icon: 'target', tone: 'b-blue' },
  工程化: { id: 'devops', label: '工程化', root: '10-Areas', host: 'library', group: '技术', order: 15, icon: 'wrench', tone: 'b-blue' },
  AI应用: { id: 'ai', label: 'AI 应用', root: '10-Areas', host: 'library', group: '技术', order: 16, icon: 'books', tone: 'b-blue' },
  前端: { id: 'frontend', label: '前端', root: '10-Areas', host: 'library', group: '技术', order: 17, icon: 'doc', tone: 'b-blue' },

  项目案例: { id: 'cases', label: '项目案例', root: '10-Areas', host: 'library', group: '项目', order: 30, icon: 'trophy', tone: 'b-amber' },
  项目复盘: { id: 'retro', label: '项目复盘', root: '30-Archive', host: 'library', group: '项目', order: 31, icon: 'archive', tone: 'b-amber' },

  职业定位: { id: 'position', label: '职业定位', root: '10-Areas', host: 'library', group: '求职', order: 40, icon: 'compass', tone: 'b-gray' },
  目标岗位: { id: 'jobs', label: '目标岗位', root: '10-Areas', host: 'library', group: '求职', order: 41, icon: 'target', tone: 'b-gray' },
  简历: { id: 'resume', label: '简历', root: '10-Areas', host: 'library', group: '求职', order: 42, icon: 'pencil', tone: 'b-gray' },
  决策日志: { id: 'decisions', label: '决策日志', root: '20-Resources', host: 'library', group: '求职', order: 43, icon: 'notebook', tone: 'b-gray' },

  面试问答: { id: 'pitch', label: '面试问答', root: '20-Resources', host: 'prep-know', order: 31, icon: 'megaphone', tone: 'b-purple' },
  使用说明: { id: 'method', label: '使用说明', root: '20-Resources', host: 'settings', order: 50, icon: 'info', tone: 'b-purple' },
}

/** 一级导航：五张页面，侧栏只有它们，板块不再进侧栏 */
const BUILTIN_NAV = [
  { id: 'overview', label: '首页', host: 'nav', order: 1, icon: 'gauge', tone: 'b-green', builtin: true },
  { id: 'prep', label: '面试准备', host: 'nav', order: 2, icon: 'book', tone: 'b-amber', builtin: true },
  { id: 'evidence', label: '项目资产', host: 'nav', order: 3, icon: 'trophy', tone: 'b-blue', builtin: true },
  { id: 'library', label: '知识库', host: 'nav', order: 4, icon: 'books', tone: 'b-gray', builtin: true },
  { id: 'settings', label: '设置', host: 'nav', order: 5, icon: 'gear', tone: 'b-gray', builtin: true },
]

/** 卡片板块单独解析，不进通用 DocView；它们的 _说明.md 挂到对应页面 */
const CARD_DIR_TO_BUILTIN = { [KNOWLEDGE_DIR]: 'prep' }

/**
 * 某个板块目录下的 md 清单：并上 content/ 与 content.private/，同名只留私有那一份。
 * content.private/.hidden 里按 content 相对路径列出的公开文件会被剔除（示例卡不上线用这个）。
 * 返回 [文件名, 绝对路径]，按文件名排序，保证输出稳定。
 */
function mdFiles(dir) {
  const map = new Map()
  for (const base of [PRIVATE, CONTENT]) {
    const abs = join(base, dir)
    if (!existsSync(abs)) continue
    for (const f of readdirSync(abs).filter((x) => x.endsWith('.md')).sort()) {
      if (hidden.has(join(dir, f).replaceAll('\\', '/'))) continue
      if (!map.has(f)) map.set(f, join(abs, f))
    }
  }
  return [...map]
}

/** 两个根目录下的同级子目录名并集（用于发现只存在于私有副本里的板块） */
function subDirNames(rel) {
  const set = new Set()
  for (const base of [PRIVATE, CONTENT]) {
    const abs = join(base, rel)
    if (!existsSync(abs)) continue
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory() && !e.name.startsWith('.')) set.add(e.name)
    }
  }
  return [...set].sort()
}

/**
 * includeGuide = true 时只取 `_` 开头的文件（卡片目录的 _说明.md / _模板.md）。
 * 卡片本身不是文档，不能混进 docs —— 否则说明面板会取到某张卡的内容。
 */
function parseSectionDocs(dir, includeGuide = false) {
  return mdFiles(dir)
    .filter(([f]) => (includeGuide ? f.startsWith('_') : !f.startsWith('_')))
    .map(([f, abs]) => {
      const md = readFileSync(abs, 'utf8')
      const { fm, h1, intro, chunks, head } = parseDoc(md)
      // 语雀导出的文档常常整篇没有 `##` 分节，内容全落在 head —— 不兜底就会渲染成空白页
      const rest = head.filter((b) => b.type !== 'quote')
      const shown = chunks.length ? chunks : rest.length ? [{ name: '正文', blocks: rest }] : []
      // 列表里的一句话：有引用用引用，否则取正文第一段
      const firstPara = shown.flatMap((c) => c.blocks).find((b) => b.type === 'para' && b.text.length > 12)
      const summary = plainText(intro[0] || firstPara?.text || '').slice(0, 88)
      return {
        name: basename(f, '.md'),
        path: relative(ROOT, abs).replaceAll('\\', '/'),
        title: h1 || basename(f, '.md'),
        version: (fm['版本'] || '').replace(/[*\s]/g, ''),
        status: (fm['状态'] || '').replace(/[*\s]/g, ''),
        updated: (fm['最后更新'] || fm['updated_at'] || '').replace(/[*\s]/g, '').slice(0, 10),
        intro,
        summary,
        chunks: shown.map(({ name, blocks }) => ({ name, blocks })),
        flowCount: shown.reduce((s, c) => s + c.blocks.filter((b) => b.type === 'mermaid').length, 0),
        chars: md.length,
      }
    })
}

function parseSections() {
  const out = BUILTIN_NAV.map((s) => ({ ...s, desc: '', docs: [] }))

  // 卡片型板块不另立导航项：把目录名与 _说明.md 挂到对应的内置视图上
  const cardDirs = new Set(Object.keys(CARD_DIR_TO_BUILTIN))
  for (const [dir, id] of Object.entries(CARD_DIR_TO_BUILTIN)) {
    const target = out.find((s) => s.id === id)
    if (target) {
      target.dir = dir
      target.docs = parseSectionDocs(dir, true)
    }
  }

  // 扫描 PARA 顶层目录，二层目录即板块（公开骨架 + 私有副本两处都要看到）
  const paraRoots = subDirNames('').filter((name) => PARA_HOST[name])

  const seen = new Set()
  for (const root of paraRoots) {
    for (const sub of subDirNames(root)) {
      const dir = join(root, sub)
      if (seen.has(dir) || cardDirs.has(dir)) continue
      seen.add(dir)
      const def = SECTION_DEFS[sub] || {
        id: sub.replace(/[^\w\u4e00-\u9fa5]/g, '') || 'section',
        label: sub,
        root,
        host: PARA_HOST[root],
        order: 50,
        icon: 'doc',
        tone: 'b-gray',
      }
      out.push({
        ...def,
        builtin: false,
        dir,
        docs: parseSectionDocs(dir),
      })
    }
  }

  // 并上已登记但内容尚未写出的板块，让骨架先出现
  for (const sub of Object.keys(SECTION_DEFS)) {
    const def = SECTION_DEFS[sub]
    const dir = join(def.root, sub)
    if (seen.has(dir) || out.some((s) => s.dir === dir)) continue
    seen.add(dir)
    out.push({ ...def, builtin: false, dir, docs: parseSectionDocs(dir) })
  }

  const hi = (h) => {
    const i = HOST_ORDER.indexOf(h)
    return i < 0 ? 99 : i
  }
  return out.sort((a, b) => hi(a.host) - hi(b.host) || a.order - b.order)
}

// ── 4. 旧库盘点（../career-os，只读，不导入正文） ─────────────

function parseLegacy() {
  if (!existsSync(LEGACY)) return null
  const files = walk(LEGACY, (p) => p.toLowerCase().endsWith('.md'))
  const byDir = {}
  for (const p of files) {
    const rel = relative(LEGACY, p).replaceAll('\\', '/')
    const dir = rel.split('/')[0] || '(根目录)'
    byDir[dir] = (byDir[dir] || 0) + 1
  }
  const html = walk(LEGACY, (p) => p.toLowerCase().endsWith('.html')).length
  return {
    root: LEGACY,
    mdTotal: files.length,
    htmlTotal: html,
    byDir: Object.entries(byDir)
      .map(([dir, count]) => ({ dir, count }))
      .sort((a, b) => b.count - a.count),
  }
}

// ── 5. 岗位管道（content/00-Projects/岗位管道.md 的表格） ────────
//
// 一行一个「公司 × 岗位」，阶段决定它落在看板的哪一列。
// 表格放在这个 md 的第一个 `|` 块里，其余正文写约定和复盘。

const PIPELINE_FILE = [join(PRIVATE, '00-Projects', '岗位管道.md'), join(CONTENT, '00-Projects', '岗位管道.md')].find(
  (p) => existsSync(p),
)

const STAGES = ['待投', '已投', '笔试测评', '一面', '二面', '三面', 'HR面', 'Offer', '暂停', '已结束']
const READINESS_SCORE = { 高: 3, 中: 2, 低: 1 }

/**
 * 岗位简报：从「公司资料」里那一篇抽开场页要的东西 —— 基本信息、公司是做什么的、
 * 岗位职责、任职要求、岗位对照缺口、面试前要做完。管道页只认这一份，不另写一份 JD。
 * 对表先按文件名等于公司名，再退到文件名或标题前缀含公司名，避免挂错行。
 */
const GAP_COVER = new Set(['部分', '缺', '超配'])

function attachBriefs(rows, sections) {
  const companies = sections.find((s) => s.id === 'companies')
  if (!companies) return rows
  const pick = (doc, name) => doc.chunks.find((c) => c.name === name)
  const findDoc = (company) =>
    companies.docs.find((d) => d.name === company) ||
    companies.docs.find((d) => d.name.startsWith(company) || d.title.startsWith(company)) ||
    companies.docs.find((d) => d.title.includes(company) || d.name.includes(company))
  for (const row of rows) {
    if (!row.company) continue
    const doc = findDoc(row.company)
    if (!doc) continue
    row.companyDoc = doc.name
    const duties = pick(doc, '岗位职责')
    const requires = pick(doc, '任职要求') || pick(doc, '任职资格')
    const what = pick(doc, '公司是做什么的')
    if (!duties && !requires && !what) continue
    const match = pick(doc, '岗位对照')?.blocks.find((b) => b.type === 'table')
    const basic = pick(doc, '基本信息')?.blocks.find((b) => b.type === 'table')
    row.brief = {
      doc: doc.name,
      // 「基本信息」表里 项 / 内容 两列，直接摊开场页；JD 原文单独留作外链
      facts: (basic?.rows || [])
        .map((r) => ({ k: r['项'] || '', v: Object.entries(r).find(([k]) => k !== '项')?.[1] || '' }))
        .filter((x) => x.k && x.v && x.k !== 'JD 原文'),
      jdLink: (basic?.rows || []).find((r) => (r['项'] || '').includes('JD'))?.['内容'] || '',
      what: what ? what.blocks : [],
      duties: duties ? duties.blocks : [],
      requirements: requires ? requires.blocks : [],
      gaps: match
        ? match.rows
            .filter((r) => GAP_COVER.has(r['覆盖度']))
            .map((r) => ({ need: r['JD 要求'] || '', cover: r['覆盖度'], ask: r['会被怎么追问'] || '' }))
        : [],
      // 「面试前要做完」是带框的清单，逐项搬到开场页，省得再跳去完整资料
      todo: (pick(doc, '面试前要做完')?.blocks || [])
        .flatMap((b) => (b.type === 'list' ? b.items : []))
        .map((x) => x.replace(/^\[[ xX]\]\s*/, '').replace(/^\[\s\]\s*/, ''))
        .filter(Boolean),
    }
  }
  return rows
}

function parsePipeline() {
  if (!PIPELINE_FILE || !existsSync(PIPELINE_FILE)) return []
  const md = readFileSync(PIPELINE_FILE, 'utf8')
  const rows = tables(md)[0] || []
  return rows.map((r, i) => {
    const stage = cleanInline(r['阶段'] || '')
    const applied = parseDate(r['投递日期'])
    const nextAt = parseDate(r['下一轮时间'])
    const readiness = cleanInline(r['准备度'] || '')
    return {
      key: `${cleanInline(r['公司'] || '未知')}-${cleanInline(r['岗位'] || i)}`,
      company: cleanInline(r['公司'] || ''),
      role: cleanInline(r['岗位'] || ''),
      stage: STAGES.includes(stage) ? stage : '待投',
      stageKnown: STAGES.includes(stage),
      applied,
      appliedRaw: cleanInline(r['投递日期'] || ''),
      appliedAge: daysAgo(applied),
      nextAt,
      nextIn: daysUntil(nextAt),
      nextRound: cleanInline(r['下一轮时间'] || ''),
      action: cleanInline(r['下一步'] || ''),
      readiness,
      readinessScore: READINESS_SCORE[readiness] || 0,
      evidenceIds: (r['关联成果'] || '').match(/EX-\d+/g) || [],
      knowledgeIds: (r['关联知识'] || '').match(/K-\d+/g) || [],
      row: i + 1,
    }
  })
}

// ── 岗位作战室 ────────────────────────────────────────────────
// 一篇文档 = 一个岗位。`## A 开场与动机` 是分组，`### [进阶] 题目` 是题，
// 下面四个子标题固定为：面试官会这么问 / 参考答法 / 可能追问。
function parseWarRoomDoc(doc) {
  const [company, ...rest] = doc.name.split('-')
  const groups = []
  for (const c of doc.chunks) {
    const m = c.name.match(/^([A-I]\d?)[.\s、]+(.+)$/)
    const code = m ? m[1] : ''
    const title = (m ? m[2] : c.name).trim()
    const questions = []
    let cur = null
    let field = ''
    for (const b of c.blocks) {
      if (b.type === 'h' && b.level <= 3) {
        const t = b.text.match(/^\[(基础|进阶|压力)\]\s*(.+)$/)
        cur = {
          id: `${code || 'X'}-${questions.length + 1}`,
          level: t ? t[1] : '',
          q: (t ? t[2] : b.text).trim(),
          asked: [],
          answer: [],
          diagram: [],
          followups: [],
        }
        questions.push(cur)
        field = ''
        continue
      }
      if (!cur) continue
      if (b.type === 'h') {
        field = b.text
        continue
      }
      if (field === '面试官会这么问') {
        if (b.type === 'para') cur.asked.push(b.text)
        else if (b.type === 'list') cur.asked.push(...b.items)
      } else if (field === '参考答法') {
        cur.answer.push(b)
      } else if (field === '架构图') {
        cur.diagram.push(b)
      } else if (field === '可能追问' && b.type === 'list') {
        cur.followups.push(...b.items)
      }
    }
    if (questions.length) groups.push({ code, title, questions })
  }
  return {
    company: company.trim(),
    role: rest.join('-').trim(),
    doc: doc.name,
    groups,
    total: groups.reduce((n, g) => n + g.questions.length, 0),
  }
}

function parseWarRooms(sections) {
  const sec = sections.find((s) => s.id === 'warroom')
  if (!sec) return []
  return sec.docs.filter((d) => !d.name.startsWith('_')).map(parseWarRoomDoc)
}

// ── 汇总输出 ─────────────────────────────────────────────────

const sections = parseSections()

const evidence = mdFiles(EVIDENCE_DIR)
  .filter(([f]) => !f.startsWith('_'))
  .map(([f, abs]) => parseEvidenceCard(abs, EVIDENCE_DIR))

const knowledge = mdFiles(KNOWLEDGE_DIR)
  .filter(([f]) => !f.startsWith('_'))
  .map(([f, abs]) => parseKnowledgeCard(abs, KNOWLEDGE_DIR))

const pipeline = attachBriefs(parsePipeline(), sections)

const data = {
  generatedAt: new Date().toISOString(),
  sections,
  evidence,
  knowledge,
  pipeline,
  warroom: parseWarRooms(sections),
  legacy: parseLegacy(),
}

mkdirSync(join(ROOT, 'src/data'), { recursive: true })
writeFileSync(OUT, JSON.stringify(data, null, 1))

// 演示投影：只含显式标记「演示: 是」的卡。演示产物读这份，不读 generated.json。
const showCards = evidence.filter((c) => c.show).map(toShowCard)
writeFileSync(OUT_SHOW, JSON.stringify({ generatedAt: data.generatedAt, cards: showCards }, null, 1))

const secs = sections.filter((s) => !s.builtin)
console.log(
  `[gen:data] 板块 ${sections.length}（内置 ${sections.length - secs.length} · 内容板块 ${secs.length}）` +
    ` · 成果卡 ${evidence.length}（演示 ${showCards.length} 张 · ${evidence.reduce((s, c) => s + c.diagrams.length, 0)} 张图）` +
    ` · 知识卡 ${knowledge.length}（${knowledge.reduce((s, c) => s + c.diagrams.length, 0)} 张图）` +
    ` · 管道 ${data.pipeline.length} 条` +
    ` · 旧库 ${data.legacy ? data.legacy.mdTotal + ' 篇 md / ' + data.legacy.htmlTotal + ' 个 html' : '未找到'}` +
    ` → src/data/generated.json + generated.show.json`,
)
