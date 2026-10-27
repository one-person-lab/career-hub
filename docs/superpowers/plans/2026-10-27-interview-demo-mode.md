# 面试演示模式（Interview Demo Mode）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 career-hub 里加一个「面试演示」产物：只包含我主动标记发布的成果卡，物理上不含任何面试准备数据，可以安全地共享屏幕或发链接给面试官。

**Architecture:** 一份内容源（`content/项目成果/EX-*.md`），两次投影。`build-data.mjs` 除了现有的全量 `generated.json`，再输出一份 `generated.demo.json`（只含 `演示: 是` 的卡、按 `演示隐藏` 删段、只留讲解需要的字段）。演示侧走独立 HTML 入口 `demo.html` + `src/demo-main.ts`，构建时用 `vite --mode demo` 换 rollup 输入和 `outDir`，私有视图（管道、AI 训练室、知识卡）根本不进依赖图。隐私不靠前端隐藏，靠产物里就没有。

**Tech Stack:** Vue 3.5 SFC（无 vue-router，沿用 `App.vue` 的 `current` ref 切视图模式）、Vite 8、Tailwind 4（复用 `src/style.css` 的 `panel/row/btn/chip/dot/b-*` 类）、Node ESM 脚本。

**Spec:** 本文件即方案；上游决策来自与 ChatGPT 的对齐结论，摘要见下节。真实成果卡在本地 `content.private/项目成果/`（gitignored），本计划只改公开仓的骨架与管道。

## 已定的三个判断（评审时确认这三条即可）

1. **隔离点在构建层，不在运行时。** 现网 `career.buildhub.cn` 按 [server/nginx/career.buildhub.cn.conf](file:///Users/ethan/workspace/code/one-person-hub/career-hub/server/nginx/career.buildhub.cn.conf) 的注释「知道域名才访问」，无 basic auth；而 `generated.json` 整体打进一个 JS bundle。所以只加一个前端「演示模式」开关等于没隔离——F12 就能读到复盘和薪资预期。
2. **演示区不建新内容体系。** 它是 `content/项目成果/*.md` 的只读投影，作者只在 frontmatter 多写三个字段，维护一次、两处消费。
3. **演示内容 = 成果卡，不含知识卡。** 知识卡带 `掌握度`/`面试追问链`/`上次复习`，是备考资产，属于私人区。

## Global Constraints

- 演示产物里不得出现：非演示卡的标题、知识卡任何字段、`岗位管道.md` 的公司名、内容板块文档正文、内置视图标签（`首页`/`岗位与面试`/`AI 训练室`/`知识与薄弱项`）。
- 界面上不写「运行 xx 脚本」「改 xx 文件」这类 meta 文案；空态只说「还没有可演示的项目」。
- 不引入新依赖（无 vitest / 无 vue-router）。`package.json` 只加 scripts。
- `tsconfig.app.json` 开了 `noUnusedLocals`/`noUnusedParameters`，代码里不留未使用的 import。
- 不删改 `src/views/` 现有视图的行为；全量构建（`npm run build` → `dist/`）结果必须与改动前一致。
- 真实数据不入库：任何步骤不得把 `content.private/` 的内容写进 `content/` 或提交。

## 执行前必读（工作区状态）

`git status` 目前有大量未提交改动（`src/App.vue`、`scripts/build-data.mjs`、`src/views/*` 等 14 个文件 + `server/`、`scripts/publish-web.sh` 未跟踪）。**先和这些在途工作对齐再开始 Task 1**（要么先把现有改动提交，要么本计划的每次提交只 `git add` 自己动过的文件）。不要 `git stash`、不要 `git checkout --`，那些会连带打掉在途工作。

## 文件结构

| 动作 | 文件 | 责任 |
|---|---|---|
| Create | `src/data/types.ts` | 无数据的共享层：`Block`/`Chunk`/`Diagram` 类型 + `inline()`。谁 import 它都不会拖进私有 JSON |
| Modify | `src/data/store.ts:1-40`、`src/components/Blocks.vue:2` | 改为引用 `./types`，保持所有既有 import 不断 |
| Modify | `scripts/build-data.mjs` | 三个发布字段的解析 + `generated.demo.json` 投影 |
| Create | `scripts/check-demo.mjs` | 唯一自检口：`node`（数据层断言）与 `--dist`（产物指纹断言）两种模式 |
| Create | `demo.html`、`src/demo-main.ts`、`src/DemoApp.vue` | 演示入口与全屏讲解视图 |
| Create | `src/data/demo-store.ts` | 只读 `generated.demo.json`，与 `store.ts` 无引用关系 |
| Modify | `vite.config.ts:72-80` | `mode === 'demo'` 时换 `build.input` / `outDir` / `server.open` |
| Modify | `package.json`、`.gitignore`、`README.md` | `dev:demo` / `build:demo` / `check:demo`、忽略 `dist-demo`、一节用法 |

依赖顺序：Task 1 → Task 2 → Task 3 → Task 4 → Task 5。Task 2 的 gate 先写先跑（此时 `generated.demo.json` 不存在，必然失败），再实现投影。

---

### Task 1: 抽出无数据的共享层

没有这一步，`Blocks.vue` 一 import `store.ts` 就把全量 `generated.json` 拖进演示 bundle——这是整条隐私链最容易踩的雷。

**Files:**
- Create: `src/data/types.ts`
- Modify: `src/data/store.ts`（删 20-40 行的类型定义、删 324-338 行的 `inline`，加 re-export）
- Modify: `src/components/Blocks.vue:2`

**Produces:**
- `src/data/types.ts` 导出 `type Block`、`type Chunk`、`type Diagram`、`function inline(text: string): string`
- `src/data/store.ts` 仍导出同名符号（`export * from './types'`），既有 10 个消费方零改动

- [ ] **Step 1: 创建 `src/data/types.ts`**

内容从 `store.ts` 原样搬过来，不改一个字（块类型 + 全站唯一富文本出口）：

```ts
/**
 * 无数据依赖的共享层：类型 + 行内渲染。
 * 演示产物只 import 这里，不 import store.ts —— 否则全量私有 JSON 会被打进包。
 */

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
```

- [ ] **Step 2: 改 `src/data/store.ts`**

删除 `export type Block = ...` 到 `export interface Diagram {...}` 整段（现 20-40 行），在原位置改为一行 re-export，让 `store.ts` 的既有消费方（`App.vue`、9 个 view、4 个 component）继续按原路径取：

```ts
export * from './types'
```

再删除文件末尾的 `export function inline(...)` 整段（现 324-338 行，含上方注释）。`store.ts` 内部不调用 `inline`，所以不需要 import 它；删掉即可。

- [ ] **Step 3: 改 `src/components/Blocks.vue:2`**

```ts
import { inline, type Block } from '../data/types'
```

- [ ] **Step 4: 验证全量构建没坏**

Run: `npm run build`
Expected: `vue-tsc -b` 无报错，`vite build` 产出 `dist/`，结尾无 `error TS` 行。

- [ ] **Step 5: 验证运行时页面照旧**

Run: `npm run dev`，浏览器打开 `http://127.0.0.1:5175`（注意本机 vite 绑 IPv6 时改用 `http://localhost:5175`）。
Expected: 首页 / 项目与经历 / 知识与薄弱项 三页正常渲染，成果卡详情里的表格和 mermaid 图仍在。截图留作验收证据。

- [ ] **Step 6: Commit**

```bash
git add src/data/types.ts src/data/store.ts src/components/Blocks.vue
git commit -m "refactor: 抽出无数据依赖的共享层，为演示产物切断私有 JSON 引用链"
```

---

### Task 2: 发布字段 + 演示投影（gate 先写先失败）

**Files:**
- Create: `scripts/check-demo.mjs`（本任务只做数据层断言，`--dist` 分支留到 Task 5 填）
- Modify: `scripts/build-data.mjs`（`parseEvidenceCard` + 输出段）
- Modify: `content/项目成果/EX-900-示例项目B签到高并发改造.md`（补三个字段，让公开骨架自带用法示范）

**Consumes:** Task 1 的 `src/data/types.ts`（`Chunk`/`Diagram` 形状）

**Produces:**
- `src/data/generated.demo.json`：`{ generatedAt: string, cards: DemoCard[] }`
- `DemoCard` 字段（Task 3/4 依赖这些确切名字）：`id, title, oneLine, type, period, role, scale, demoLink, impact, impactHead, diagrams, chunks`
- `EvidenceCard` 新增内部字段：`demo: boolean`、`demoHidden: string[]`、`demoLink: string`（只存在于全量 `generated.json`）

- [ ] **Step 1: 写失败的自检脚本 `scripts/check-demo.mjs`**

```js
#!/usr/bin/env node
/**
 * 演示产物自检：证明「私有内容不在里面」，而不是相信我前端的隐藏逻辑。
 *   node scripts/check-demo.mjs          # 数据层：generated.demo.json 的投影是否正确
 *   node scripts/check-demo.mjs --dist   # 产物层：dist-demo 的 JS 里不得出现私有指纹（Task 5 接入）
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PRIV = join(ROOT, 'src/data/generated.json')
const DEMO = join(ROOT, 'src/data/generated.demo.json')
const PRIVATE_FIELDS = ['file', 'name', 'dir', 'chars', 'hasStar', 'reuse', 'updated', 'demo', 'demoHidden']

const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const fails = []
const check = (ok, msg) => {
  if (!ok) fails.push(msg)
}

// ── 数据层 ────────────────────────────────────────────────
if (!existsSync(DEMO)) {
  console.error('[check-demo] 缺 src/data/generated.demo.json —— 先跑 npm run gen:data')
  process.exit(1)
}
const priv = read(PRIV)
const demo = read(DEMO)
const pinned = new Set(priv.evidence.filter((c) => c.demo).map((c) => c.id))

check(Array.isArray(demo.cards), '[cards] 不是数组')

// 1. 演示包里的卡必须都被标了「演示: 是」，一张不多
const leakedIds = demo.cards.map((c) => c.id).filter((id) => !pinned.has(id))
check(leakedIds.length === 0, `[越权发布] 未标记的卡出现在演示包：${leakedIds.join(', ')}`)

// 2. 标记了的卡一张不少
const missingIds = [...pinned].filter((id) => !demo.cards.some((c) => c.id === id))
check(missingIds.length === 0, `[漏发布] 标了「演示: 是」却没有进包：${missingIds.join(', ')}`)

// 3. 内部字段一律不带（file 会暴露本地路径与真实项目命名）
for (const c of demo.cards) {
  const dirty = PRIVATE_FIELDS.filter((f) => f in c)
  check(dirty.length === 0, `[字段泄漏] ${c.id} 带了内部字段：${dirty.join(', ')}`)
}

// 4. 隐藏段连同段里的图一起删干净
const srcById = Object.fromEntries(priv.evidence.map((c) => [c.id, c]))
for (const c of demo.cards) {
  const src = srcById[c.id]
  const hidden = new Set(src.demoHidden || [])
  const stillThere = c.chunks.map((x) => x.name).filter((n) => hidden.has(n))
  check(stillThere.length === 0, `[段未删] ${c.id} 仍含隐藏段：${stillThere.join(', ')}`)

  const keptCodes = new Set(
    c.chunks.flatMap((x) => x.blocks.filter((b) => b.type === 'mermaid').map((b) => b.text)),
  )
  const orphan = c.diagrams.filter((d) => !keptCodes.has(d.code))
  check(orphan.length === 0, `[图残留] ${c.id} 的图来自已隐藏的段：${orphan.map((d) => d.name).join(', ')}`)

  // 演示包里的每个图都必须能在原文里找到同源，且 id 连续
  check(
    c.diagrams.every((d, i) => d.id === `d${i + 1}`),
    `[图编号] ${c.id} 的 diagrams id 不连续：${c.diagrams.map((d) => d.id).join(',')}`,
  )

  // 5. 「影响」「架构图」已从 chunks 移出（视图直接用 impact/impactHead/diagrams 渲染，不能重复）
  check(
    !c.chunks.some((x) => x.name === '影响' || x.name === '架构图'),
    `[段重复] ${c.id} 的 chunks 里还留着「影响」或「架构图」`,
  )
}

// 6. 未发布的卡标题不得出现在演示 JSON 文本里
const demoText = readFileSync(DEMO, 'utf8')
const unpublished = priv.evidence.filter((c) => !c.demo).map((c) => c.title)
const hitTitles = unpublished.filter((t) => t && t.length >= 2 && demoText.includes(t))
check(hitTitles.length === 0, `[标题泄漏] 演示包出现未发布项目：${hitTitles.join(' / ')}`)

// 7. 知识卡与管道完全不进演示包
check(!demoText.includes('面试追问链') && !demoText.includes('掌握度'), '[串包] 演示包含知识卡字段')
check(!('pipeline' in demo) && !('knowledge' in demo) && !('sections' in demo), '[串包] 演示包含私有分区')

if (fails.length) {
  for (const f of fails) console.error(f)
  console.error(`[check-demo] ${fails.length} 项不通过`)
  process.exit(1)
}
console.log(`[check-demo] 数据层通过：演示卡 ${demo.cards.length}/${priv.evidence.length}`)
```

- [ ] **Step 2: 跑起来确认失败**

Run: `node scripts/check-demo.mjs`
Expected: `FAIL` —— 报 `缺 src/data/generated.demo.json —— 先跑 npm run gen:data`，退出码 1。

- [ ] **Step 3: 在 `scripts/build-data.mjs` 里解析三个发布字段**

`parseEvidenceCard`（现 299-326 行）的返回对象里，在 `hasStar` 之后插入：

```js
    // 面试演示发布开关：`演示: 是` 才进演示包；`演示隐藏: 复盘, 时间线` 按 H2 段名删段
    demo: fm['演示'] === '是',
    demoHidden: splitList(fm['演示隐藏']),
    demoLink: (fm['演示链接'] || '').trim(),
```

- [ ] **Step 4: 加演示投影函数**

放在 `parseEvidenceCard` 之后、`// ── 2. 知识卡` 注释之前：

```js
/**
 * 演示投影：把一张成果卡削成「讲给面试官听」的形状。
 * 只留讲解需要的字段（file / chars / hasStar 这类内部字段一概不出门），
 * 按 demoHidden 整段删除，段里的 mermaid 图随之消失 —— 图是从留下的块里重抽的，
 * 不复用 extractDiagrams(md) 的全量结果。
 */
function toDemoCard(c) {
  const hidden = new Set(c.demoHidden)
  const kept = c.chunks.filter((ch) => !hidden.has(ch.name))
  const ON_CARD = new Set(['影响', '架构图'])
  const hasImpact = kept.some((ch) => ch.name === '影响')
  const diagrams = []
  for (const ch of kept) {
    for (const b of ch.blocks) {
      if (b.type === 'mermaid') {
        diagrams.push({ id: `d${diagrams.length + 1}`, name: ch.name, code: b.text })
      }
    }
  }
  return {
    id: c.id,
    title: c.title,
    oneLine: c.oneLine,
    type: c.type,
    period: c.period,
    role: c.role,
    scale: c.scale,
    demoLink: c.demoLink,
    impact: hasImpact ? c.impact : [],
    impactHead: hasImpact ? c.impactHead : [],
    diagrams,
    chunks: kept
      .filter((ch) => !ON_CARD.has(ch.name))
      .map(({ name, blocks }) => ({ name, blocks })),
  }
}
```

- [ ] **Step 5: 输出 `generated.demo.json`**

文件顶部常量区（现 25 行 `const OUT` 之后）加：

```js
const OUT_DEMO = join(ROOT, 'src/data/generated.demo.json')
```

汇总输出段（现 591-611 行）改成：全量 `data` 保持原样，另算 `demoCards`、多写一个文件、多打一个计数。

```js
const demoCards = evidence.filter((c) => c.demo).map(toDemoCard)

mkdirSync(join(ROOT, 'src/data'), { recursive: true })
writeFileSync(OUT, JSON.stringify(data, null, 1))
writeFileSync(OUT_DEMO, JSON.stringify({ generatedAt: data.generatedAt, cards: demoCards }, null, 1))
```

并把末尾 `console.log` 的第一段改成同时报演示卡数（其余不动）：

```js
console.log(
  `[gen:data] 板块 ${sections.length}（内置 ${sections.length - secs.length} · 内容板块 ${secs.length}）` +
    ` · 成果卡 ${evidence.length}（演示 ${demoCards.length} 张 · ${evidence.reduce((s, c) => s + c.diagrams.length, 0)} 张图）` +
    ` · 知识卡 ${knowledge.length}（${knowledge.reduce((s, c) => s + c.diagrams.length, 0)} 张图）` +
    ` · 管道 ${data.pipeline.length} 条` +
    ` · 旧库 ${data.legacy ? data.legacy.mdTotal + ' 篇 md / ' + data.legacy.htmlTotal + ' 个 html' : '未找到'}` +
    ` → src/data/generated.json + generated.demo.json`,
)
```

- [ ] **Step 6: 给示例卡补上三个字段（示范用法，也是 gate 的正例）**

`content/项目成果/EX-900-示例项目B签到高并发改造.md` 的 frontmatter 里，`可复用` 行之后加两行；并在文末已有的 `## 复盘` 段保持不动，用它验证「段被删掉且不留图」：

```
演示: 是
演示隐藏: 复盘
```

同目录再加一份「怎么写」的说明：`content/项目成果/_说明.md` 里补一节（该文件若不存在则新建，沿用其它板块 `_说明.md` 的语气，正文只讲这三行字段）：

```markdown
## 哪些卡能拿去面试

frontmatter 里写 `演示: 是`，这张卡才会进 `npm run build:demo` 的产物。没写的、以及
`content.private/` 里所有真实内容，都不会出现在演示包里 —— 演示包是从零重建的，
不是把私有内容藏起来。

只想展示部分段落时，按 H2 段名排除：

​```
演示隐藏: 复盘, 时间线
​```

`演示链接: https://…` 会在演示页上变成一个「打开现场演示」按钮，只放你自己确认可以公开的外链。
```

- [ ] **Step 7: 跑起来确认通过**

Run: `npm run gen:data && node scripts/check-demo.mjs`
Expected: `[gen:data] … 成果卡 1（演示 1 张 …）…` 然后 `[check-demo] 数据层通过：演示卡 1/1`，退出码 0。

再验两条负例（确认两个开关都是活的）：
- **A. 发布开关**：把 `content/项目成果/EX-900-*.md` 的 `演示: 是` 临时改成 `演示: 否`，跑 `npm run gen:data && node scripts/check-demo.mjs`。Expected: 通过且末行是 `演示卡 0/1`（越权检查此时是空集，正好证明未标记的卡一张都不会进包）。
- **B. 排除开关**：改回 `演示: 是`，把 `演示隐藏: 复盘` 整行删掉，重跑。Expected: 仍通过，但 `grep -c 复盘 src/data/generated.demo.json` ≥ 1 —— 复盘正文回到包里，说明段落排除完全由这个字段控制。

**验完把两行字段恢复成 Step 6 的写法**，再跑一次 `npm run gen:data && node scripts/check-demo.mjs` 确认 `演示卡 1/1` 且 `grep -c 复盘 src/data/generated.demo.json` 为 0。

- [ ] **Step 8: Commit**

```bash
git add scripts/build-data.mjs scripts/check-demo.mjs content/项目成果/
git commit -m "feat: 成果卡加演示发布字段，产出隔离的 generated.demo.json"
```

---

### Task 3: 独立入口与产物隔离

**Files:**
- Create: `demo.html`
- Create: `src/demo-main.ts`
- Create: `src/data/demo-store.ts`
- Modify: `vite.config.ts:72-80`
- Modify: `package.json`（scripts）
- Modify: `.gitignore`（`dist` 之后加 `dist-demo`）

**Consumes:** Task 2 的 `src/data/generated.demo.json`（`{ generatedAt, cards }`）

**Produces:**
- `src/data/demo-store.ts` 导出 `interface DemoCard`、`const demoCards: DemoCard[]`、`const demoGeneratedAt: string`
- `npm run build:demo` → `dist-demo/`；`npm run dev:demo` → 打开 `/demo.html`

- [ ] **Step 1: `src/data/demo-store.ts`**

注意：这个文件**不能** import `./store`，否则全量私有 JSON 进包（Task 1 就是为了断开这条边）。

```ts
import raw from './generated.demo.json'
import type { Chunk, Diagram } from './types'

/** 演示卡：只含讲解要用的字段，形状由 scripts/build-data.mjs 的 toDemoCard 决定 */
export interface DemoCard {
  id: string
  title: string
  oneLine: string
  type: string
  period: string
  role: string
  scale: string
  demoLink: string
  impact: Record<string, string>[]
  impactHead: string[]
  diagrams: Diagram[]
  chunks: Chunk[]
}

const r = raw as Record<string, unknown>
export const demoCards: DemoCard[] = (r.cards as DemoCard[]) ?? []
export const demoGeneratedAt: string = (r.generatedAt as string) ?? ''
```

- [ ] **Step 2: `demo.html`**

和 `index.html` 同构，但标题中性（共享屏幕时浏览器标签页也会被人看到）：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>项目介绍</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/demo-main.ts"></script>
  </body>
</html>
```

- [ ] **Step 3: `src/demo-main.ts`**

```ts
import { createApp } from 'vue'
import './style.css'
import DemoApp from './DemoApp.vue'

createApp(DemoApp).mount('#app')
```

- [ ] **Step 4: `vite.config.ts` 按 mode 切换输入与输出**

把 `export default defineConfig(({ mode }) => {…})` 的返回对象改成（`plugins`、`server.port` 保持原样）：

```ts
export default defineConfig(({ mode }) => {
  // .env 里的 COACH_* 不会自动进 process.env，这里手动搬一次
  Object.assign(process.env, loadEnv(mode, path.dirname(fileURLToPath(import.meta.url)), ''))

  // 演示产物：独立入口 + 独立目录。私有视图（管道/训练室/知识卡）不进依赖图，
  // generated.json 也不进 —— 隔离发生在构建层，不靠前端隐藏。
  const demo = mode === 'demo'
  const html = (name: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), name)

  return {
    plugins: [vue(), portfolioStatic(), coachApi()],
    server: { port: 5175, open: demo ? '/demo.html' : undefined },
    build: {
      outDir: demo ? 'dist-demo' : 'dist',
      rollupOptions: { input: html(demo ? 'demo.html' : 'index.html') },
    },
  }
})
```

- [ ] **Step 5: scripts 与忽略项**

`package.json` 的 `scripts` 里加三条（现有 `build` 保持不带 mode 参数，产物仍是 `dist/`）：

```json
    "dev:demo": "vite --mode demo",
    "build:demo": "npm run gen:data && vue-tsc -b && vite build --mode demo",
    "check:demo": "node scripts/check-demo.mjs"
```

`.gitignore` 第 12 行 `dist-ssr` 之后加一行：

```
dist-demo
```

- [ ] **Step 6: 验证两条链互不干扰**

Run: `npm run build`
Expected: 产出 `dist/`，无 TS 报错（此时 `DemoApp.vue` 还不存在，所以 Step 6 只验主链；若嫌空转，可先建一个只渲染 `<div>demo</div>` 的 `src/DemoApp.vue` 占位再跑 `npm run build:demo` 验演示链，Task 4 再补真视图）。

Run: `npm run build:demo`
Expected: 产出 `dist-demo/index.html`，且 `dist-demo/` 里没有任何 `api/coach` 调用（`grep -rl "api/coach" dist-demo || echo clean` → `clean`）。

- [ ] **Step 7: Commit**

```bash
git add demo.html src/demo-main.ts src/data/demo-store.ts vite.config.ts package.json .gitignore
git commit -m "feat: 演示产物独立入口，构建层隔离私有数据"
```

---

### Task 4: 全屏讲解视图 `DemoApp.vue`

面试时共享屏幕就停在这一页：左边挑项目，右边讲。左右方向键切卡，不需要现场翻文件夹。

**Files:**
- Create: `src/DemoApp.vue`
- Test: `dist-demo` 产物 + 浏览器截图（无单测框架，验收看真页面）

**Consumes:** `demoCards`（Task 3）、`Blocks`/`MermaidBlock`（既有组件，Task 1 后不再引私有数据）、`inline`（`src/data/types`）

- [ ] **Step 1: 写 `src/DemoApp.vue`**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhTrophy, PhImage, PhPlay, PhArrowLeft, PhArrowRight } from '@phosphor-icons/vue'
import Blocks from './components/Blocks.vue'
import MermaidBlock from './components/MermaidBlock.vue'
import { demoCards, type DemoCard } from './data/demo-store'
import { inline } from './data/types'

/**
 * 面试演示：只读投影，数据来自 generated.demo.json。
 * 「影响」表和架构图单独前置 —— 面试官先要结果，再要实现。
 */
const idx = ref(0)
const active = computed<DemoCard | null>(() => demoCards[idx.value] ?? null)

function move(step: number) {
  if (!demoCards.length) return
  idx.value = (idx.value + step + demoCards.length) % demoCards.length
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(-1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-screen flex-col bg-base">
    <!-- 顶栏：项目计数 + 翻页；不放工作台品牌，避免共享屏幕时串场景 -->
    <header class="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-panel px-5">
      <span class="flex h-5 w-5 items-center justify-center rounded-[5px] bg-raised text-ink-2">
        <PhTrophy :size="12" weight="bold" />
      </span>
      <h1 class="min-w-0 truncate text-[13px] font-semibold text-ink">{{ active?.title || '项目介绍' }}</h1>
      <span class="font-mono text-[11px] text-ink-3">{{ demoCards.length ? `${idx.value + 1}/${demoCards.length}` : '0' }}</span>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <a
          v-if="active?.demoLink"
          :href="active.demoLink"
          target="_blank"
          rel="noreferrer"
          class="btn btn-primary"
        >
          <PhPlay :size="13" weight="bold" />
          打开现场演示
        </a>
        <button class="btn btn-ghost" :disabled="demoCards.length < 2" @click="move(-1)">
          <PhArrowLeft :size="13" weight="bold" />
        </button>
        <button class="btn btn-ghost" :disabled="demoCards.length < 2" @click="move(1)">
          <PhArrowRight :size="13" weight="bold" />
        </button>
      </div>
    </header>

    <!-- 空态：一句人话，不暴露脚本与路径 -->
    <main v-if="!active" class="flex flex-1 items-center justify-center">
      <p class="text-[13px] text-ink-3">还没有可演示的项目。</p>
    </main>

    <main v-else class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="hidden min-h-0 flex-col border-r border-line bg-panel px-2 py-2 lg:flex">
        <div class="group-head mt-1">项目</div>
        <button
          v-for="(c, i) in demoCards"
          :key="c.id"
          class="row py-[6px] text-[13px]"
          :class="i === idx ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'"
          @click="idx = i"
        >
          <span class="min-w-0 flex-1 truncate">{{ c.title }}</span>
          <span v-if="c.type" class="chip shrink-0">{{ c.type }}</span>
        </button>
      </aside>

      <div class="min-w-0 overflow-y-auto px-5 py-5">
        <div class="mx-auto flex max-w-[920px] flex-col gap-4">
          <!-- 一句话定位 + 角色规模 -->
          <section class="panel flex flex-col gap-2 p-4">
            <p v-if="active.oneLine" class="text-[15px] leading-relaxed text-ink" v-html="inline(active.oneLine)" />
            <div class="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-2">
              <span v-if="active.period">时间 {{ active.period }}</span>
              <span v-if="active.role">角色 {{ active.role }}</span>
              <span v-if="active.scale">规模 {{ active.scale }}</span>
            </div>
          </section>

          <!-- 结果先行 -->
          <section v-if="active.impact.length" class="panel flex flex-col gap-2 p-4">
            <h2 class="text-[12px] font-semibold text-ink-2">影响</h2>
            <table class="w-full border-collapse text-[13px]">
              <thead>
                <tr class="border-b border-line text-left text-[12px] text-ink-3">
                  <th v-for="h in active.impactHead" :key="h" class="py-1.5 pr-3 font-medium">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, ri) in active.impact" :key="ri" class="border-b border-line/60">
                  <td v-for="h in active.impactHead" :key="h" class="py-2 pr-3 align-top text-ink-2" v-html="inline(r[h] || '')" />
                </tr>
              </tbody>
            </table>
          </section>

          <!-- 架构图 -->
          <section v-if="active.diagrams.length" class="flex flex-col gap-3">
            <div v-for="d in active.diagrams" :key="d.id" class="panel flex flex-col gap-2 p-4">
              <h2 class="flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
                <PhImage :size="12" weight="regular" />
                {{ d.name }}
              </h2>
              <MermaidBlock :id="`demo-${active.id}-${d.id}`" :code="d.code" />
            </div>
          </section>

          <!-- 关键决策 / 难点与踩坑等余下段落 -->
          <section v-for="(ch, ci) in active.chunks" :key="ch.name" class="panel flex flex-col gap-2 p-4">
            <h2 class="text-[12px] font-semibold text-ink-2">{{ ch.name }}</h2>
            <Blocks :blocks="ch.blocks" :mid-prefix="`demo-${active.id}-${ci}`" />
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
```

- [ ] **Step 2: 类型与构建过**

Run: `npm run build:demo && npm run check:demo`
Expected: 构建无 TS 报错；`[check-demo] 数据层通过：演示卡 1/1`。

- [ ] **Step 3: 真机看效果（运行时验证，不能只看构建）**

Run: `npm run preview`（默认服务 `dist/`，验主站）与 `npx vite preview --mode demo`（服务 `dist-demo/`，地址 `http://localhost:4173/demo.html`；若本机 vite 只绑 IPv6，用 `http://[::1]:4173/demo.html`）。
Expected:
1. 演示页只显示被标了 `演示: 是` 的项目，右侧「复盘」段不出现，且 mermaid 图正常渲染；
2. `→` / `←` 切卡生效；
3. 有 `演示链接` 的卡出现「打开现场演示」按钮，点击新标签打开；
4. 主站 `http://localhost:4173` 侧栏仍是完整 6 项，各页与改动前一致。
两张截图（演示页 + 主站页）留作验收证据。

- [ ] **Step 4: Commit**

```bash
git add src/DemoApp.vue
git commit -m "feat: 面试演示全屏讲解视图"
```

---

### Task 5: 产物指纹自检 + 接入上线链

把「私有内容不在包里」从一句承诺变成一条会失败的检查；顺手让 `npm run build` 与 CI-less 手工上线都自动过一遍。

**Files:**
- Modify: `scripts/check-demo.mjs`（补 `--dist` 分支）
- Modify: `scripts/publish-web.sh`
- Modify: `README.md`

- [ ] **Step 1: 在 `scripts/check-demo.mjs` 末尾的 `if (fails.length)` 之前插入 `--dist` 分支**

思路：指纹不是我手写的黑名单，而是从全量 `generated.json` 现算的「私有内容里独有的字符串」，然后到 `dist-demo` 的产物文本里逐个搜。任何一条命中就说明包串了。

```js
// ── 产物层 ────────────────────────────────────────────────
if (process.argv.includes('--dist')) {
  const DIST = join(ROOT, 'dist-demo')
  if (!existsSync(DIST)) {
    console.error('[check-demo] 缺 dist-demo/ —— 先跑 npm run build:demo')
    process.exit(1)
  }
  const jsFiles = []
  const collect = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) collect(p)
      else if (/\.(js|css|html|json)$/.test(e.name)) jsFiles.push(p)
    }
  }
  collect(DIST)
  const bundle = jsFiles.map((p) => readFileSync(p, 'utf8')).join('\n')

  // 从私有全量里现算指纹：没发布的卡、知识卡、管道公司名、内容板块文档、内置视图标签
  const demoIds = new Set(demo.cards.map((c) => c.id))
  const fingerprints = [
    ...priv.evidence.filter((c) => !demoIds.has(c.id)).map((c) => c.title),
    ...priv.knowledge.map((k) => k.title),
    ...priv.knowledge.flatMap((k) => k.numbers),
    ...priv.pipeline.map((p) => p.company),
    ...priv.pipeline.map((p) => p.action),
    ...priv.sections.filter((s) => s.builtin).map((s) => s.label),
    ...priv.sections.filter((s) => !s.builtin).flatMap((s) => [s.label, ...s.docs.map((d) => d.title)]),
  ]
    .filter(Boolean)
    .filter((t) => String(t).length >= 3)

  const hits = fingerprints.filter((t) => bundle.includes(t))
  check(hits.length === 0, `[指纹命中] dist-demo 里出现私有内容：${hits.slice(0, 8).join(' / ')}`)

  // 隐藏段即使在已发布的卡里也不能留正文
  for (const c of demo.cards) {
    const src = srcById[c.id]
    for (const h of src?.demoHidden || []) {
      const body = (src.chunks.find((x) => x.name === h) || {}).raw || ''
      const probe = body.replace(/\s+/g, '').slice(0, 24)
      if (probe.length >= 12) {
        check(!bundle.replace(/\s+/g, '').includes(probe), `[隐藏段正文残留] ${c.id} 的「${h}」仍在产物里`)
      }
    }
  }

  check(!bundle.includes('content.private'), '[路径泄漏] dist-demo 里出现 content.private')
  check(!bundle.includes('/api/coach'), '[接口泄漏] dist-demo 里挂了面试教练代理调用')

  console.log(`[check-demo] 产物层扫描 ${jsFiles.length} 个文件、${fingerprints.length} 条指纹`)
}
```

同时把顶部 import 补全：

```js
import { readFileSync, existsSync, readdirSync } from 'node:fs'
```

- [ ] **Step 2: 跑产物层自检**

Run: `npm run build:demo && node scripts/check-demo.mjs --dist`
Expected: 末行 `[check-demo] 产物层扫描 N 个文件、M 条指纹` + `[check-demo] 数据层通过：演示卡 1/1`，退出码 0，无 `[指纹命中]`。

- [ ] **Step 3: 验 gate 真会拦（负例，必须做一次）**

临时把 `vite.config.ts` 的 `rollupOptions.input` 改成恒为 `html('index.html')`（模拟「忘了用独立入口」），跑 `npm run build:demo && node scripts/check-demo.mjs --dist`。
Expected: **FAIL** —— 出现 `[指纹命中] dist-demo 里出现私有内容：…`（全量站的 bundle 里有知识卡标题、管道公司名和内置视图标签，必然命中）。验完把 `input` 改回 Task 3 Step 4 写的 `html(demo ? 'demo.html' : 'index.html')`，再跑一次确认通过。

- [ ] **Step 4: 上线链接入**

`scripts/publish-web.sh` 里两处改动。

第一处，在 `SKIP_BUILD=0` / `NO_COACH=0` 旁边加一个开关并解析参数（保持未知参数报错退出的既有约定）：

```bash
DEMO_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1; shift ;;
    --no-coach) NO_COACH=1; shift ;;
    --demo) DEMO_ONLY=1; shift ;;
    *) echo "未知参数：$1" >&2; exit 2 ;;
  esac
done
```

第二处，在 `if [[ "$SKIP_BUILD" == 0 ]]; then … fi` 之后、静态推送之前，插入演示产物分支；并让 `--demo` 推送到独立目录（`$WEB` 是私人全量站，两者不能互相覆盖）：

```bash
# 演示产物：只推 dist-demo，跳过 coach 代理
if [[ "$DEMO_ONLY" == 1 ]]; then
  DEMO_ROOT="${WEB_DEMO_ROOT:-/www/wwwroot/demo.buildhub.cn}"
  if [[ "$SKIP_BUILD" == 0 ]]; then
    echo "[publish] 构建演示产物"
    npm run build:demo >/dev/null
  fi
  echo "[check] 演示包自检"
  node scripts/check-demo.mjs --dist
  echo "[publish] dist-demo → $HOST:$DEMO_ROOT"
  rsync -az --delete dist-demo/ "$HOST:$DEMO_ROOT/"
  ssh "$HOST" "chown -R www:www $DEMO_ROOT && find $DEMO_ROOT -type f -exec chmod 644 {} +"
  echo "[publish] 完成（演示，不重启 coach 代理）"
  exit 0
fi
```

同时在文件头的用法注释里补一行：

```bash
#   bash scripts/publish-web.sh --demo        # 只构建并上线演示产物（自检不过就停）
```

并且把默认（非 `--demo`）那条链的构建段改成先自检，防止误把演示包推上全量站：

```bash
if [[ "$SKIP_BUILD" == 0 ]]; then
  echo "[publish] 构建"
  npm run build >/dev/null
  echo "[publish] 演示包自检"
  npm run check:demo --silent
fi
```

- [ ] **Step 5: 干跑上线脚本（不外推到服务器）**

Run: `bash -n scripts/publish-web.sh && DEMO_ONLY 分支用 SKIP_BUILD=1 试算` —— 具体执行：

```bash
bash -n scripts/publish-web.sh
node scripts/check-demo.mjs && node scripts/check-demo.mjs --dist
```
Expected: 语法检查无输出；两条自检均退出码 0。
**不要**在这一步真跑 `publish-web.sh`（它会 rsync 到 smzs-server 并可能重启服务）；上线动作等用户明确放行。

- [ ] **Step 6: README 补一节**

`README.md` 里加一节，位置放在现有「怎么用」类章节之后：

```markdown
## 面试演示模式

平时用工作台备考，面试时只给人看你自己决定展示的东西。

- 数据源仍是 `content/项目成果/EX-*.md`，不另建一套内容。
- frontmatter 写 `演示: 是` 的卡才进演示产物；`演示隐藏: 复盘` 按段排除；
  `演示链接: https://…` 变成「打开现场演示」按钮。
- `npm run dev:demo` 本地全屏演示（面试前自己排练）；`npm run build:demo` 出 `dist-demo/`。
- 隔离在构建层：演示包只读 `generated.demo.json`，私有视图与私有 JSON 都不进那个包。
  `npm run check:demo`（加 `--dist` 扫产物）会拿全量数据现算指纹去演示包里搜，命中即失败。
```

- [ ] **Step 7: Commit**

```bash
git add scripts/check-demo.mjs scripts/publish-web.sh README.md
git commit -m "feat: 演示产物指纹自检并接入上线链"
```

---

## 自检（Self-Review，我跑完的结论）

**1. Spec 覆盖**：三个已定判断分别落在 —— 构建层隔离（Task 3 双入口 + Task 5 指纹 gate）、不建新内容体系（Task 2 三字段 + `toDemoCard` 投影）、演示只含成果卡（Task 2 断言 7 禁知识卡/管道入包）。ChatGPT 那条「不能靠前端不显示保护隐私」由 Task 5 Step 3 的负例证明 gate 有效。「面试时一键进入干净演示界面」= Task 4 的独立全屏页 + 方向键切卡。

**2. 占位扫描**：无 TBD / 「同上」；每个代码步都给了可直接落盘的完整代码。两处「改一下再改回来」的步骤（Task 2 Step 7、Task 5 Step 3）是刻意的负例验证，都写明了恢复动作与恢复后的期望输出。

**3. 类型一致性**：`DemoCard` 字段（Task 2 `toDemoCard` 产出 ↔ Task 3 `demo-store.ts` 声明 ↔ Task 4 模板取值）三处一致，逐一核过：`id/title/oneLine/type/period/role/scale/demoLink/impact/impactHead/diagrams/chunks`。`diagrams[].id` 形如 `d1..dN`（Task 2 断言 4 与 `toDemoCard` 的 `d${length+1}` 对齐）。`EvidenceCard` 新增的 `demo/demoHidden/demoLink` 在 Task 2 断言里被显式列为「不得出现在演示包」的内部字段，同时 `demo`/`demoHidden` 由 Task 5 的指纹逻辑消费。

## 需要你拍板的两件事（不属于本计划，实现前定即可）

1. **演示包怎么送达面试官。** 三种，成本递增：① 不部署，面试时本机 `npm run dev:demo` 共享屏幕（零新攻击面，本计划 Task 1-5 已够用）；② 推 `demo.buildhub.cn` 子域名（需签证书 + 一份新 nginx server 块，Task 5 的 `--demo` 分支已按这个目录约定写好）；③ 给全量站也加 basic auth。我建议 ①，等真的需要「先发链接再面试」再上 ②。
2. **现网 `career.buildhub.cn` 带全量私有数据且无鉴权**（[server/nginx/career.buildhub.cn.conf](file:///Users/ethan/workspace/code/one-person-hub/career-hub/server/nginx/career.buildhub.cn.conf) 的注释明确写了「不设 basic auth，靠域名不为人知」）。本计划不动它。但只要你会把这个域名发给任何第三方，它就和演示模式的隔离目标冲突——要么只发 `demo.` 那个，要么给它加鉴权。要不要我另开一个小任务处理，你说。
