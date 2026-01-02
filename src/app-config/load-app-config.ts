import { pathToFileURL } from "node:url";
import { resolveAppConfigModulePath } from "./resolve-app-config-path.js";

export type AppConfigModule = {
	PORT?: number;
};

type ImportedModuleShape = Record<string, unknown>;
function isRecord(value: unknown): value is ImportedModuleShape {
	return typeof value === "object" && value !== null;
}

function hasOwnPortProperty(
	value: ImportedModuleShape
): value is ImportedModuleShape & { PORT?: unknown } {
	return Object.hasOwn(value, "PORT");
}

function isAppConfigModule(value: unknown): value is AppConfigModule {
	if (!isRecord(value) || !hasOwnPortProperty(value)) {
		return false;
	}
	const port = value.PORT;
	return port === undefined || typeof port === "number";
}

function toPlainAppConfig(candidate: AppConfigModule): AppConfigModule {
	return candidate.PORT === undefined ? {} : { PORT: candidate.PORT };
}

function pickAppConfigModule(exported: unknown): AppConfigModule | null {
	const visited = new Set<unknown>();
	const queue: unknown[] = [exported];
	while (queue.length > 0) {
		const candidate = queue.shift();
		if (candidate === undefined || visited.has(candidate)) {
			continue;
		}
		visited.add(candidate);
		if (isAppConfigModule(candidate)) {
			return toPlainAppConfig(candidate);
		}
		if (isRecord(candidate)) {
			if ("default" in candidate) {
				queue.push(candidate.default);
			}
			if ("config" in candidate) {
				queue.push(candidate.config);
			}
		}
	}
	return null;
}

type ModuleError = {
	code?: string;
	errno?: number | string;
	message?: string;
};

function isMissingModuleError(error: unknown): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}
	const { code, errno, message } = error as ModuleError;
	if (code === "ENOENT" || code === "ERR_MODULE_NOT_FOUND") {
		return true;
	}
	if (errno === "ENOENT") {
		return true;
	}
	if (typeof message === "string") {
		return message.includes("Cannot find module");
	}
	return false;
}

export async function loadAppConfigModule(
	projectDir: string
): Promise<AppConfigModule | null> {
	const modulePath = resolveAppConfigModulePath(projectDir);
	try {
		const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`;
		const importedModule: unknown = await import(moduleUrl);
		return pickAppConfigModule(importedModule);
	} catch (error) {
		if (isMissingModuleError(error)) {
			return null;
		}
		throw error;
	}
}
