#!/usr/bin/env node

import * as fs from "node:fs";
import * as p from "@clack/prompts";
import * as path from "node:path";

const modelOptions = [
  { value: "fable", label: "fable", hint: "top tier, highest cost — may be plan-gated" },
  { value: "opus", label: "opus", hint: "most capable Opus — good for reasoning agents" },
  { value: "sonnet", label: "sonnet", hint: "balanced, default for most work" },
  { value: "haiku", label: "haiku", hint: "fast & cheap" },
];

const templateFiles = [
  "CLAUDE.md",
  ".claude/agents/planner.md",
  ".claude/agents/tester.md",
  ".claude/agents/reviewer.md",
  "docs/knowledge-base/concepts/.gitkeep",
  "docs/notebooklm/.gitkeep",
  "docs/STATE.md",
];

function bail<T>(value: T): asserts value is Exclude<T, symbol> {
	if (p.isCancel(value)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}
}

function resolvePreset(strategy: string): { planner: string; tester: string; reviewer: string } {
  switch (strategy) {
    case "balanced": return { planner: "opus", tester: "sonnet", reviewer: "opus" };
    case "budget":   return { planner: "sonnet", tester: "sonnet", reviewer: "sonnet" };
    case "max":      return { planner: "fable", tester: "sonnet", reviewer: "fable" };
    default:         return { planner: "opus", tester: "sonnet", reviewer: "opus" };
  }
}

function buildPmModesBlock(server: string): string {
  return `## Linear integration (two modes)

	Linear is the PM tool. Structure: **Project** = epic, **Issue** = user story, **sub-issue** = task. Cycles are plain timeboxes only — no ceremony; assign to a cycle only if asked. All Linear calls go through the \`mcp__${server}\` MCP server.

	### MODE 1 — FILE (turn an agreed plan into Linear issues)
	Preconditions: an agreed plan exists in the conversation, the reconcile-check has passed (see below), AND the user approved.

	1. **Reconcile-check first (fast).** Before filing, verify Linear is consistent with \`docs/STATE.md\`. If nothing has drifted, proceed. If drift exists, run MODE 2 first, report it, THEN file — never add new work onto a stale board. Keep the check cheap; don't do a full reconcile if a quick diff shows they agree.
	2. **Map the agreed plan to the hierarchy.** Epic → Project (create if absent), stories → Issues, tasks → sub-issues.
	3. **Write full detail into each issue:** description (the user's framing), the user's acceptance criteria reproduced VERBATIM (never soften them — they are the definition of done), interfaces/contracts, and watch-outs.
	4. **Present before creating.** List every Project/Issue/sub-issue you will create, with titles, and wait for approval. On "go", create them and report back the issue IDs and links.

	### MODE 2 — RECONCILE (sync Linear to STATE.md)
	Source of truth is \`docs/STATE.md\` (the reviewer keeps it honest against the code). Linear conforms to it, never the reverse.

	1. Read \`docs/STATE.md\`. If its "last updated" looks stale relative to a possible recent merge, say: "STATE.md last updated [date]; if you've merged since, run the reviewer first so I'm working from current status." Then proceed with what you have.
	2. Diff STATE.md against Linear:
	- **STATE says done, Linear issue open** → the common catch-up. Low-risk. Update the Linear issue to Done directly and report it.
	- **STATE has a planned item not in Linear** → propose adding it (gated — don't create without approval).
	- **Linear has an issue STATE.md doesn't mention** → FLAG it, do not delete. It may be work the user added manually. Report as drift to resolve.
	- **Status mismatch that looks wrong** (e.g. Linear "done" but STATE says in-progress) → flag, don't act.
	3. **Direct actions:** only marking-done to match a confirmed-done STATE entry. Everything else (creating, deleting, reopening, re-scoping) is proposed and gated.
	4. Report every change made and every drift flagged. If run in the background, relay this when the user next appears.

	Source-of-truth chain: **code → reviewer → STATE.md → planner → Linear.** Each hop has one owner. The planner never writes STATE.md; the reviewer never writes Linear.`;
}

function fillTemplate(content: string, replacements: Record<string, string>): string {
  let result = content;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

function updateGitignore(cwd: string, commitAgents: boolean): void {
  if (commitAgents) return;  // committing = nothing to ignore

  const gitignorePath = path.join(cwd, ".gitignore");
  const marker = "# --- Claude agent system (added by create-claude-dev-system) ---";

  let existing = "";
  if (fs.existsSync(gitignorePath)) {
    existing = fs.readFileSync(gitignorePath, "utf-8");
  }

  if (existing.includes(marker)) return;  // idempotent — already added

  const block = `\n${marker}\n.claude/\nCLAUDE.md\ndocs/\n`;
  fs.writeFileSync(gitignorePath, existing + block, "utf-8");
}

async function main() {
	p.intro("create-claude-dev-system");

	const projectName = await p.text({
		message: "What's the project name",
		placeholder: "my-project",
	});
	bail(projectName);

	const projectDesc = await p.text({
		message: "One-line project description",
	})
	bail(projectDesc)

	const projectType = await p.select({
		message: "What type of project is this?",
		options: [
			{ value: "product", label: "Product", hint: "the real thing, ships to users" },
			{ value: "library", label: "Library", hint: "consumed by other projects" },
			{ value: "portfolio", label: "Portfolio", hint: "a showcase / learning project" },
		],
	});
	bail(projectType);

	const projectStack = await p.text({
		message: "What's the project stack?",
		placeholder: "java",
		defaultValue: "java"
	});
	bail(projectStack);

	const modelStrategy = await p.select({
		message: "Model strategy for the agents:", 
		options: [
			{ value: "balanced", label: "Balanced", hint: "planner/reviewer: opus, tester: sonnet (recommended)" },
			{ value: "budget", label: "Budget", hint: "all sonnet - cheaper, faster" },
			{ value: "max", label: "Max", hint: "planner/reviewer: fable, tester: sonnet - top tier" },
			{ value: "custom", label: "Custom", hint: "pick per agent" },
		],
	});
	bail(modelStrategy);

	let agentModels;

	if (modelStrategy === "custom") {
		const planner = await p.select({
			message: "Model for the planner?",
			options: modelOptions,
		});
		bail(planner);

		const tester = await p.select({
			message: "Model for the tester?",
			options: modelOptions,
		});
		bail(tester);

		const reviewer = await p.select({
			message: "Model for the reviewer?",
			options: modelOptions,
		});
		bail(reviewer);

		agentModels = { planner, tester, reviewer };
	} else {
		agentModels = resolvePreset(modelStrategy);
	}
	

	const usePM = await p.confirm({
		message: "Integrates a PM tool (Linear)?",
		initialValue: false,
	});
	bail(usePM);

	let pmServerName = "linear-server";

	if (usePM) {
		const serverInput = await p.text({
			message: "Your linear MCP server name?",
			placeholder: "linear-server",
			defaultValue: "linear-server",
		});
		bail(serverInput);
		pmServerName = serverInput;
	}

	const environment = await p.select({
		message: "Repo structure?",
		options: [
			{ value: "monorepo", label: "Monorepo", hint: "single repo, one CLAUDE.md" },
			{ value: "standalone", label: "Standalone", hint: "one project, one repo" },
			{ value: "multi", label: "Multi-repo", hint: "umbrella + sub-repos (advanced)" },
		],
	});
	bail(environment);

	const commitAgents = await p.confirm({
		message: "Commit the agent files to git?", 
		initialValue: true,
	});
	bail(commitAgents);

	const config = {
		projectName,
		projectDesc,
		projectType,
		projectStack,
		agentModels,
		usePM,
		pmServerName,
		environment,
		commitAgents,
	};
	p.outro(`Configuration collected.`);

	let pmFileClause: string;
	let pmPlannerWhen: string;
	let pmDescClause: string;
	let pmPlannerModes: string;
	let plannerTools: string;

	if (config.usePM) {
		const server = config.pmServerName;
		pmFileClause = ` into Linear (via \`mcp__${server}\` MCP Server)`;
		pmPlannerWhen = "Filling an agreed plan to Linear; reconciling Linear with STATE.md";
		pmDescClause = ` as structured Linear issues (epics -> stories -> sub-issues) via the \`mcp__${server}\` server`;
		plannerTools = `Read, Grep, Glob, mcp__${server}`;
		pmPlannerModes = buildPmModesBlock(server);
	} else {
		pmFileClause = "";
		pmPlannerWhen = "Filling agreed plan";
		pmDescClause = "";
		pmPlannerModes = "";
		plannerTools = "Read, Grep, Glob";
	}
	
	const replacements: Record<string, string> = {
		"{{PROJECT_NAME}}": config.projectName,
		"{{PROJECT_DESCRIPTION}}": config.projectDesc,
		"{{PROJECT_TYPE}}": config.projectType,
		"{{STACK}}": config.projectStack,
		"{{PM_SERVER}}": config.pmServerName,
		"{{PLANNER_MODEL}}": config.agentModels.planner,
		"{{PM_FILE_CLAUSE}}": pmFileClause,
  		"{{PM_PLANNER_WHEN}}": pmPlannerWhen,
  		"{{PM_DESC_CLAUSE}}": pmDescClause,
		"{{PLANNER_TOOLS}}": plannerTools,
  		"{{PM_PLANNER_MODES}}": pmPlannerModes,
		"{{TESTER_MODEL}}": config.agentModels.tester,
		"{{TESTER_TOOLS}}": "Read, Write, Edit, Bash, Grep, Glob",
		"{{REVIEWER_MODEL}}": config.agentModels.reviewer,
		"{{REVIEWER_TOOLS}}": "Read, Grep, Glob, Write, Edit",
		// more as templates need them
	};

	for (const file of templateFiles) {
  		const src = path.join(__dirname, "..", "templates", file);
  		const dest = path.join(process.cwd(), file);

		const content = fs.readFileSync(src, "utf-8");
  		const filled = fillTemplate(content, replacements);

  		fs.mkdirSync(path.dirname(dest), { recursive: true });
  		fs.writeFileSync(dest, filled, "utf-8");
	}
	updateGitignore(process.cwd(), config.commitAgents);

	p.outro(`Scaffolded ${templateFiles.length} files into ${process.cwd()}`);
}

main();
