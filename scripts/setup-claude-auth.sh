#!/usr/bin/env bash
# Wire Hermes to your Claude Code / Claude Pro/Max account for dashboard AI.
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

echo "=== Hermes + Claude Code auth setup ==="

if [[ -f "${HOME}/.claude/.credentials.json" ]]; then
  echo "✓ Claude Code credentials found at ~/.claude/.credentials.json"
  hermes auth reset anthropic 2>/dev/null || true
  if hermes auth status anthropic 2>&1 | grep -q 'logged in'; then
    echo "✓ Hermes is using your Claude Code login (no browser step needed)."
    hermes auth list anthropic 2>/dev/null || hermes auth list 2>/dev/null | head -20
    exit 0
  fi
fi

echo ""
echo "No active Claude login in Hermes. Starting OAuth (browser)..."
echo "After you authorize, paste the code Hermes prints."
echo ""
hermes auth add anthropic --type oauth
