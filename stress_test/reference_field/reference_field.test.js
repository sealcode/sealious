const populate = require("./populate.js");
const { with_running_app } = require("../../test_utils/with-test-app.js");

describe("Reference field stress test", () => {
	it("returns requested items when using run_action", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await populate(app);

			console.time("Time elapsed");
			await rest_api.get(
				"/api/v1/collections/seals?attachments[water_area][type]=true"
			);
			console.timeEnd("Time elapsed");
		}));
});
