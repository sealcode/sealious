import assert from "assert";
import { sleep, withRunningApp } from "../test_utils/test-utils";
import { LongRunningProcess } from "./long-running-process";

describe("long running process", () => {
	it("works as advertised", async () => {
		await withRunningApp(
			(t) => t,
			async ({ app }) => {
				const context = new app.Context();
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
				const { events, latestEvent } =
					await LongRunningProcess.getByID(context, lrp_id);
				assert.strictEqual(events.length, 3);
				assert.strictEqual(latestEvent.message, "1");
			}
		);
	});
});
