#!/bin/bash
# check-setup.sh — SessionStart hook (matcher: startup)
#
# Injects a "finish setup" instruction into the session ONLY while CLAUDE.md
# still contains {{TODO}} markers (scope, critical path, stack guidance).
# Once those are filled, grep matches nothing, this echoes nothing, and the
# hook becomes a silent no-op. Self-cleaning by grep — it never edits itself.
#
# stdout from a SessionStart hook is injected as context for the session.

set -euo pipefail

CLAUDE_MD="${CLAUDE_PROJECT_DIR:-.}/CLAUDE.md"

if grep -q "{{TODO}}" "$CLAUDE_MD" 2>/dev/null; then
  cat <<'EOF'
SETUP INCOMPLETE — CLAUDE.md still contains {{TODO}} markers.

Before doing other work, walk the user through finishing setup:
- Sections 5–9 of CLAUDE.md (scope, critical path, review lenses, stack guidance)
  still need to be filled by discussion.
- For each {{TODO}}: discuss it with the user, have THEM author the content
  (this is Build Mode — guide, don't write it for them), then replace the
  {{TODO}} marker with the agreed content and remove its explanatory <!-- --> comment.
- Setup is complete when no {{TODO}} markers remain in CLAUDE.md. At that point
  this reminder stops appearing automatically.

Start by asking the user if they'd like to finish setup now.
EOF
fi

exit 0