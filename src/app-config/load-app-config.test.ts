import assert from "assert";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadAppConfigModule } from "./load-app-config.js";

async function ensureModuleType(dir: string) {
	await writeFile(
		path.join(dir, "package.json"),
		JSON.stringify({ type: "module" }),
		"utf-8"
	);
}

describe("loadAppConfigModule", () => {
	let projectDir: string;

	beforeEach(async () => {
		projectDir = await mkdtemp(
			path.join(os.tmpdir(), "sealgen-load-config-test-")
		);
		await ensureModuleType(projectDir);
	});

	afterEach(async () => {
		await rm(projectDir, { recursive: true, force: true });
	});

	async function writeConfigFile(contents: string) {
		const distBackDir = path.join(projectDir, "dist/back");
		await mkdir(distBackDir, { recursive: true });
		await writeFile(path.join(distBackDir, "config.js"), contents, "utf-8");
	}

	it("loads named exports", async () => {
		await writeConfigFile(`export const PORT = 5555;`);

		const config = await loadAppConfigModule(projectDir);

		assert.deepStrictEqual(config, { PORT: 5555 });
	});

	it("loads default exports", async () => {
		await writeConfigFile(`export default { PORT: 6060 };`);

		const config = await loadAppConfigModule(projectDir);

		assert.deepStrictEqual(config, { PORT: 6060 });
	});

	it("loads config property exports", async () => {
		await writeConfigFile(`export const config = { PORT: 7070 };`);

		const config = await loadAppConfigModule(projectDir);

		assert.deepStrictEqual(config, { PORT: 7070 });
	});

	it("returns null when the config file is missing", async () => {
		const config = await loadAppConfigModule(projectDir);

		assert.strictEqual(config, null);
	});
});
