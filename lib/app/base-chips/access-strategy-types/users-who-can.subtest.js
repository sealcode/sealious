const locreq = require("locreq")(__dirname);
const assert = require("assert");
const { with_running_app } = locreq("test_utils/with-test-app.js");
const assert_throws_async = locreq("test_utils/assert_throws_async.js");
const axios = require("axios");

describe("users-who-can", () => {
	it("should deny if the user can't perform the action", async () =>
		with_running_app(async ({ app, base_url }) => {
			const bricks = app.createChip(Sealious.Collection, {
				name: "bricks",
				fields: [{ name: "number", type: "int" }],
				access_strategy: { create: "noone" },
			});
			app.createChip(Sealious.Collection, {
				name: "houses",
				fields: [{ name: "address", type: "text" }],
				access_strategy: { create: ["users-who-can", ["create", bricks]] },
			});
			await assert_throws_async(
				async () =>
					axios.post(`${base_url}/api/v1/collections/houses`, {
						address: "any",
					}),
				e => {
					assert.equal(e.response.status, 401);
					assert.equal(
						e.response.data.message,
						"You can't perform this action beacuse you can't create bricks"
					);
				}
			);
		}));

	it("should allow if the user can't perform the action", async () =>
		with_running_app(async ({ app, base_url }) => {
			const bricks = app.createChip(Sealious.Collection, {
				name: "bricks",
				fields: [{ name: "number", type: "int" }],
				access_strategy: { create: "public" },
			});
			app.createChip(Sealious.Collection, {
				name: "houses",
				fields: [{ name: "address", type: "text" }],
				access_strategy: { create: ["users-who-can", ["create", bricks]] },
			});
			await axios.post(`${base_url}/api/v1/collections/houses`, {
				address: "any",
			});
		}));
});
