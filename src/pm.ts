import * as p from "@clack/prompts";

import { bail } from "./utils";

export interface PmConfigs {
	usePM: boolean;
	pmServerName: string;
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