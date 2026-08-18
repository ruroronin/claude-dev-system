#!/usr/bin/env node
// SessionStart hook
// Prints setup instructions to stdout ONLY while CLAUDE.md contains {{TODO}} markers.
// Claude Code injects SessionStart stdout as session context, so Claude sees this
// but the user does not. Once the markers are filled, this prints nothing and the
// hook becomes a silent no-op. Self-cleaning by check - it never edits itself.

const fs = require("fs");
const path = require("path");

const claudeMd = path.join(__dirname, "..", "..", "CLAUDE.md");

const lines = [
  "SETUP INCOMPLETE: CLAUDE.md still contains {{TODO}} markers.",
  "",
  "Sections 5-9 of CLAUDE.md (scope, critical path, review lenses, stack guidance,",
  "environment) have not been filled in yet. They are meant to be authored through",
  "discussion, not generated.",
  "",
  "If the user says \"finish setup\", walk them through it section by section:",
  "- Discuss each {{TODO}} section with the user.",
  "- The USER authors the content. This is Build Mode: guide and challenge, do not",
  "  write it for them.",
  "- Once a section is agreed, replace its {{TODO}} marker with the content and",
  "  remove the explanatory <!-- --> comment above it.",
  "",
  "Setup is complete when no {{TODO}} markers remain in CLAUDE.md. This reminder",
  "stops appearing on its own at that point.",
  "",
  "If the user's first message is about something else, mention briefly that setup",
  "is unfinished, then help with what they asked."
];

try {
  const content = fs.readFileSync(claudeMd, "utf-8");
  if (content.includes("{{TODO}}")) {
    console.log(lines.join("\n"));
  }
} catch (err) {
  // No CLAUDE.md or unreadable. Log to stderr (debug log only) and exit quietly.
  console.error("check-setup hook: " + err.message);
}

process.exit(0);