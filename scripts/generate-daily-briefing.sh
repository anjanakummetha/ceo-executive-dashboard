#!/usr/bin/env bash
# Run at 4:45 AM Mountain Time via cron (does NOT send email).
# Example crontab (adjust path):
# 45 4 * * * TZ=America/Denver /path/to/CEO_Executive_Dashboard--main/scripts/generate-daily-briefing.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${DASHBOARD_PORT:-3000}"
URL="${BRIEFING_GENERATE_URL:-http://127.0.0.1:${PORT}/api/hermes/briefing}"

curl -sf -X POST "$URL" -H 'Content-Type: application/json' | tee "$ROOT/data/last-briefing-run.json"
echo ""
echo "[briefing] Generated at $(date) — email not sent"
