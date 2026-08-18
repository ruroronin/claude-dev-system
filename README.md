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

Answer a short interview, and the system is installed. Then:

```bash
claude
```

A `SessionStart` hook detects the setup isn't finished and walks you through the remaining fields.

---

## What it installs

```bash
your-project/
├── CLAUDE.md                     # operating instructions for the main agent
├── FINISH_SETUP.md               # manual fallback if hooks are disabled
├── .claude/
│   ├── settings.json             # SessionStart hook registration
│   ├── hooks/
│   │   └── check-setup.sh        # self-silencing setup reminder
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

---

## Finishing setup

Some fields are deliberately **not** filled by the script — they're better decided by thinking than by a prompt. They're left as `{{TODO}}` markers in `CLAUDE.md`:

- **5. Scope** — what's in, what's explicitly excluded
- **6. Critical path** — where a silent failure hurts most
- **7. Review lenses** — what the reviewer should always check for
- **8. Stack guidance** — teaching analogies, footguns, idioms

Run `claude` and the hook prompts you to fill these through discussion. You author the content; the agent guides. Setup is complete when no `{{TODO}}` markers remain — at which point the hook goes silent on its own.

---

## The three agents

| Agent | When it runs | What it does |
| --- | --- | --- |
| **planner** | After you and the main agent agree to a plan | Files the agreed plan as structured work items. Doesn't design plans — that's a conversation with the main agent. |
| **tester** | After a feature is implemented | Writes non-critical and boilerplate tests. Critical-path tests are yours to write. |
| **reviewer** | After features, decisions, and at session end | Reviews your code, flags issues by priority, quizzes your understanding, and is the **sole writer** of everything under `docs/`. |

### Why planning isn't a subagent

Subagents run in isolation and can't hold a conversation — they take a prompt and return a result. Planning is worth doing *with* you, so it happens in the main conversation: you draft the acceptance criteria and interfaces, the agent challenges and refines them. The planner subagent only files the result.

That's deliberate. Writing your own acceptance criteria up front is the habit that makes you think and a better developer.

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

**Windows.** The hook script is made executable with `chmod 755`, which is a no-op on native Windows. On WSL, macOS, and Linux it works normally.

**Existing files are overwritten.** If the target project already has a `CLAUDE.md` or `.claude/agents/`, they'll be replaced. Commit or back up first.

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

ISC
