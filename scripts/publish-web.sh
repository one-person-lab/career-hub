#!/usr/bin/env bash
# 上线 career.buildhub.cn：本机 build（content/ 与 content.private/ 合并）→ 推静态产物 → 重启面试教练代理。
#
# 单向：这台 Mac 是唯一事实源，服务器那份只是快照，不在那边改内容。
# 密钥不在这条链路上：/opt/career-hub/.env 只在服务器本地，脚本只推代码。
#
#   bash scripts/publish-web.sh                 # 构建 + 推静态 + 重启代理
#   bash scripts/publish-web.sh --skip-build    # 复用现有 dist
#   bash scripts/publish-web.sh --no-coach      # 只推静态
#   bash scripts/publish-web.sh --show          # 只构建并上线演示产物（自检不过就停）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${WEB_HOST:-smzs-server}"
WEB="${WEB_ROOT:-/www/wwwroot/career.buildhub.cn}"
APP="${WEB_APP:-/opt/career-hub}"

SKIP_BUILD=0
NO_COACH=0
SHOW_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1; shift ;;
    --no-coach) NO_COACH=1; shift ;;
    --show) SHOW_ONLY=1; shift ;;
    *) echo "未知参数：$1" >&2; exit 2 ;;
  esac
done

cd "$ROOT"
[[ -d content.private ]] || echo "[publish] 注意：没有 content.private/，这次上线的是公开示例内容"

if [[ "$SKIP_BUILD" == 0 && "$SHOW_ONLY" == 0 ]]; then
  echo "[publish] 构建"
  npm run build >/dev/null
fi

# 演示产物：只推 dist-show，跳过 coach 代理；自检不过就不推
if [[ "$SHOW_ONLY" == 1 ]]; then
  SHOW_ROOT="${WEB_SHOW_ROOT:-/www/wwwroot/show.buildhub.cn}"
  if [[ "$SKIP_BUILD" == 0 ]]; then
    echo "[publish] 构建演示产物"
    npm run build:show >/dev/null
  fi
  echo "[check] 演示包自检"
  node scripts/check-show.mjs --dist
  echo "[publish] dist-show → $HOST:$SHOW_ROOT"
  rsync -az --delete dist-show/ "$HOST:$SHOW_ROOT/"
  ssh "$HOST" "chown -R www:www $SHOW_ROOT && find $SHOW_ROOT -type d -exec chmod 755 {} + && find $SHOW_ROOT -type f -exec chmod 644 {} +"
  echo "[publish] 完成（演示，不重启 coach 代理）"
  exit 0
fi

if [[ "$SKIP_BUILD" == 0 ]]; then
  echo "[publish] 演示包自检"
  npm run check:show --silent
fi

echo "[publish] dist → $HOST:$WEB"
rsync -az --delete --exclude '.well-known/' dist/ "$HOST:$WEB/"
ssh "$HOST" "chown -R www:www $WEB && find $WEB -type d -exec chmod 755 {} + && find $WEB -type f -exec chmod 644 {} +"

if [[ "$NO_COACH" == 0 ]]; then
  echo "[publish] coach 代理 → $HOST:$APP"
  ssh "$HOST" "mkdir -p $APP"
  rsync -az "$ROOT/server/coach-proxy.mjs" "$HOST:$APP/coach-proxy.mjs"
  if ssh "$HOST" "test -f /etc/systemd/system/career-coach.service"; then
    ssh "$HOST" "systemctl restart career-coach && sleep 1 && systemctl is-active career-coach"
  else
    echo "[publish] career-coach.service 还没装，代理没重启（首次上线见 server/nginx/ 与 server/*.service 里的路径）"
  fi
fi

echo "[publish] 完成 → https://career.buildhub.cn"
