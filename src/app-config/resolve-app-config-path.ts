import { resolve } from "node:path";

export function resolveAppConfigModulePath(projectDir: string): string {
	return resolve(projectDir, "dist/back/config.js");
}
