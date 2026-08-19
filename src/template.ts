import * as fs from "node:fs";
import * as path from "node:path";

const templateFiles = [
  "CLAUDE.md",
  ".claude/agents/planner.md",
  ".claude/agents/tester.md",
  ".claude/agents/reviewer.md",
  ".claude/settings.json",
  ".claude/hooks/check-setup.js",
  "FINISH_SETUP.md",
  "docs/knowledge-base/concepts/.gitkeep",
  "docs/notebooklm/.gitkeep",
  "docs/STATE.md",
];

export type WriteMode = "overwrite" | "skip";

const SENTINELS = ["CLAUDE.md", ".claude/agents", "docs/STATE.md"];

export function detectExisting(cwd: string): string[] {
  return SENTINELS.filter((s) => fs.existsSync(path.join(cwd, s)));
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

export function GenerateFiles(
	replacements: Record<string, string>,
	commitAgents: boolean, 
	mode: WriteMode
): { written: number, skipped: number } {
	let written = 0;
	let skipped = 0;

	for (const file of templateFiles) {
  		const src = path.join(__dirname, "..", "templates", file);
  		const dest = path.join(process.cwd(), file);

		if (mode === "skip" && fs.existsSync(dest)) {
			skipped++;
			continue;
		}

		const content = fs.readFileSync(src, "utf-8");
  		const filled = fillTemplate(content, replacements);

  		fs.mkdirSync(path.dirname(dest), { recursive: true });
  		fs.writeFileSync(dest, filled, "utf-8");
		written++;
	}
	updateGitignore(process.cwd(), commitAgents);

	return { written, skipped }
}