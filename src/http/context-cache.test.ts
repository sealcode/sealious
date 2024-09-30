import assert from "assert";
import { sleep } from "../test_utils/sleep.js";
import { withStoppedApp } from "../test_utils/with-test-app.js";
import extract_context from "./extract-context.js";

describe("Context cache", () => {
	it("Runs the getter only once when dealing with a sequential scenario", async () =>
		withStoppedApp(null, async ({ app, rest_api }) => {
			let calls = 0;
			app.HTTPServer.router.get(
				"/custom",
				extract_context(),
				async (ctx) => {
					await ctx.$cache("cached", async () => {
						calls++;
					});
					await ctx.$cache("cached", async () => {
						calls++;
					});
					ctx.status = 200;
					return "OK";
				}
			);
			await app.start();
			await sleep(100);
			await rest_api.get("/custom");
			assert.strictEqual(calls, 1);
		}));

	it("Runs the getter only once when dealing with a parallel scenario", async () =>
		withStoppedApp(null, async ({ app, rest_api }) => {
			let calls = 0;
			app.HTTPServer.router.get(
				"/custom",
				extract_context(),
				async (ctx) => {
					await Promise.all([
						ctx.$cache("cached", async () => {
							calls++;
						}),
						ctx.$cache("cached", async () => {
							calls++;
						}),
					]);
					ctx.status = 200;
					return "OK";
				}
			);
			await app.start();
			await sleep(100);
			await rest_api.get("/custom");
			assert.strictEqual(calls, 1);
		}));
});
