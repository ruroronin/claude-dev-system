# Getting started

This project has a Claude Code agent system installed — three subagents, a persistent
memory file, and a session protocol. This page is the local reference for how to drive it.

---

## Commands

Say these to Claude in this project.

| Command | What happens |
| --- | --- |
| `start session` | Timestamps, reads `docs/STATE.md`, orients on where you left off |
| `pause session` | Logs a row for the time worked. Use for lunch or an interruption |
| `resume session` | Starts a new log row and picks up where you paused |
| `end session` | Logs the row, then runs the reviewer in the background |
| `finish setup` | Fills the stack and environment sections of `CLAUDE.md` |
| `finish planning` | Files the plan you just agreed, then offers any remaining setup sections |
| `run the reviewer` | Reviews your code and updates the docs, on demand |

---

## Finishing setup

A few sections of `CLAUDE.md` are left as `{{TODO}}` markers. They're meant to be
authored by you through discussion — a script can't decide them, and neither should the
agent. They come in two stages.

### Stage 1 — fillable now

Say **`finish setup`**.

- **§7 Stack guidance** — teaching analogies, footguns, and idioms for your stack
- **§8 Environment** — local services, how to run and test, path quirks

Both are answerable immediately, and the agents get noticeably sharper once they exist:
the reviewer knows what to watch for, and explanations get framed in terms you already know.

### Stage 2 — after your first planning session

These derive from having a plan, so they can't be written before one:

- **§9 Scope** — what's in, what's explicitly excluded
- **§10 Critical path** — where a silent failure hurts most
- **§11 Review lenses** — what the reviewer should always check for in this project

When you say `finish planning`, Claude offers these if they're still empty. Say no and
it moves on, and asks again next time — so stopping halfway costs nothing.

To stop being asked entirely, tell Claude you never want to be prompted again — it
creates an empty `.claude/.setup-optout` file and the reminder stays silent for good.
Delete that file if you change your mind.

---

## How the reminder works

A `SessionStart` hook checks `CLAUDE.md` for unfilled sections and passes a note into
Claude's context. You won't see anything printed — the output goes to Claude, not your
terminal — which is why `finish setup` works without explaining yourself.

Once every section is filled the check finds nothing and the hook goes quiet on its own.
If hooks are disabled in your Claude Code config, nothing breaks; this page is the manual
equivalent.

---

## How the work actually flows

**You write the code.** The agents guide, review, and document — they don't build it for
you. When planning, you draft the acceptance criteria and the interfaces yourself and
Claude challenges them. That's deliberate: writing your own definition of done is what
makes an unfinished feature visible.

**Memory lives in files.** `docs/STATE.md` is the operational memory, read at the start of
every session and written only by the reviewer. `SESSION_LOG.md` tracks working time.

You can delete this file once you're comfortable with the workflow.