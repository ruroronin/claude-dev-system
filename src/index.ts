#!/usr/bin/env node

import * as p from "@clack/prompts";

const modelOptions = [
  { value: "fable", label: "fable", hint: "top tier, highest cost — may be plan-gated" },
  { value: "opus", label: "opus", hint: "most capable Opus — good for reasoning agents" },
  { value: "sonnet", label: "sonnet", hint: "balanced, default for most work" },
  { value: "haiku", label: "haiku", hint: "fast & cheap" },
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

async function main() {
	p.intro("create-claude-dev-system");

	const projectName = await p.text({
		message: "What's the project name",
		placeholder: "my-project",
	});
	bail(projectName);

	const projectType = await p.select({
		message: "What type of project is this?",
		options: [
			{ value: "product", label: "Product", hint: "the real thing, ships to users" },
			{ value: "library", label: "Library", hint: "consumed by other projects" },
			{ value: "portfolio", label: "Portfolio", hint: "a showcase / learning project" },
		],
	});
	bail(projectType);

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
		projectType,
		agentModels,
		usePM,
		pmServerName,
		environment,
		commitAgents,
	};

	p.outro(`Configuration collected.`);
	console.log(config);
}

main();
