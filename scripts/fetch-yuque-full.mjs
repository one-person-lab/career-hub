/**
 * 语雀采集 · 全量版：以 appData.book.toc（含 level 层级）为准拉全部文档
 * 运行：~/.local/bin/ego-browser nodejs < scripts/fetch-yuque-full.mjs
 * 输入：/tmp/yuque-toc-<ns>.json（type/title/url/level，由浏览器端导出）
 * 输出：/tmp/yuque-raw/<ns>/<slug>.json（含 tree 路径）+ /tmp/yuque-raw/_summary_full.json
 *
 * 增量：已存在且 contentLength>0 的 slug 直接跳过，可反复跑。
 * 背景：首版清单从目录页可见 <a> 抓取，折叠分组全部漏掉（130 节点只抓了 15 篇）。
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const OUT_ROOT = '/tmp/yuque-raw'
// 把下面的命名空间换成你自己的语雀空间即可（公开仓库默认只采集「架构师储备」）。
const BOOK_IDS = { '<your-namespace>/yez2nd': 59487756 }
const REPOS = [
  { name: '架构师储备', ns: '<your-namespace>/yez2nd' },
]

const task = await taskSpace('yuque-career 采集')
const page = task.page('p1')
const summary = { fetchedAt: new Date().toISOString(), repos: {} }

for (const repo of REPOS) {
  const nsShort = repo.ns.split('/')[1]
  const toc = JSON.parse(await readFile(`/tmp/yuque-toc-${nsShort}.json`, 'utf8'))

  // level 栈还原分组路径
  const docs = []
  const stack = [] // [{level, title}]
  for (const item of toc) {
    if (item.type === 'TITLE') {
      while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop()
      stack.push({ level: item.level, title: item.title })
    } else if (item.type === 'DOC' && item.url) {
      docs.push({ slug: item.url, title: item.title, tree: stack.map((s) => s.title) })
    }
  }

  const outDir = `${OUT_ROOT}/${repo.ns.replace('/', '_')}`
  await mkdir(outDir, { recursive: true })
  const pending = docs.filter((d) => {
    const f = `${outDir}/${d.slug}.json`
    if (!existsSync(f)) return true
    try {
      const j = JSON.parse(readFileSync(f))
      return !(j.contentLength > 0)
    } catch {
      return true
    }
  })
  console.log(`[${repo.name}] 目录 ${docs.length} 篇，待拉 ${pending.length} 篇`)
  summary.repos[repo.name] = { ns: repo.ns, total: docs.length, pending: pending.length, ok: 0, failed: [] }

  if (!pending.length) continue
  await page.goto(`https://www.yuque.com/${repo.ns}`, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(2000)
  const bookId = BOOK_IDS[repo.ns]

  // ego evaluate ~15s 上限，小批量分片
  const BATCH = 4
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH)
    const batch = await page.evaluate(
      async ({ slugs, bookId: bid }) => {
        const out = []
        for (const s of slugs) {
          try {
            const resp = await fetch(
              `/api/docs/${s}?include_contributors=true&include_like=true&include_hits=true&merge_dynamic_data=true&book_id=${bid}`,
              { credentials: 'include' },
            )
            const j = await resp.json().catch(() => null)
            const d = j && j.data ? j.data : null
            out.push({
              slug: s,
              status: resp.status,
              title: d ? d.title : null,
              type: d ? d.type : null,
              wordCount: d ? d.word_count : null,
              contentLength: d ? (d.content || '').length : 0,
              content: d ? d.content || '' : '',
              updatedAt: d ? d.updated_at : null,
            })
          } catch (e) {
            out.push({ slug: s, status: -1, error: String(e).slice(0, 120) })
          }
          await new Promise((r) => setTimeout(r, 600))
        }
        return out
      },
      { slugs: slice.map((d) => d.slug), bookId },
    )
    for (const r of batch) {
      const meta = slice.find((d) => d.slug === r.slug)
      r.tree = meta ? meta.tree : []
      r.tocTitle = meta ? meta.title : null
      await writeFile(`${outDir}/${r.slug}.json`, JSON.stringify(r, null, 1))
      if (r.status === 200 && r.contentLength > 0) summary.repos[repo.name].ok++
      else summary.repos[repo.name].failed.push({ slug: r.slug, title: r.title, status: r.status })
    }
    console.log(`  ${repo.name} 批次 ${Math.floor(i / BATCH) + 1}/${Math.ceil(pending.length / BATCH)}：累计 ${summary.repos[repo.name].ok} 成功`)
  }
}

await writeFile(`${OUT_ROOT}/_summary_full.json`, JSON.stringify(summary, null, 1))
console.log('DONE →', OUT_ROOT)
console.log(JSON.stringify(summary.repos, null, 1))
