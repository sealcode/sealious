import assert from "assert";
import Context from "../context.js";
import { assertThrowsAsync, sleep } from "../test_utils/test-utils.js";
import { withRunningApp } from "../test_utils/with-test-app.js";
import { LongRunningProcess } from "./long-running-process.js";

describe("long running process", () => {
	it("works as advertised", async () => {
		await withRunningApp(
			(t) => t,
			async ({ app }) => {
				const context = new app.SuperContext();
				const lrp = new LongRunningProcess(
					context,
					async (lrp: LongRunningProcess) => {
						await lrp.info("3", 0);
						await sleep(100);
						await lrp.info("2", 0.5);
						await sleep(100);
						await lrp.info("1", 1);
						await sleep(100);
					},
					[]
				);
				let info_count = 0;
				lrp.on("info", () => info_count++);
				const lrp_id = await lrp.getID();
				await lrp.waitForFinished();
				assert.strictEqual(info_count, 3);
				const { events, latestEvent, state, progress } =
					await LongRunningProcess.getByID(context, lrp_id);
				assert.strictEqual(events.length, 3);
				assert.strictEqual(latestEvent.message, "1");
				assert.strictEqual(state, "finished");
				assert.strictEqual(progress, 1);
			}
		);
	});

	it("allows only the owner to access the event when set to user access mode", async () => {
		await withRunningApp(
			(t) => t,
			async ({ app }) => {
				const user_one = await app.collections.users.suCreate({
					username: "one",
					password: "secretsecret",
				});
				const user_two = await app.collections.users.suCreate({
					username: "two",
					password: "secretsecret",
				});
				const context_one = new Context({ app, user_id: user_one.id });
				const context_two = new Context({ app, user_id: user_two.id });
				const lrp = new LongRunningProcess(
					context_one,
					async (lrp: LongRunningProcess) => {
						await lrp.info("3", 0);
						await sleep(100);
						await lrp.info("2", 0.5);
						await sleep(100);
						await lrp.info("1", 1);
						await sleep(100);
					},
					[]
				);
				let info_count = 0;
				lrp.on("info", () => info_count++);
				const lrp_id = await lrp.getID();
				await lrp.waitForFinished();
				assert.strictEqual(info_count, 3);
				await assertThrowsAsync(() =>
					LongRunningProcess.getByID(context_two, lrp_id)
				);
				await LongRunningProcess.getByID(context_one, lrp_id);
			}
		);
	});

	it("handles errors properly", async () => {
		await withRunningApp(
			(t) => t,
			async ({ app }) => {
				const context = new app.SuperContext();
				const lrp = new LongRunningProcess(
					context,
					async (lrp: LongRunningProcess) => {
						await lrp.info("3", 0);
						await sleep(100);
						await lrp.info("2", 0.5);
						throw new Error("NOOOO");
					},
					[]
				);
				let info_count = 0;
				lrp.on("info", () => info_count++);
				const lrp_id = await lrp.getID();
				await lrp.waitForFinished();
				assert.strictEqual(info_count, 2);
				const { latestEvent, state } = await LongRunningProcess.getByID(
					context,
					lrp_id
				);
				assert.strictEqual(state, "error");
				assert.strictEqual(latestEvent.message, "NOOOO");
			}
		);
	});
});
