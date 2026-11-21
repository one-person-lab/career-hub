/**
 * AI 面试教练代理：浏览器只打到 /api/coach，真实端点与 key 留在服务端环境里。
 *
 * 同一个实现两处用：
 *   - 本地开发：vite.config.ts 把 handleCoach 挂进 dev middleware
 *   - 线上：node server/coach-proxy.mjs 起一个只监听 127.0.0.1 的小服务，nginx 反代过来
 *
 * 上游要求 OpenAI 兼容的 POST {base}/chat/completions。
 * 响应形状固定成 { text }，前端 CoachView 负责解析里面的严格 JSON。
 *
 * 注意：线上那台机器的 node 是 16.x，所以这里不用 fetch / AbortSignal.timeout，
 * 走 node:https 原生请求。
 */
import http from 'node:http'
import https from 'node:https'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const TIMEOUT_MS = 120_000
const MAX_BODY = 1_000_000

export function coachConfig(env = process.env) {
  const base = (env.COACH_API_BASE || '').replace(/\/+$/, '')
  return { base, key: env.COACH_API_KEY || '', model: env.COACH_MODEL || '' }
}

/** KEY=VALUE 的 .env，忽略注释与空行；已存在的环境变量优先 */
export function loadEnvFile(file, env = process.env) {
  let raw = ''
  try {
    // 线上用 systemd 的 EnvironmentFile 以 root 读密钥，服务本身跑在非特权用户下，
    // 这时它读不动这个文件属于正常情况：读不到就按纯环境变量走。
    if (existsSync(file)) raw = readFileSync(file, 'utf8')
  } catch {
    return env
  }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const value = m[2].trim().replace(/^["']|["']$/g, '')
    if (env[m[1]] === undefined && value) env[m[1]] = value
  }
  return env
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
      if (raw.length > MAX_BODY) reject(new Error('请求体过大'))
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

/** 原生 https/http POST 一段 JSON，返回 { status, body } */
function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const mod = u.protocol === 'http:' ? http : https
    const req = mod.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'http:' ? 80 : 443),
        path: `${u.pathname}${u.search}`,
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), ...headers },
        timeout: TIMEOUT_MS,
      },
      (up) => {
        let data = ''
        up.setEncoding('utf8')
        up.on('data', (c) => (data += c))
        up.on('end', () => resolve({ status: up.statusCode || 0, body: data }))
      },
    )
    req.on('timeout', () => req.destroy(new Error(`调用上游超过 ${TIMEOUT_MS / 1000} 秒`)))
    req.on('error', reject)
    req.end(body)
  })
}

/**
 * 处理一次教练请求。req/res 是 node 的 IncomingMessage / ServerResponse，
 * Connect middleware 传进来的就是同一种对象，所以本地和线上共用这条路径。
 */
export async function handleCoach(req, res) {
  const { base, key, model } = coachConfig()
  // 前端用 GET 判断这台机器有没有配模型，只回布尔，不回端点与 key
  if (req.method === 'GET' || req.method === 'HEAD') return json(res, 200, { ready: Boolean(base && key && model) })
  if (req.method !== 'POST') return json(res, 405, { error: '只支持 POST' })

  if (!base || !key || !model) {
    return json(res, 501, { error: '未配置面试教练端点。设置 COACH_API_BASE / COACH_API_KEY / COACH_MODEL 后重启。' })
  }

  let payload
  try {
    payload = JSON.parse(await readBody(req))
    if (!Array.isArray(payload.messages) || !payload.messages.length) throw new Error('messages 为空')
  } catch (e) {
    return json(res, 400, { error: e instanceof Error ? e.message : '请求体不是合法 JSON' })
  }

  try {
    const up = await postJson(
      `${base}/chat/completions`,
      { authorization: `Bearer ${key}` },
      JSON.stringify({ model, temperature: 0.6, messages: payload.messages }),
    )
    if (up.status < 200 || up.status >= 300) {
      return json(res, 502, { error: `上游 ${up.status}`, detail: up.body.slice(0, 800) })
    }
    let data
    try {
      data = JSON.parse(up.body)
    } catch {
      return json(res, 502, { error: '上游返回的不是 JSON', detail: up.body.slice(0, 400) })
    }
    return json(res, 200, { text: data.choices?.[0]?.message?.content ?? '' })
  } catch (e) {
    return json(res, 504, { error: e instanceof Error ? e.message : '调用上游失败' })
  }
}

/**
 * 只监听回环地址：公网进不来，只有同机 nginx 能反代到它。
 * 站点没加登录口令，所以这里自带按 IP 的调用配额——不然这个域名就成了别人白嫖 key 的中转。
 * COACH_LIMIT_PER_HOUR=0 关闭。
 */
export function startCoachServer({ port = Number(process.env.COACH_PORT) || 8790, host = '127.0.0.1' } = {}) {
  const perHour = Number(process.env.COACH_LIMIT_PER_HOUR ?? 60)
  const hits = new Map()

  const overLimit = (ip) => {
    if (!perHour) return false
    const now = Date.now()
    const cur = hits.get(ip)
    if (!cur || now - cur.from > 3_600_000) {
      hits.set(ip, { from: now, n: 1 })
      return false
    }
    cur.n += 1
    if (cur.n > perHour) return true
    if (hits.size > 500) for (const [k, v] of hits) if (now - v.from > 3_600_000) hits.delete(k)
    return false
  }

  const server = http.createServer((req, res) => {
    const path = decodeURIComponent((req.url || '/').split('?')[0])
    if (!/^\/(api\/)?coach\/?$/.test(path)) return json(res, 404, { error: 'not found' })
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim()
    if (overLimit(ip)) return json(res, 429, { error: `这个小时调用已满 ${perHour} 次，明天再来` })
    handleCoach(req, res)
  })
  server.listen(port, host, () => {
    console.log(
      `[coach-proxy] http://${host}:${port}/api/coach · 上游 ${coachConfig().base || '未配置'}` +
        ` · 配额 ${perHour ? perHour + ' 次/小时/IP' : '未限'}`,
    )
  })
  return server
}

// 直接 `node server/coach-proxy.mjs` 时自启动（线上 systemd 就这么跑）
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  loadEnvFile(process.env.COACH_ENV || new URL('../.env', import.meta.url).pathname)
  startCoachServer()
}
