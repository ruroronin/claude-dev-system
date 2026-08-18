#!/usr/bin/env node

import * as p from "@clack/prompts";

import { type EnvConfigs, promptEnv } from "./environment";
import { type AgentsConfigs, promptAgents } from "./models";
import { buildPmFragment, type PmConfigs, promptPM } from "./pm";
import { type ProjectConfigs, promptProject } from "./project";
import { GenerateFiles } from "./template";

type Config = ProjectConfigs & AgentsConfigs & PmConfigs & EnvConfigs;

function setConfigs(
	projectConfig: ProjectConfigs,
	agentConfigs: AgentsConfigs,
	pmConfig: PmConfigs, 
	envConfigs: EnvConfigs
): Config {
	return {
		projectName: projectConfig.projectName,
		projectDesc: projectConfig.projectDesc,
		projectType: projectConfig.projectType,
		projectStack: projectConfig.projectStack,
		agentModels: agentConfigs.agentModels,
		usePM: pmConfig.usePM,
		pmServerName: pmConfig.pmServerName,
		environment: envConfigs.environment,
		commitAgents: envConfigs.commitAgents
	}
}

async function main() {
	p.intro("create-claude-dev-system");

	const projectConfig = await promptProject();
	const agentConfig = await promptAgents();
	const pmConfig = await promptPM();
	const pmFragments = buildPmFragment(pmConfig);
	const envConfig = await promptEnv();

	const config = setConfigs(projectConfig, agentConfig, pmConfig, envConfig);

	p.outro(`Configuration collected.`);
	
	const replacements: Record<string, string> = {
		"{{PROJECT_NAME}}": config.projectName,
		"{{PROJECT_DESCRIPTION}}": config.projectDesc,
		"{{PROJECT_TYPE}}": config.projectType,
		"{{STACK}}": config.projectStack,
		"{{PM_SERVER}}": config.pmServerName,
		"{{PLANNER_MODEL}}": config.agentModels.planner,
		"{{PM_FILE_CLAUSE}}": pmFragments.pmFileClause,
  		"{{PM_PLANNER_WHEN}}": pmFragments.pmPlannerWhen,
  		"{{PM_DESC_CLAUSE}}": pmFragments.pmDescClause,
		"{{PLANNER_TOOLS}}": pmFragments.plannerTools,
  		"{{PM_PLANNER_MODES}}": pmFragments.pmPlannerModes,
		"{{TESTER_MODEL}}": config.agentModels.tester,
		"{{TESTER_TOOLS}}": "Read, Write, Edit, Bash, Grep, Glob",
		"{{REVIEWER_MODEL}}": config.agentModels.reviewer,
		"{{REVIEWER_TOOLS}}": "Read, Grep, Glob, Write, Edit",
	};

	let filesAmount = GenerateFiles(replacements, config.commitAgents)

	const nextSteps = config.usePM
  	? `  ▶ Next: connect the Linear MCP if you haven't:
  	    claude mcp add --transport http ${config.pmServerName} https://mcp.linear.app/mcp

  	  Then run \`claude\` in this directory with the 
	  prompt \`finish setup\` — it will walk you through 
	  finishing the systems setup.`
  	: `  ▶ Next: run \`claude\` in this directory with the 
	prompt \`finish setup\` — it will walk you through 
	finishing the systems setup.`;

	p.outro(
	  `Created ${filesAmount} files into ${process.cwd()}

	  ${nextSteps}`
	);
}

main();
