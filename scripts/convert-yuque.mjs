/**
 * 语雀采集 · 第 2 段 v2：lake HTML → Markdown，按目录树分组落盘
 * 运行（在 career-hub/ 下）：  node scripts/convert-yuque.mjs
 * 输入：/tmp/yuque-raw/<ns>/<slug>.json（含 tree 分组路径）+ /tmp/yuque-toc-<ns>.json（排序）
 * 输出：import-yuque/<库名>/<分组>/<标题>.md  +  import-yuque/_index.json
 *
 * v2 变化：全量采集后 130+ 篇，拍平 NN-标题 命名不可维护；
 *   改为镜像语雀目录树（level 栈还原的 tree 路径），组内按 toc 顺序，文件名=标题。
 * lake 变体处理同 v1：codeblock/checkbox/hr 卡片 + gfm 表格。
 */
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const RAW_ROOT = '/tmp/yuque-raw'
const OUT_ROOT = new URL('../import-yuque/', import.meta.url).pathname
// 语雀知识库 → 导出目录映射。把下面的命名空间换成你自己的语雀空间即可。
// 公开仓库默认只带「架构师储备」（求职相关）；「伟大的作品」等为私有库，不进本仓库。
const REPO_DIRS = { '<YOUR_NAMESPACE>_yez2nd': '架构师储备' }

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})
turndown.use(gfm)

/** lake 预处理：卡片 → 可转换的 HTML */
function preprocessLake(html) {
  return (
    html
      .replace(/^<!doctype lake>[\s\S]*?(?=<)/i, '')
      .replace(/<meta[^>]*>/g, '')
      .replace(
        /<card[^>]*?name="codeblock"[^>]*?value="([^"]*)"[^>]*>[\s\S]*?<\/card>/g,
        (_, enc) => {
          try {
            const v = JSON.parse(decodeURIComponent(enc).replace(/^data:/, ''))
            const lang = v.language || ''
            const code = String(v.code || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            return `<pre><code class="language-${lang}">${code}</code></pre>`
          } catch {
            return '<pre><code>[代码块解析失败]</code></pre>'
          }
        },
      )
      .replace(
        /<card[^>]*?name="checkbox"[^>]*?value="data:(true|false)"[^>]*>[\s\S]*?<\/card>/g,
        (_, checked) => `<p>${checked === 'true' ? '- [x] ' : '- [ ] '}</p>`,
      )
      .replace(/<card[^>]*?name="hr"[^>]*>[\s\S]*?<\/card>/g, '<hr>')
      .replace(/<card[^>]*>/g, '<p>[未知卡片]</p>')
  )
}

function safeName(s) {
  return (
    s
      .replace(/\s+\d{2}-\d{2}\s+\d{2}:\d{2}\s*$/, '')
      .replace(/[/\\:*?"<>|#\s]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'untitled'
  )
}

const index = { generatedAt: new Date().toISOString(), repos: {} }
let warn = 0
const usedPaths = new Set() // 同名文档去重，避免 writeFile 互相覆盖

for (const [rawDir, cnName] of Object.entries(REPO_DIRS)) {
  const nsShort = rawDir.split('_')[1]
  const tocOrder = JSON.parse(await readFile(`/tmp/yuque-toc-${nsShort}.json`, 'utf8'))
    .map((x, i) => [x.url, i])
    .filter(([u]) => u)
  const order = Object.fromEntries(tocOrder)

  const files = (await readdir(`${RAW_ROOT}/${rawDir}`)).filter((f) => f.endsWith('.json'))
  const sorted = files.sort((a, b) => (order[a.replace('.json', '')] ?? 9999) - (order[b.replace('.json', '')] ?? 9999))

  const entries = []
  for (const f of sorted) {
    const j = JSON.parse(await readFile(`${RAW_ROOT}/${rawDir}/${f}`, 'utf8'))
    const title = (j.tocTitle || j.title || j.slug).trim()
    if (!j.content) {
      entries.push({ slug: j.slug, title, ok: false, reason: j.error || 'content 为空（可能是小记/空文档）' })
      warn++
      continue
    }
    const md = turndown
      .turndown(preprocessLake(j.content))
      .replace(/\\\*\\\*/g, '**')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    const tree = Array.isArray(j.tree) ? j.tree : []
    const dir = `${OUT_ROOT}/${cnName}${tree.length ? '/' + tree.map(safeName).join('/') : ''}`
    await mkdir(dir, { recursive: true })
    const fm = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `source: https://www.yuque.com/${rawDir.replace('_', '/')}/${j.slug}`,
      `group: "${tree.join(' / ')}"`,
      `word_count: ${j.wordCount ?? ''}`,
      `updated_at: ${j.updatedAt || ''}`,
      `fetched_at: ${index.generatedAt}`,
      '---',
    ].join('\n')
    let rel = `${tree.map(safeName).join('/')}${tree.length ? '/' : ''}${safeName(title)}.md`
    if (usedPaths.has(`${cnName}/${rel}`)) {
      // 同名：加 slug 尾缀保住每一篇
      rel = `${tree.map(safeName).join('/')}${tree.length ? '/' : ''}${safeName(title)}-${j.slug.slice(0, 6)}.md`
    }
    usedPaths.add(`${cnName}/${rel}`)
    await writeFile(`${OUT_ROOT}/${cnName}/${rel}`, `${fm}\n\n# ${title}\n\n${md}\n`)
    entries.push({ slug: j.slug, title, group: tree.join(' / '), file: rel, ok: true, mdChars: md.length })
  }
  index.repos[cnName] = entries
  console.log(`[${cnName}] ${entries.length} 篇处理完，成功 ${entries.filter((e) => e.ok).length}`)
}

await writeFile(`${OUT_ROOT}/_index.json`, JSON.stringify(index, null, 1))
console.log('DONE →', OUT_ROOT, warn ? `⚠️ ${warn} 篇空内容` : '')
