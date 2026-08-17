#!/usr/bin/env node

import * as p from "@clack/prompts";

function bail<T>(value: T): asserts value is Exclude<T, symbol> {
	if (p.isCancel(value)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}
}

async function main() {
	p.intro("create-claude-dev-system");

	const projectName = await p.text({
		message: "What's the project name",
		placeholder: "my-project",
	});

	const projectType = await p.select({
		message: "What type of project is this?",
		options: [
			{ value: "product", label: "Product", hint: "the real thing, ships to users" },
			{ value: "library", label: "Library", hint: "consumed by other projects" },
			{ value: "portfolio", label: "Portfolio", hint: "a showcase / learning project" },
		],
	});

	const modelStrategy = await p.select({
		message: "Model strategy for the agents:", 
		options: [
			{ value: "balanced", label: "Balanced", hint: "planner/reviewer: opus, tester: sonnet (recommended)" },
			{ value: "budget", label: "Budget", hint: "all sonnet - cheaper, faster" },
			{ value: "max", label: "Max", hint: "planner/reviewer: fable, tester: sonnet - top tier" },
			{ value: "custom", label: "Custom", hint: "pick per agent" },
		],
	});

	bail(projectName);
	bail(projectType);
	bail(modelStrategy);

	p.outro(`You entered: ${projectName}`);
	p.outro(`Your project is: ${projectType}`);
}

main();
