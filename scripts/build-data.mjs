#!/usr/bin/env node
/**
 * 职业工作台数据管道：扫描 content/，生成 src/data/generated.json
 *
 * 来源：
 *  1. content/<PARA>/<板块>/*.md  —— 本仓库内的干净骨架（按 PARA 分组：00-Projects / 10-Areas / 20-Resources / 30-Archive）
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
const LEGACY = join(ROOT, '..', 'career-os')
const OUT = join(ROOT, 'src/data/generated.json')

const EXCLUDE_DIRS = new Set(['.git', 'node_modules', '.obsidian', '.trash', '.kiro', 'dist', '.vite'])
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
    const head = cells(rows[0])
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

/** "- item" / "* item" 列表 */
function bullets(body) {
  return (body || '')
    .split('\n')
    .map((l) => l.match(/^\s*[-*]\s+(.+)$/))
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

    const h = line.match(/^(#{3,4})\s+(.+)$/)
    if (h) {
      blocks.push({ type: 'h', level: h[1].length, text: cleanInline(h[2]) })
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
      !/^(#{3,4}\s|```|\s*\||>|\s*(?:[-*]|\d+\.)\s)/.test(lines[i])
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

/** 把 md 拆成 { frontmatter, h1, intro, chunks } 通用结构 */
function parseDoc(md) {
  const fm = frontmatter(md)
  const h1 = (md.match(/^#\s+(.+)$/m) || [])[1] || ''
  const body = md.replace(/^---\n[\s\S]*?\n---\n?/, '').replace(/^#\s+.*$/m, '')
  const parts = body.split(/^##\s+(.+)$/m)
  const chunks = []
  for (let i = 1; i < parts.length; i += 2) {
    chunks.push({
      name: parts[i].replace(/[（(].*$/, '').trim(),
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
    dir,
    chars: md.length,
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

// PARA 分组：顶层目录前缀 → 分组显示名。顺序即导航顺序。
const PARA_GROUPS = {
  '00-Projects': 'Projects · 进行中',
  '10-Areas': 'Areas · 长期资产',
  '20-Resources': 'Resources · 参考',
  '30-Archive': 'Archive · 归档',
}
const GROUP_TO_ROOT = Object.fromEntries(Object.entries(PARA_GROUPS).map(([k, v]) => [v, k]))
const GROUP_ORDER = ['Projects · 进行中', 'Areas · 长期资产', 'Resources · 参考', 'Archive · 归档']

// 板块展示配置（键 = content/<PARA>/<板块> 的二层目录名）。
// group 字段为兜底值，实际分组由文件所在 PARA 顶层目录推导覆盖。
const SECTION_DEFS = {
  职业定位: { id: 'position', label: '职业定位', group: 'Areas · 长期资产', order: 2, icon: 'compass', tone: 'bg-neo-blue' },
  目标岗位: { id: 'jobs', label: '目标岗位', group: 'Areas · 长期资产', order: 3, icon: 'target', tone: 'bg-neo-blue' },
  公司准备: { id: 'companies', label: '公司准备', group: 'Projects · 进行中', order: 7, icon: 'buildings', tone: 'bg-neo-yellow' },
  技术笔记: { id: 'tech-notes', label: '技术笔记', group: 'Resources · 参考', order: 5, icon: 'wrench', tone: 'bg-neo-pink' },
  面试问答: { id: 'pitch', label: '面试问答', group: 'Resources · 参考', order: 6, icon: 'megaphone', tone: 'bg-neo-pink' },
  使用说明: { id: 'method', label: '使用说明', group: 'Resources · 参考', order: 9, icon: 'info', tone: 'bg-neo-pink' },
  决策日志: { id: 'decisions', label: '决策日志', group: 'Resources · 参考', order: 10, icon: 'notebook', tone: 'bg-neo-purple' },
}

/** 内置视图：不走 content，由 Vue 组件直接实现（卡片墙 / 图谱这类需要专用布局） */
const BUILTIN_NAV = [
  { id: 'overview', label: '总览', group: 'Areas · 长期资产', order: 1, icon: 'gauge', tone: 'bg-neo-blue', builtin: true },
  { id: 'evidence', label: '成果库', group: 'Areas · 长期资产', order: 3, icon: 'trophy', tone: 'bg-neo-blue', builtin: true },
  { id: 'knowledge', label: '能力图谱', group: 'Areas · 长期资产', order: 4, icon: 'graph', tone: 'bg-neo-blue', builtin: true },
]

/** 卡片板块单独解析，不进通用 DocView；它们的 _说明.md 挂到对应的内置视图上 */
const CARD_DIR_TO_BUILTIN = { [KNOWLEDGE_DIR]: 'knowledge' }

/**
 * includeGuide = true 时只取 `_` 开头的文件（卡片目录的 _说明.md / _模板.md）。
 * 卡片本身不是文档，不能混进 docs —— 否则说明面板会取到某张卡的内容。
 */
function parseSectionDocs(dir, includeGuide = false) {
  const abs = join(CONTENT, dir)
  if (!existsSync(abs)) return []
  const files = readdirSync(abs)
    .filter((f) => f.endsWith('.md') && (includeGuide ? f.startsWith('_') : !f.startsWith('_')))
    .sort()
  return files.map((f) => {
    const md = readFileSync(join(abs, f), 'utf8')
    const { fm, h1, intro, chunks } = parseDoc(md)
    return {
      name: basename(f, '.md'),
      path: relative(ROOT, join(abs, f)).replaceAll('\\', '/'),
      title: h1 || basename(f, '.md'),
      version: (fm['版本'] || '').replace(/[*\s]/g, ''),
      status: (fm['状态'] || '').replace(/[*\s]/g, ''),
      updated: (fm['最后更新'] || '').replace(/[*\s]/g, '').slice(0, 10),
      intro,
      chunks: chunks.map(({ name, blocks }) => ({ name, blocks })),
      flowCount: chunks.reduce((s, c) => s + c.blocks.filter((b) => b.type === 'mermaid').length, 0),
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

  // 扫描 PARA 顶层目录，二层目录即板块
  const paraRoots = existsSync(CONTENT)
    ? readdirSync(CONTENT, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('.') && PARA_GROUPS[e.name])
        .map((e) => e.name)
    : []

  const seen = new Set()
  for (const root of paraRoots) {
    const group = PARA_GROUPS[root]
    const subdirs = readdirSync(join(CONTENT, root), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
    for (const sub of subdirs) {
      const dir = join(root, sub)
      if (seen.has(dir) || cardDirs.has(dir)) continue
      seen.add(dir)
      const def = SECTION_DEFS[sub] || {
        id: sub.replace(/[^\w\u4e00-\u9fa5]/g, '') || 'section',
        label: sub,
        group,
        order: 50,
        icon: 'doc',
        tone: 'bg-neo-pink',
      }
      out.push({
        ...def,
        group, // 用实际 PARA 层覆盖兜底 group
        builtin: false,
        dir,
        docs: parseSectionDocs(dir),
      })
    }
  }

  // 并上已登记但内容尚未写出的板块，让骨架先出现在导航里
  for (const sub of Object.keys(SECTION_DEFS)) {
    const def = SECTION_DEFS[sub]
    const dir = join(GROUP_TO_ROOT[def.group] || '20-Resources', sub)
    if (seen.has(dir) || out.some((s) => s.dir === dir)) continue
    seen.add(dir)
    out.push({ ...def, builtin: false, dir, docs: parseSectionDocs(dir) })
  }

  const gi = (g) => {
    const i = GROUP_ORDER.indexOf(g)
    return i < 0 ? 99 : i
  }
  return out.sort((a, b) => gi(a.group) - gi(b.group) || a.order - b.order)
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

// ── 汇总输出 ─────────────────────────────────────────────────

const sections = parseSections()

const evidence = existsSync(join(CONTENT, EVIDENCE_DIR))
  ? readdirSync(join(CONTENT, EVIDENCE_DIR))
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .sort()
      .map((f) => parseEvidenceCard(join(CONTENT, EVIDENCE_DIR, f), EVIDENCE_DIR))
  : []

const knowledge = existsSync(join(CONTENT, KNOWLEDGE_DIR))
  ? readdirSync(join(CONTENT, KNOWLEDGE_DIR))
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .sort()
      .map((f) => parseKnowledgeCard(join(CONTENT, KNOWLEDGE_DIR, f), KNOWLEDGE_DIR))
  : []

const data = {
  generatedAt: new Date().toISOString(),
  sections,
  evidence,
  knowledge,
  legacy: parseLegacy(),
}

mkdirSync(join(ROOT, 'src/data'), { recursive: true })
writeFileSync(OUT, JSON.stringify(data, null, 1))

const secs = sections.filter((s) => !s.builtin)
console.log(
  `[gen:data] 板块 ${sections.length}（内置 ${sections.length - secs.length} · 内容板块 ${secs.length}）` +
    ` · 成果卡 ${evidence.length}（${evidence.reduce((s, c) => s + c.diagrams.length, 0)} 张图）` +
    ` · 知识卡 ${knowledge.length}（${knowledge.reduce((s, c) => s + c.diagrams.length, 0)} 张图）` +
    ` · 旧库 ${data.legacy ? data.legacy.mdTotal + ' 篇 md / ' + data.legacy.htmlTotal + ' 个 html' : '未找到'}` +
    ` → src/data/generated.json`,
)
