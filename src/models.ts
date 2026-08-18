import * as p from "@clack/prompts";

import { bail } from "./utils";

export interface AgentsConfigs {
	agentModels: {
		planner: string;
		tester: string;
		reviewer: string;
	}

}

const modelOptions = [
  { value: "fable", label: "fable", hint: "top tier, highest cost — may be plan-gated" },
  { value: "opus", label: "opus", hint: "most capable Opus — good for reasoning agents" },
  { value: "sonnet", label: "sonnet", hint: "balanced, default for most work" },
  { value: "haiku", label: "haiku", hint: "fast & cheap" },
];

function resolvePreset(strategy: string): { planner: string; tester: string; reviewer: string } {
  switch (strategy) {
    case "balanced": return { planner: "opus", tester: "sonnet", reviewer: "opus" };
    case "budget":   return { planner: "sonnet", tester: "sonnet", reviewer: "sonnet" };
    case "max":      return { planner: "fable", tester: "sonnet", reviewer: "fable" };
    default:         return { planner: "opus", tester: "sonnet", reviewer: "opus" };
  }
}


export async function promptAgents(): Promise<AgentsConfigs> {
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

	return { agentModels }

}