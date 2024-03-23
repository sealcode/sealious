import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app.js";

describe("/assets/logo route", () => {
	it("returns the logo", async () =>
		withRunningApp(null, async ({ rest_api }) => {
			const response = await rest_api.get("/assets/logo");
			assert.equal(response.length, 8105);
		}));
});
