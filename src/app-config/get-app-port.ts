import { loadAppConfigModule } from "./load-app-config.js";

function parsePort(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number.parseInt(value, 10);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return null;
}

export async function getAppPort(projectDir: string): Promise<number | null> {
	const configModule = await loadAppConfigModule(projectDir);
	const configPort = configModule ? parsePort(configModule.PORT) : null;
	if (configPort !== null) {
		return configPort;
	}
	return parsePort(process.env.SEALIOUS_PORT ?? null);
}
