import * as p from "@clack/prompts";

import { bail } from "./utils";

export interface PmConfigs {
	usePM: boolean;
	pmServerName: string;
}

export interface PmFragments {
	pmFileClause: string;
	pmPlannerWhen: string;
	pmDescClause: string;
	pmPlannerModes: string;
	plannerTools: string;

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

export async function promptPM(): Promise<PmConfigs> {
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

	return { usePM, pmServerName }
}

export function buildPmFragment(config: PmConfigs) {
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

	return { pmFileClause, pmPlannerWhen, pmDescClause, pmPlannerModes, plannerTools }
}