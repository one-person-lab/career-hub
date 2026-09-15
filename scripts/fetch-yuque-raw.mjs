/**
 * 语雀采集 · 第 1 段：浏览器内拉 API，落原始 JSON
 * 依赖 ego-browser 登录态运行：  ~/.local/bin/ego-browser nodejs < scripts/fetch-yuque-raw.mjs
 * 输入：/tmp/yuque-inventory.json（由目录页 DOM 采集生成，slug + 标题）
 * 输出：/tmp/yuque-raw/<ns>/<slug>.json  +  /tmp/yuque-raw/_summary.json
 *
 * 语雀无个人可用官方 API（需会员），此处走页面内 fetch（登录态自带）：
 *   GET /api/docs/<slug>?include_contributors=true&include_like=true&include_hits=true
 *       &merge_dynamic_data=true&book_id=<book_id>
 * 返回 data.content = lake 格式 HTML 变体，由第 2 段脚本转 markdown。
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'

const INVENTORY = '/tmp/yuque-inventory.json'
const OUT_ROOT = '/tmp/yuque-raw'
// 已成功的库从数组里移除即可跳过。把下面的命名空间换成你自己的语雀空间。
const REPOS = [
  { name: '架构师储备', ns: '<your-namespace>/yez2nd' },
]

const inv = JSON.parse(await readFile(INVENTORY, 'utf8'))
const task = await taskSpace('yuque-career 采集')
const page = task.page('p1')

/** 进库后从真实请求记录里抠 book_id */
async function resolveBookId(ns) {
  const firstSlug = inv[Object.keys(inv).find((k) => inv[k].ns === ns)]?.docs?.[0]?.[0]
  if (!firstSlug) throw new Error(`${ns} 清单为空`)
  await page.goto(`https://www.yuque.com/${ns}/${firstSlug}`, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(2500)
  return page.evaluate(() => {
    const hit = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .find((u) => /\/api\/docs\/.*[?&]book_id=(\d+)/.test(u))
    return hit ? hit.match(/[?&]book_id=(\d+)/)[1] : null
  })
}

const summary = { fetchedAt: new Date().toISOString(), repos: {} }

for (const repo of REPOS) {
  const key = Object.keys(inv).find((k) => inv[k].ns === repo.ns)
  const docs = inv[key].docs // [slug, "标题 MM-DD HH:mm"][]
  const outDir = `${OUT_ROOT}/${repo.ns.replace('/', '_')}`
  await mkdir(outDir, { recursive: true })

  await page.goto(`https://www.yuque.com/${repo.ns}`, { waitUntil: 'networkidle' }).catch(() => {})
  await page.waitForTimeout(2000)
  const bookId = await resolveBookId(repo.ns)
  console.log(`[${repo.name}] book_id = ${bookId}，共 ${docs.length} 篇`)
  if (!bookId) {
    summary.repos[repo.name] = { error: 'book_id 解析失败' }
    continue
  }

  // ego 的 page.evaluate 有 ~15s 上限，分小批量分片拉取
  const BATCH = 4
  const results = []
  for (let i = 0; i < docs.length; i += BATCH) {
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
      { slugs: docs.slice(i, i + BATCH).map((d) => d[0]), bookId },
    )
    results.push(...batch)
    console.log(`  批次 ${Math.floor(i / BATCH) + 1}: 累计 ${results.length}/${docs.length}`)
  }

  const ok = results.filter((r) => r.status === 200 && r.contentLength > 0)
  const failed = results.filter((r) => !(r.status === 200 && r.contentLength > 0))
  for (const r of results) {
    await writeFile(`${outDir}/${r.slug}.json`, JSON.stringify(r, null, 1))
  }
  summary.repos[repo.name] = {
    ns: repo.ns,
    bookId,
    total: results.length,
    ok: ok.length,
    failed: failed.map((r) => ({ slug: r.slug, title: r.title, status: r.status, type: r.type })),
  }
  console.log(`[${repo.name}] 成功 ${ok.length} / ${results.length}，失败：${JSON.stringify(failed.map((f) => ({ t: f.title, s: f.status })))}`)
}

await writeFile(`${OUT_ROOT}/_summary.json`, JSON.stringify(summary, null, 1))
console.log('DONE →', OUT_ROOT)
