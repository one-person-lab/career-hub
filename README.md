# 职业工作台（career-hub）

一套**冲刺型**的个人求职工作台：把「我做过什么 / 我会什么 / 我怎么讲」三件事，从一堆散落的文档里抽成两张可一秒调取的**卡片墙**——成果库（Evidence）与能力图谱（Knowledge）。界面核心是「一秒抽到该用的弹药」，不是文档导航。

这是 `one-person-lab` 下三个工作台之一（另两个：`media-hub` 运营推广、`product-hub` 产品）。视觉沿用同一套 **Neo-Brutalism** 令牌与组件类。

## 定位：和另两个工作台不是同一种东西

| | 媒体 / 产品工作台 | 职业工作台 |
|---|---|---|
| 类型 | 长期建设型 | **冲刺型** |
| 价值曲线 | 每天用，越用越值钱 | 峰值集中在求职与面试周期 |
| 界面核心 | 浏览 + 讲解 | **一秒抽到该用的弹药** |

**这个区别决定了设计。** 所以这里的核心是两张卡片墙，不是「一个目录一个板块，点开看文档」。

## 三条设计原则

1. **成果库是唯一事实源。** 简历、故事库、自我介绍、作品集全部是派生视图。改一条成果卡，四处同时更新。
2. **每个项目、每个知识点都要有图。** 不是装饰——是「你能不能在白板上画出来」的检验，也是回忆时的第二条通路（双重编码）。
3. **覆盖缺口和复习节奏要算得出来。** 岗位要求 × 我的证据 = 缺哪块；超过 21 天没碰的知识点自动进「该复习了」。

## 知识库按 PARA 组织

`content/` 是职业知识库，按 **PARA**（Projects / Areas / Resources / Archive）整理：

| PARA 层 | 含义 | 本仓库对应 |
|---------|------|-----------|
| **Projects · 进行中** | 有终点的求职行动 | `00-Projects/`（公司作战室等正在准备的投递 / 面试冲刺） |
| **Areas · 长期资产** | 长期维护、无终点的资产 | `10-Areas/`（职业定位 / 目标岗位 / 能力图谱 K 卡） |
| **Resources · 参考** | 可复用参考资料 | `20-Resources/`（技术笔记 / 面试问答 / 使用说明 / 决策日志） |
| **Archive · 归档** | 已完成 / 失效 | `30-Archive/`（结项的复盘、过期版本） |

> **为什么不把所有内容都塞进 PARA？** 本工作台最有价值的是 **EX / K 卡片体系**（成果库唯一事实源 + 能力图谱），它横跨 Areas 与 Resources，不适合硬拆。所以采用**混合方案**：保留卡片体系为骨架，顶层用 PARA 收口「进行中的求职行动」。

## 导航结构

三组共十个板块（实际分组随 PARA 顶层目录自动推导）：

| 分组 | 板块 | 实现 |
|------|------|------|
| **长期资产** | 总览 | `OverviewView.vue`（内置） |
| | 职业定位 / 目标岗位 | 通用板块 `DocView.vue` |
| | 成果库 | `EvidenceView.vue`（内置，卡片墙） |
| | 能力图谱 | `KnowledgeView.vue`（内置，卡片墙） |
| **进行中** | 公司作战室 | 通用板块 |
| **参考** | 技术笔记 / 面试问答 / 使用说明 / 决策日志 | 通用板块 |

## 数据层

```
content/<PARA>/<板块>/*.md   ─┐
content/10-Areas/知识点/K-*.md ├→ scripts/build-data.mjs → src/data/generated.json → src/data/store.ts → 视图
../career-os/**（可选，只读盘点） ─┘
```

**这是唯一的接缝。** 调整内容 = 改 md，视图层零改动。`build-data.mjs` 递归扫描 `content/`，由 PARA 顶层目录推导分组。

- `content/<PARA>/<目录>/` —— 一个目录 = 一个板块
- `K-*.md` —— 知识卡，由 build-data 解析成结构化字段（trade-off / 数字 / 追问链 / 项目锚点 / 图）
- `_` 开头的 md 被跳过（放模板和说明）
- `../career-os/` —— **可选**只读扫描，只在总览页显示「旧库还剩多少篇」，不导入正文；不存在时自动跳过

### 怎么新增一个板块

```bash
mkdir -p content/20-Resources/增长实验
# 写一个 md，正文用 ## 分节
npm run gen:data
```

未登记但有内容的目录会按所在 PARA 层自动归组。想控制位置、图标、色块，在 `scripts/build-data.mjs` 的 `SECTION_DEFS` 里加一行；`icon` 取值需在 `src/data/store.ts` 的 `SECTION_ICONS` 登记。

## 卡片格式

### 知识卡 `content/10-Areas/知识点/K-001-xxx.md`

frontmatter：`领域 / 掌握度 / 上次复习 / 关联岗位 / 最后更新`

正文里四节会被抽成卡片正面的结构化区块：`关键 trade-off`（表格）、`必须记住的数字`（列表）、`面试追问链`（列表）、`我的项目锚点`（列表）。

掌握度取值：`生疏 / 理解 / 熟练 / 能讲`（对应 1–4 分）。

（成果卡 `EX-*.md` 的规范见 `import-yuque/架构师储备/05项目复盘` 等原始素材；公开仓库默认不含真实成果卡，填入你自己的即可。）

## 开发

```bash
npm install
npm run gen:data   # 解析 content/ → src/data/generated.json（dev/build 前自动跑）
npm run dev        # 默认 5175 端口
npm run build      # vue-tsc 类型检查 + 产物构建
```

> `vite.config.ts` 的 `portfolioStatic()` 把 `/portfolio/*` 映射到 `../career-os/04-作品集/personal-website/`（可选）。需与 `career-os` 同工作区，且仅在 dev / preview 生效；缺该目录时自动跳过，不影响主功能。

## 隐私与开源边界

本仓库是**可复用的求职工作台骨架**。以下内容**不包含在公开仓库**中，请在本地的私有副本维护：

- `content/` 下的 `简历 / 项目成果 / 面试记录 / 项目复盘`（含真实姓名、电话、邮箱、公司研究与面试评价）
- 真实成果卡（EX 卡）与真实公司作战室

公开仓库保留的是：结构、字段规范、方法说明、中性化的示例板块，以及 `import-yuque/架构师储备/` 原始素材暂存区（已去除个人身份标识）。

## 语雀同步（可选）

内容源可在语雀维护，两段式采集：

```bash
# 第 1 段：浏览器内拉 API，落原始 JSON（需 ego-browser 登录态）
~/.local/bin/ego-browser nodejs < scripts/fetch-yuque-raw.mjs

# 第 2 段：lake HTML → Markdown，落 import-yuque/
node scripts/convert-yuque.mjs
```

- 原始 JSON 落 `/tmp/yuque-raw/`；转换产物落 `import-yuque/<库名>/`（带 frontmatter，含语雀原文链接）
- **`import-yuque/` 是暂存区**，不在 `content/` 下、不进工作台数据管道；要上工作台需人工归位到 `content/<PARA>/<板块>/`

## License

[MIT](./LICENSE)
