import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin, type Connect } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { handleCoach } from './server/coach-proxy.mjs'

/**
 * 只读映射：把 /portfolio/* 指向 ../career-os/04-作品集/personal-website/
 * 这样作品集站不必复制进本仓库，career-os 仍是唯一真源。
 * 可选：缺该目录时自动跳过，不影响主功能；只在 dev / preview 生效。
 */
const PORTFOLIO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../career-os/04-作品集/personal-website',
)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function portfolioStatic(): Plugin {
  const handler = (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    const rel = urlPath.replace(/^\/+/, '') || 'index.html'
    const filePath = path.join(PORTFOLIO_ROOT, rel)
    if (!filePath.startsWith(PORTFOLIO_ROOT)) return next()
    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) return next()
      res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
      fs.createReadStream(filePath).pipe(res)
    })
  }
  return {
    name: 'career-os-portfolio-static',
    configureServer(server) {
      server.middlewares.use('/portfolio', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/portfolio', handler)
    },
  }
}

/**
 * AI 面试教练代理：真实实现放在 server/coach-proxy.mjs，
 * 线上 systemd 跑同一个文件，本地 dev 挂进 middleware —— 只有一份密钥处理逻辑。
 */
function coachApi(): Plugin {
  return {
    name: 'career-coach-proxy',
    configureServer(server) {
      server.middlewares.use('/api/coach', handleCoach as unknown as Connect.NextHandleFunction)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env 里的 COACH_* 不会自动进 process.env，这里手动搬一次
  const HERE = path.dirname(fileURLToPath(import.meta.url))
  Object.assign(process.env, loadEnv(mode, HERE, ''))

  // 演示产物：独立入口 + 独立目录。私有视图（管道 / 训练室 / 知识卡）不进依赖图，
  // generated.json 也不进 —— 隔离发生在构建层，不靠前端隐藏。
  const show = mode === 'show'

  return {
    plugins: [vue(), portfolioStatic(), coachApi()],
    server: { port: 5175, open: show ? '/show.html' : undefined },
    build: {
      outDir: show ? 'dist-show' : 'dist',
      // 产物入口仍叫 show.html（不是 index.html）：本机共享屏幕直接开它；
      // 若要挂子域名根路径，在 vhost 里给 / 兜底到 /show.html，不改构建
      rollupOptions: { input: path.resolve(HERE, show ? 'show.html' : 'index.html') },
    },
  }
})
