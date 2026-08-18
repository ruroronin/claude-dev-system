import * as p from "@clack/prompts";

export function bail<T>(value: T): asserts value is Exclude<T, symbol> {
	if (p.isCancel(value)) {
		p.cancel("Setup cancelled.");
		process.exit(0);
	}
}