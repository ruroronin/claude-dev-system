import * as p from "@clack/prompts";

import { bail } from "./utils";

export interface ProjectConfig  {
	projectName: string;
	projectDesc: string;
	projectType: string;
	projectStack: string;
}

export async function promptProject(): Promise<ProjectConfig> {
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

	return { projectName, projectDesc, projectType, projectStack }
}


