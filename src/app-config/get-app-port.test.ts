import assert from "assert";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getAppPort } from "./get-app-port.js";

async function ensureModuleType(dir: string) {
	await writeFile(
		path.join(dir, "package.json"),
		JSON.stringify({ type: "module" }),
		"utf-8"
	);
}

describe("getAppPort", () => {
	let projectDir: string;

	beforeEach(async () => {
		projectDir = await mkdtemp(
			path.join(os.tmpdir(), "sealgen-app-config-test-")
		);
		await ensureModuleType(projectDir);
	});

	afterEach(async () => {
		await rm(projectDir, { recursive: true, force: true });
		delete process.env.SEALIOUS_PORT;
	});

	async function writeConfigFile(contents: string) {
		const distBackDir = path.join(projectDir, "dist/back");
		await mkdir(distBackDir, { recursive: true });
		await writeFile(path.join(distBackDir, "config.js"), contents, "utf-8");
	}

	it("returns the PORT exported by the compiled config file", async () => {
		await writeConfigFile(`export const PORT = 4321;`);

		const port = await getAppPort(projectDir);

		assert.strictEqual(port, 4321);
	});

	it("falls back to SEALIOUS_PORT when config PORT is invalid", async () => {
		await writeConfigFile(`export const PORT = "not-a-number";`);
		process.env.SEALIOUS_PORT = "9876";

		const port = await getAppPort(projectDir);

		assert.strictEqual(port, 9876);
	});

	it("returns null when no config and no env port provided", async () => {
		const port = await getAppPort(projectDir);

		assert.strictEqual(port, null);
	});
});
