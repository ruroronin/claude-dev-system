# create-claude-dev-system

CLI that scaffolds a Claude Code agent system (planner, tester, reviewer) with a memory protocol and optional Linear integration into any codebase.

```bash
npx create-claude-dev-system
```

---

## Why

Claude Code has no memory between sessions. Close the terminal and the next session starts blank — the plan you agreed, the decisions you made, the context you built are gone. `CLAUDE.md` helps, but it's static: it can't tell you where you left off.

It also has no opinion about *how* you work with it. By default it will happily write your entire codebase for you, which is fine until you need to explain that code in an interview, or debug it at 2am.

This tool sets up an opinionated system that fixes both:

- **Persistent memory** — a `docs/STATE.md` file that the reviewer agent keeps current, and a session protocol that reads it on start and updates it on end.
- **Build Mode** — the agent guides, explains, and reviews; **you** write the code. It calls you out if you start leaning on it as a crutch.
- **Three specialised agents** — planner, tester, reviewer, each with a defined scope and tool access.
- **A knowledge base that teaches** — the reviewer documents not just what the project does, but the concepts behind it, so the docs make you better rather than just recording decisions.

---

## Quick start

In the root of any project:

```bash
npx create-claude-dev-system
```

Answer a short interview, then:

```bash
claude
```

Say **"finish setup"** and Claude walks you through the remaining fields. A `SessionStart` hook has already told it what's missing, so those two words are all the context it needs.

---

## What it installs

```bash
your-project/
├── CLAUDE.md                     # operating instructions for the main agent
├── FINISH_SETUP.md               # manual fallback if hooks are disabled
├── .claude/
│   ├── settings.json             # SessionStart hook registration
│   ├── hooks/
│   │   └── check-setup.js        # self-silencing setup reminder
│   └── agents/
│       ├── planner.md
│       ├── tester.md
│       └── reviewer.md
└── docs/
    ├── STATE.md                  # the memory file — read at session start
    ├── knowledge-base/           # didactic guides, grows over time
    │   └── concepts/
    └── notebooklm/               # self-contained exports for NotebookLM
```

---

## Commands

The generated system is driven by a small set of phrases:

| Command | What happens |
| --- | --- |
| `start session` | Timestamp, read `docs/STATE.md`, orient |
| `pause session` | Log a row for time worked — for breaks, not stopping points |
| `resume session` | New log row, continue where you paused |
| `end session` | Log the row, run the reviewer in the background |
| `finish setup` | Fill the stack and environment sections |
| `finish planning` | File the agreed plan, then offer any remaining setup sections |
| `run the reviewer` | Review and document on demand |

Nothing runs implicitly — the planner and reviewer are invoked, never self-starting.

---

## The interview

| Question | Why it's asked |
| --- | --- |
| Project name & description | Fills the generated files |
| Project type | product / library / portfolio — sets the tone of the agents |
| Stack | Anchors the stack-specific guidance section |
| Model strategy | Which model each agent runs on (see below) |
| PM integration | Whether to wire the planner to Linear |
| Linear MCP server name | Defaults to `linear-server`; must match your `claude mcp add` name |
| Repo structure | monorepo / standalone / multi-repo |
| Commit the agent files? | If no, they're added to `.gitignore` |

### Model strategy

| Preset | planner | tester | reviewer |
| --- | --- | --- | --- |
| **Balanced** (default) | opus | sonnet | opus |
| **Budget** | sonnet | sonnet | sonnet |
| **Max** | fable | sonnet | fable |
| **Custom** | pick each individually | | |

Model **aliases** are written into the agent files rather than pinned version IDs, so they resolve to the current model in each tier and don't go stale. Note that `fable` may be plan-gated depending on your account.

This sets the model for the three subagents only — your main session's model is your own Claude Code setting.

---

## Finishing setup

Some sections of `CLAUDE.md` are deliberately left as `{{TODO}}` markers. They're better decided by thinking than by a prompt, and they arrive in two stages.

**Stage 1 — answerable immediately.** Say `finish setup`.

- **7. Stack guidance** — teaching analogies, footguns, idioms
- **8. Environment** — local services, how to run and test

**Stage 2 — derived from planning.** These can't be written before there's a plan, so they're never asked for upfront.

- **9. Scope** — what's in, what's explicitly excluded
- **10. Critical path** — where a silent failure hurts most
- **11. Review lenses** — what the reviewer should always check for

When you say `finish planning`, Claude offers these if any remain. Declining is free — it asks again next time, so stopping halfway loses nothing. Telling Claude never to ask again creates an empty `.claude/.setup-optout` file and stops the offer permanently; delete it to re-enable.

You author the content; the agent guides and challenges. A section is done when its marker and explanatory comment are gone.

### How the reminder works

A `SessionStart` hook checks `CLAUDE.md` and passes a note into Claude's context describing what's unfilled and which stage it belongs to. **You won't see anything printed** — hook output goes to Claude, not your terminal. That's why `finish setup` works without you explaining anything.

Once every section is filled, the check finds nothing, prints nothing, and the hook is a silent no-op. It never modifies itself and doesn't need removing.

---

## Running on an existing project

If the tool finds an agent system already installed — it looks for `CLAUDE.md`, `.claude/agents/`, and `docs/STATE.md` — it stops before the interview and asks what to do:

| Choice | Behaviour |
| --- | --- |
| **Cancel** (default) | Nothing is written. Hitting enter is safe. |
| **Keep existing** | Only writes files that don't already exist. Useful for adding missing pieces without touching what's there. |
| **Overwrite** | Replaces everything. Existing content is lost. |

The check happens *before* the interview, so you're never asked eight questions only to discover your files are at risk.

To skip the prompt entirely — for scripted or CI use — pass `--force`, which overwrites without asking:

```bash
npx create-claude-dev-system --force
```

---

## The three agents

| Agent | When it runs | What it does |
| --- | --- | --- |
| **planner** | After you and the main agent agree to a plan | Files the agreed plan as structured work items. Doesn't design plans — that's a conversation with the main agent. |
| **tester** | After a feature is implemented | Writes non-critical and boilerplate tests. Critical-path tests are yours to write. |
| **reviewer** | After features, decisions, and at session end | Reviews your code, flags issues by priority, quizzes your understanding, and is the **sole writer** of everything under `docs/`. |

### Why planning isn't a subagent

Subagents run in isolation and can't hold a conversation — they take a prompt and return a result. Planning is worth doing *with* you, so it happens in the main conversation: you draft the acceptance criteria and interfaces, the agent challenges and refines them. The planner subagent only files the result.

That's deliberate. Writing your own definition of done up front is what makes an unfinished feature visible, and it's a great habit to have.

---

## Linear integration (optional)

If enabled, the planner gets two modes:

- **File** — turns an agreed plan into Linear issues (Project = epic, Issue = story, sub-issue = task) with your acceptance criteria reproduced verbatim. Gated on your approval.
- **Reconcile** — diffs Linear against `docs/STATE.md` and syncs status. `STATE.md` is the source of truth; Linear conforms to it.

**You must connect the MCP server yourself** — the tool only writes the config that references it:

```bash
claude mcp add --transport http linear-server https://mcp.linear.app/mcp
```

Then authenticate with `/mcp` inside a session. The server name you use here must match what you entered during the system configuration prompts.

---

## Caveats

**Tool names vary by Claude Code version.** The generated agents declare tools like `Read, Grep, Glob`. If your version exposes these differently (some bundle file search under a single tool), edit the `tools:` line in the generated agent files. An agent with fewer tools listed still works — the system prompt drives the behaviour.

**Hooks must be enabled.** The setup reminder is a `SessionStart` hook. If hooks are disabled in your config, nothing breaks — just open `FINISH_SETUP.md` and run `claude` with "finish setup".

**The reminder isn't visible.** `SessionStart` hook output is injected as context for Claude, not printed to your terminal. Seeing nothing on launch is expected — Claude has the context even though you can't see it.

**Existing installations are detected.** If the target already has `CLAUDE.md`, `.claude/agents/`, or `docs/STATE.md`, the tool stops and asks before writing anything — see *Running on an existing project* above. Pass `--force` to skip the check and overwrite.

---

## Requirements

- Node.js 18+
- [Claude Code](https://claude.com/claude-code)
- A Linear account, only if you enable PM integration

---

## Development

```bash
npm install
npm run build      
npm run dev        
npm link           
```

---

## Licence

MIT
