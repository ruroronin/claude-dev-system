#!/usr/bin/env node
// SessionStart hook (matcher: startup)
// Prints setup guidance to stdout ONLY while CLAUDE.md has unfilled sections.
// Claude Code injects SessionStart stdout as session context - Claude sees this,
// the user does not. Silent once everything is filled, or if the user opted out.
// Self-cleaning by check; it never edits itself.

const fs = require("fs");
const path = require("path");

const claudeDir = path.join(__dirname, "..");
const claudeMd = path.join(claudeDir, "..", "CLAUDE.md");
const optOutFile = path.join(claudeDir, ".setup-optout");

// Section numbers matching the CLAUDE.md template.
const STAGE_1 = ["7", "8"];        // stack guidance, environment
const STAGE_2 = ["9", "10", "11"]; // scope, critical path, review lenses

const MARKER = "{{" + "TODO" + "}}";

function sectionsWithTodo(content) {
  const blocks = content.split(/^## (\d+)\./m);
  const unfilled = [];
  for (let i = 1; i < blocks.length; i += 2) {
    const num = blocks[i];
    const body = blocks[i + 1] || "";
    if (body.includes(MARKER)) unfilled.push(num);
  }
  return unfilled;
}

try {
  // Opt-out is a marker FILE, not a string in CLAUDE.md. A string check would
  // match the documentation describing it, which silently disabled the hook.
  if (fs.existsSync(optOutFile)) process.exit(0);

  const content = fs.readFileSync(claudeMd, "utf-8");

  const unfilled = sectionsWithTodo(content);
  if (unfilled.length === 0) process.exit(0);

  const stage1 = unfilled.filter(n => STAGE_1.includes(n));
  const stage2 = unfilled.filter(n => STAGE_2.includes(n));

  const lines = ["SETUP STATE: CLAUDE.md has unfilled sections.", ""];

  if (stage1.length > 0) {
    lines.push(
      "Stage 1 (sections " + stage1.join(", ") + ") is answerable right now.",
      "If the user says \"finish setup\", walk them through these. They are stack",
      "guidance and environment - both fillable without a plan, and the agents get",
      "noticeably better once they exist. Mention this is available.",
      ""
    );
  }

  if (stage2.length > 0) {
    lines.push(
      "Stage 2 (sections " + stage2.join(", ") + ") derives from planning and cannot be",
      "answered before a planning session. Do NOT ask for these upfront.",
      "Offer them when the user says \"finish planning\", after the plan is filed.",
      ""
    );
  }

  lines.push(
    "When filling a section: the USER authors the content (Build Mode - guide and",
    "challenge, do not write it for them). Then replace its " + MARKER + " marker with",
    "the content and remove the explanatory comment above it.",
    "",
    "If the user asks never to be prompted again, create an empty file at",
    ".claude/.setup-optout and confirm you have done so. This hook then stays silent",
    "permanently.",
    "",
    "If their first message is about something else, mention this briefly, then help",
    "with what they asked."
  );

  console.log(lines.join("\n"));
} catch (err) {
  console.error("check-setup hook: " + err.message);
}

process.exit(0);