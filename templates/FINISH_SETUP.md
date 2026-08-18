# Finish Setup

This project was scaffolded with `create-claude-dev-system`. The agent system is installed, but a few **thinking** fields in `CLAUDE.md` were intentionally left as `{{TODO}}` markers — they're best filled by discussion, not by a script.

## What's left to do

Open `claude` in this directory and say **"finish setup"**. The main agent will walk you through, section by section:

- **§5 Scope** — what's in scope for the current phase, and what's explicitly excluded.
- **§6 Critical path** — the areas where a silent failure is worst (the tests you write yourself).
- **§7 Project-specific review lenses** — what the reviewer should always check for in this project.
- **§8 Stack-specific guidance** — teaching analogies, footguns, and idioms for this stack.

For each, **you** author the content (Build Mode — the agent guides, it doesn't write it for you). Once a section is filled, its `{{TODO}}` marker and explanatory comment are removed.

## When is setup done?

When no `{{TODO}}` markers remain in `CLAUDE.md`. A SessionStart hook reminds you automatically while any remain; it goes silent once they're gone.

(If the reminder isn't firing — hooks may be disabled in your Claude Code config — this file is the manual fallback. Just run `claude` and say "finish setup".)

You can delete this file once setup is complete.