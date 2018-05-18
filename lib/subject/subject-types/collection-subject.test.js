const locreq = require("locreq")(__dirname);
const axios = require("axios");
const assert = require("assert");
const sinon = require("sinon");
const { with_stopped_app } = locreq("test_utils/with-test-app.js");

describe("collection-subject", () => {
	describe("multiple post", () => {
		it("should fire handlers for every resource", async () =>
			with_stopped_app(async ({ app, rest_api }) => {
				app.createChip(app.Sealious.Collection, {
					name: "target",
					fields: [{ name: "value", type: "int" }],
				});

				app.createChip(app.Sealious.Collection, {
					name: "source",
					fields: [{ name: "value", type: "int" }],
				});

				const handler = sinon.spy();
				app.on("post:collections.target:create", handler);

				await app.start();

				for (let i = 1; i <= 3; i++) {
					await rest_api.post("/api/v1/collections/source", {
						value: i,
					});
				}

				await rest_api.post("/api/v1/collections/target", {
					__multiple: true,
					mode: "cartesian",
					sources: [
						[
							"collection_fields",
							{
								collection: "source",
								filter: {},
								fields: ["value"],
								map_to: ["value"],
							},
						],
					],
				});

				assert.equal(handler.callCount, 4);
			}));
	});
});
