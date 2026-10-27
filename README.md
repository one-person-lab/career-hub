# 职业工作台（career-hub）

一套**冲刺型**的个人求职工作台：把「我做过什么 / 我会什么 / 我怎么讲」三件事，从一堆散落的文档里抽成可一秒调取的卡片，再加一条能推进的投递管道和一间能练的面试训练室。界面核心是「面试前几分钟翻到要看的那个答案」，不是文档导航。

视觉沿用 **Linear 暗色设计语言**：窄左导航 + 顶栏 + 行式列表（`.row`）而不是统计卡墙，配色与尺寸全部收在 `src/style.css` 的 `@theme` 令牌里。

> 另两个工作台（`media-hub` 运营推广、`product-hub` 产品）仍是 Neo-Brutalism 令牌；本仓已单独换成 Linear 暗色，两边令牌暂不共享。

## 定位：和另两个工作台不是同一种东西

| | 媒体 / 产品工作台 | 职业工作台 |
|---|---|---|
| 类型 | 长期建设型 | **冲刺型** |
| 价值曲线 | 每天用，越用越值钱 | 峰值集中在求职与面试周期 |
| 界面核心 | 浏览 + 讲解 | **一秒抽到该用的弹药** |

**这个区别决定了设计。** 所以这里的主线是「今天该做什么 → 岗位推到哪 → 练一场 → 弹药在哪」，不是「一个目录一个板块，点开看文档」。

## 四条设计原则

1. **成果库是唯一事实源。** 简历、故事库、自我介绍、作品集全部是派生视图。改一条成果卡，四处同时更新。
2. **每个项目、每个知识点都要有图。** 不是装饰——是「你能不能在白板上画出来」的检验，也是回忆时的第二条通路（双重编码）。
3. **覆盖缺口和复习节奏要算得出来。** 岗位要求 × 我的证据 = 缺哪块；超过 21 天没碰的知识点自动进「该复习了」。
4. **训练要有闭环。** 出题 → 作答 → 评分与改进 → 顺着答案追问。只把面试题排成表格，等于没准备。

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

工作台五页是内置视图，其余板块由 `content/` 目录自动推导：

| 分组 | 板块 | 实现 |
|------|------|------|
| **工作台** | 首页 | `HomeView.vue`（内置，只回答「我现在最该做什么」） |
| | 岗位与面试 | `PipelineView.vue`（内置，阶段分组表格 + 看板 + 详情栏） |
| | AI 训练室 | `CoachView.vue`（内置，出题 → 作答 → 评分 → 追问） |
| | 项目与经历 | `EvidenceView.vue`（内置，左列表 / 右详情） |
| | 知识与薄弱项 | `KnowledgeView.vue`（内置，左目录 / 中正文 / 右关联） |
| **进行中** | 公司作战室 | 通用板块 `DocView.vue` |
| **长期资产** | 职业定位 / 目标岗位 | 通用板块 |
| **参考** | 技术笔记 / 面试问答 / 使用说明 / 决策日志 | 通用板块 |

键盘：`1`–`5` 直跳工作台五页，`⌘K` / `/` 打开跳转面板，`Esc` 关闭。

## 数据层

```
content/<PARA>/<板块>/*.md   ─┐
content/10-Areas/知识点/K-*.md ├→ scripts/build-data.mjs → src/data/generated.json → src/data/store.ts → 视图
content/00-Projects/岗位管道.md ├┘   （该 md 的第一张表格 → pipeline[]）
content.private/**（同名覆盖） ─┘
../career-os/**（可选，只读盘点） ─┘
```

**这是唯一的接缝。** 调整内容 = 改 md，视图层零改动。`build-data.mjs` 递归扫描 `content/`，由 PARA 顶层目录推导分组。

- `content/<PARA>/<目录>/` —— 一个目录 = 一个板块
- `K-*.md` —— 知识卡，由 build-data 解析成结构化字段（trade-off / 数字 / 追问链 / 项目锚点 / 图）
- `EX-*.md` —— 成果卡，同理解析（影响表 / 图 / 可复用场景）
- `_` 开头的 md 被跳过（放模板和说明）
- `content.private/` —— **私有覆盖层**（整目录 gitignored）。按 PARA 同构放真实内容，同名文件盖住 `content/` 那一份；`content.private/.hidden` 里按相对路径列出的公开文件（示例卡、示例公司）直接不上线。这样「公开骨架 + 私有真实内容」共用同一条管道，仓里永远不带 PII
- `../career-os/` —— **可选**只读扫描，只统计「旧库还剩多少篇」，不导入正文；不存在时自动跳过
- 管道与卡片靠 `EX-001` / `K-004` 这样的编号互相引用，视图做正反两向反查

### 怎么新增一个板块

```bash
mkdir -p content/20-Resources/增长实验
# 写一个 md，正文用 ## 分节
npm run gen:data
```

未登记但有内容的目录会按所在 PARA 层自动归组。想控制位置、图标、色块，在 `scripts/build-data.mjs` 的 `SECTION_DEFS` 里加一行；`icon` 取值需在 `src/data/store.ts` 的 `SECTION_ICONS` 登记。

### 岗位管道表 `content/00-Projects/岗位管道.md`

这个 md **不在板块目录里**，它是管道数据源：build-data 取文件中第一张 markdown 表格输出 `pipeline[]`。列名固定：

| 列 | 取值 |
|----|------|
| 公司 / 岗位 | 自由文本 |
| 阶段 | `待投 / 已投 / 笔试测评 / 一面 / 二面 / 三面 / HR面 / Offer / 暂停 / 已结束`，写错会落到「待投」并标出未识别 |
| 投递日期 | `YYYY-MM-DD`，用来算「投出去几天没回音」 |
| 下一轮时间 | `MM-DD HH:mm` 或 `YYYY-MM-DD`；留空的行不进首页的近期面试 |
| 下一步 | 一句可执行的动作 |
| 准备度 | `高 / 中 / 低` |
| 关联成果 / 关联知识 | `EX-` `K-` 编号，空格分隔 |

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

### 接一个模型给训练室（可选）

```bash
cp .env.example .env   # 填 COACH_API_BASE / COACH_API_KEY / COACH_MODEL（OpenAI 兼容端点）
```

代理逻辑只有一份，在 `server/coach-proxy.mjs`：本地由 `vite.config.ts` 挂成 dev middleware，线上由 systemd 跑成独立小服务。浏览器只打到 `/api/coach`，key 永远留在服务端。没配置时接口返回 501，训练室自动退到「自评」路径，练习流程照跑。

> `vite.config.ts` 的 `portfolioStatic()` 把 `/portfolio/*` 映射到 `../career-os/04-作品集/personal-website/`（可选）。需与 `career-os` 同工作区，且仅在 dev / preview 生效；缺该目录时自动跳过，不影响主功能。

## 面试演示模式

平时用工作台备考，面试时只给人看你自己决定展示的东西。这是一条独立的产物链，不是主站上的一个「隐藏」开关。

数据源不变，仍读 `content/项目成果/EX-*.md`，不另建一套内容。卡上三个字段决定它能不能被看到：

| frontmatter | 作用 |
|------|------|
| `演示: 是` | 这张卡才进演示包；不写就不进 |
| `演示隐藏: 复盘` | 按 `## 段名` 删段，段里的图一起删 |
| `演示链接: https://…` | 变成演示页右上角的「打开现场演示」按钮 |

```bash
npm run dev:demo     # 本地全屏演示，面试前自己排练（方向键切卡）
npm run build:demo   # 出 dist-demo/，构建完自动跑数据层自检
npm run check:demo -- --dist   # 连产物一起扫（见下）
```

隔离做在构建层：演示页只 import `generated.demo.json`，主站的私有视图（管道 / 训练室 / 知识卡）和全量 `generated.json` 根本不进那个包的依赖图。为了让这条链真的断掉，块渲染层拆到了 `src/data/types.ts`——只引它，不引 `store.ts`。

自检分两层，都由 `scripts/check-demo.mjs` 出：数据层比对投影（越权发布、漏发布、内部字段、隐藏段、图的残留与丢失）；产物层从全量数据**现算**一批私有指纹（未发布的卡名、知识卡标题与数字、管道公司名与下一步、板块与文档标题），到 `dist-demo` 的每个文件里搜，命中即失败，另外还查 `content.private` 路径与 `/api/coach` 调用。指纹不是手写黑名单，加内容不用改脚本。

> 演示产物入口文件叫 `demo.html`（不是 `index.html`）。本机共享屏幕直接开它；要挂子域名根路径，在 vhost 里给 `/` 兜底到 `/demo.html`，不改构建。

## 上线到 career.buildhub.cn

```bash
bash scripts/publish-web.sh              # 构建（含 content.private）→ 自检 → 推静态 → 重启教练代理
bash scripts/publish-web.sh --skip-build # 复用现有 dist
bash scripts/publish-web.sh --demo       # 只上线演示产物到 demo 目录，自检不过就停，不碰代理
```

方向只有一个：这台机器 → 服务器。服务器上不存放内容源，也不在那边改。

| 位置 | 是什么 |
|------|--------|
| `smzs-server:/www/wwwroot/career.buildhub.cn` | dist 静态产物，nginx 直接服务，SPA 回退 `/index.html` |
| `/www/server/panel/vhost/nginx/career.buildhub.cn.conf` | vhost，模板在 `server/nginx/`：443 + `noindex` 头 + `/api/coach` 反代到 8790 |
| `/root/.acme.sh/career.buildhub.cn_ecc` | Let's Encrypt ECC 证书（webroot 签发），`--install-cert` 装进面板证书目录；服务器上已有的 `acme.sh --cron` 每日任务负责续期并 reload |
| `/opt/career-hub/` | `coach-proxy.mjs` + `.env`（root 600），systemd unit 模板 `server/career-coach.service`；`EnvironmentFile` 以 root 读密钥，进程本身跑在 `www` 下 |

站点按「知道域名才访问」的定位**没有设登录口令**，所以配套做了两件事：整站 `noindex` + `robots.txt` 禁止抓取；`/api/coach` 自带按 IP 的调用配额（`COACH_LIMIT_PER_HOUR`，默认 60 次/小时/IP），免得这个域名变成别人白嫖 key 的中转。真实内容上线后链接外传即等于泄露——要收紧就在 vhost 的 443 server 里补 `auth_basic`，同族工作台用的 `/etc/nginx-auth/htpasswd_workbench` 可以直接复用。

## 隐私与开源边界

本仓库是**可复用的求职工作台骨架**。以下内容**不包含在公开仓库**中，请在本地的私有副本维护：

- `content.private/` 下的真实 `简历 / 面试记录 / 项目复盘 / 公司作战室`（含真实姓名、电话、邮箱、公司研究与面试评价）——整目录 gitignored，靠同名覆盖进构建产物
- 真实成果卡（EX 卡）与知识卡（K 卡）
- `.env`（训练室的模型端点与 key，已被 gitignore）；线上那份在服务器 `/opt/career-hub/.env`，同样不进前端产物

仓库里带的 `EX-900` / `K-900` / `示例公司*` 都是**虚构示例卡**，只为把版式和交叉引用跑通，整篇替换掉即可；上线时用 `content.private/.hidden` 把它们剔掉。训练记录只写进浏览器 `localStorage`，不落盘、不入库。

> `career.buildhub.cn` 上跑的是**含真实内容的那一份**（`content.private/` 参与构建），且当前没有登录口令。它靠「域名不公开 + 全站禁止抓取」保护，链接一旦外传就等于把内容发给了对方——按需收紧，vhost 补 `auth_basic` 即可。

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
