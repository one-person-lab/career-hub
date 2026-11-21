#!/usr/bin/env node
/**
 * 面试演示产物自检：证明「私有内容不在里面」，而不是相信我前端的隐藏逻辑。
 *
 *   node scripts/check-show.mjs          # 数据层：generated.show.json 的投影是否正确
 *   node scripts/check-show.mjs --dist   # 产物层：dist-show 的 JS 里不得出现私有指纹
 *
 * 退出码非 0 = 不通过。上线脚本在推产物之前会先跑它。
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PRIV = join(ROOT, 'src/data/generated.json')
const SHOW = join(ROOT, 'src/data/generated.show.json')

/** 演示卡里一律不得出现的内部字段：file 暴露本地路径，raw 是未裁剪正文，reuse 是给自己看的用途标记 */
const PRIVATE_FIELDS = ['file', 'name', 'dir', 'chars', 'hasStar', 'updated', 'raw', 'reuse', 'show', 'showHidden']

const fails = []
const check = (ok, msg) => {
  if (!ok) fails.push(msg)
}

if (!existsSync(SHOW)) {
  console.error('[check-show] 缺 src/data/generated.show.json —— 先跑 npm run gen:data')
  process.exit(1)
}
if (!existsSync(PRIV)) {
  console.error('[check-show] 缺 src/data/generated.json —— 先跑 npm run gen:data')
  process.exit(1)
}

const priv = JSON.parse(readFileSync(PRIV, 'utf8'))
const show = JSON.parse(readFileSync(SHOW, 'utf8'))
const showText = readFileSync(SHOW, 'utf8')
const srcById = Object.fromEntries(priv.evidence.map((c) => [c.id, c]))
const pinned = new Set(priv.evidence.filter((c) => c.show).map((c) => c.id))

check(Array.isArray(show.cards), '[cards] 不是数组')

// 1. 演示包里的卡必须都被标了「演示: 是」，一张不多
const leakedIds = show.cards.map((c) => c.id).filter((id) => !pinned.has(id))
check(leakedIds.length === 0, `[越权发布] 未标记的卡出现在演示包：${leakedIds.join(', ')}`)

// 2. 标记了的卡一张不少
const missingIds = [...pinned].filter((id) => !show.cards.some((c) => c.id === id))
check(missingIds.length === 0, `[漏发布] 标了「演示: 是」却没有进包：${missingIds.join(', ')}`)

// 3. 内部字段一概不带
for (const c of show.cards) {
  const dirty = PRIVATE_FIELDS.filter((f) => f in c)
  check(dirty.length === 0, `[字段泄漏] ${c.id} 带了内部字段：${dirty.join(', ')}`)
}

// 4~6. 隐藏段连同段里的图一起删干净；「影响」「架构图」不重复出现
for (const c of show.cards) {
  const src = srcById[c.id]
  if (!src) continue
  const hidden = new Set(src.showHidden || [])

  const stillThere = c.chapters.map((x) => x.name).filter((n) => hidden.has(n))
  check(stillThere.length === 0, `[段未删] ${c.id} 仍含隐藏段：${stillThere.join(', ')}`)

  // 参照集 = 源卡里没被隐藏的段（「影响」「讲解提纲」另有用途，不成章、不带图）
  const SPECIAL = new Set(['影响', '讲解提纲'])
  const srcKeptCodes = new Set(
    src.chunks
      .filter((ch) => !hidden.has(ch.name) && !SPECIAL.has(ch.name))
      .flatMap((ch) => ch.blocks.filter((b) => b.type === 'mermaid').map((b) => b.text)),
  )
  const showCodes = new Set(c.chapters.flatMap((ch) => ch.diagrams))

  const orphan = [...showCodes].filter((code) => !srcKeptCodes.has(code))
  check(orphan.length === 0, `[图残留] ${c.id} 有图来自已隐藏的段：${orphan.length} 张`)

  const dropped = [...srcKeptCodes].filter((code) => !showCodes.has(code))
  check(dropped.length === 0, `[图丢失] ${c.id} 保留了段落却没带上它的图：${dropped.length} 张`)

  const names = c.chapters.map((ch) => ch.name)
  check(new Set(names).size === names.length, `[章节重名] ${c.id}：${names.join(', ')}`)

  check(
    !c.chapters.some((ch) => SPECIAL.has(ch.name)),
    `[段重复] ${c.id} 的章节里还留着「影响」或「讲解提纲」`,
  )

  // 提纲必须来自「讲解提纲」段，不能凭空长出来
  const srcItems = ((src.chunks.find((ch) => ch.name === '讲解提纲') || {}).blocks || [])
    .filter((b) => b.type === 'list')
    .flatMap((b) => b.items)
  check(
    JSON.stringify(c.outline) === JSON.stringify(srcItems),
    `[提纲错位] ${c.id} 的 outline 与「讲解提纲」段不一致`,
  )
}

// 7. 未发布的卡标题不得出现在演示 JSON 文本里
const unpublished = priv.evidence.filter((c) => !c.show).map((c) => c.title)
const hitTitles = unpublished.filter((t) => t && t.length >= 2 && showText.includes(t))
check(hitTitles.length === 0, `[标题泄漏] 演示包出现未发布项目：${hitTitles.join(' / ')}`)

// 8. 知识卡与管道完全不进演示包
check(!showText.includes('面试追问链') && !showText.includes('掌握度'), '[串包] 演示包含知识卡字段')
check(!('pipeline' in show) && !('knowledge' in show) && !('sections' in show) && !('warroom' in show), '[串包] 演示包含私有分区')

// ── 产物层 ────────────────────────────────────────────────
// 指纹不是手写的黑名单，而是从全量 generated.json 现算的「私有内容独有的字符串」，
// 再到 dist-show 的产物文本里逐个搜。任何一条命中就说明包串了。
if (process.argv.includes('--dist')) {
  const DIST = join(ROOT, 'dist-show')
  if (!existsSync(DIST)) {
    console.error('[check-show] 缺 dist-show/ —— 先跑 npm run build:show')
    process.exit(1)
  }
  const files = []
  const collect = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) collect(p)
      else if (/\.(js|css|html|json)$/.test(e.name)) files.push(p)
    }
  }
  collect(DIST)
  const bundle = files.map((p) => readFileSync(p, 'utf8')).join('\n')
  const squeezed = bundle.replace(/\s+/g, '')

  const showIds = new Set(show.cards.map((c) => c.id))
  const candidates = [
    ...priv.evidence.filter((c) => !showIds.has(c.id)).map((c) => c.title),
    ...priv.knowledge.map((k) => k.title),
    ...priv.knowledge.flatMap((k) => k.numbers || []),
    ...priv.pipeline.map((p) => p.company),
    ...priv.pipeline.map((p) => p.action),
    ...priv.sections.map((s) => s.label),
    ...priv.sections.flatMap((s) => s.docs.map((d) => d.title)),
  ]
    .filter(Boolean)
    .filter((t) => String(t).length >= 3)

  // 只留「私有内容独有」的串：演示包本来就写的词（如项目名里的「无人机」）不算泄漏证据，
  // 留着会天天误报，反而让人无视这条闸门。
  const fingerprints = candidates.filter((t) => !showText.includes(t))
  const shared = candidates.length - fingerprints.length

  // 纯英文指纹按整词匹配：短词（RAG）会误中打包文件名里的哈希（info-A6RAGUB7.js）
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hasWord = (t) =>
    /^[\x00-\x7F]+$/.test(t)
      ? new RegExp(`(?<![A-Za-z0-9_])${esc(t)}(?![A-Za-z0-9_])`).test(bundle)
      : bundle.includes(t)

  const hits = fingerprints.filter(hasWord)
  check(hits.length === 0, `[指纹命中] dist-show 里出现私有内容：${hits.slice(0, 8).join(' / ')}`)

  // 隐藏段即使在已发布的卡里也不能留正文
  for (const c of show.cards) {
    const src = srcById[c.id]
    for (const h of src?.showHidden || []) {
      const body = (src.chunks.find((x) => x.name === h) || {}).raw || ''
      const probe = body.replace(/\s+/g, '').slice(0, 24)
      if (probe.length >= 12) {
        check(!squeezed.includes(probe), `[隐藏段正文残留] ${c.id} 的「${h}」仍在产物里`)
      }
    }
  }

  check(!bundle.includes('content.private'), '[路径泄漏] dist-show 里出现 content.private')
  check(!bundle.includes('/api/coach'), '[接口泄漏] dist-show 里挂了面试教练代理调用')

  console.log(
    `[check-show] 产物层扫描 ${files.length} 个文件、${fingerprints.length} 条私有独有指纹（跳过 ${shared} 条演示包本就包含的词）`,
  )
}

if (fails.length) {
  for (const f of fails) console.error(f)
  console.error(`[check-show] ${fails.length} 项不通过`)
  process.exit(1)
}
console.log(`[check-show] 数据层通过：演示卡 ${show.cards.length}/${priv.evidence.length}`)
