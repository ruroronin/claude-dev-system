import * as p from "@clack/prompts";

import { bail } from "./utils";

export interface EnvConfigs {
	environment: string;
	commitAgents: boolean;
}

export async function promptEnv(): Promise<EnvConfigs> {
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

	return { environment, commitAgents }
}