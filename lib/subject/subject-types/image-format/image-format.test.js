const { with_running_app } = require("../../../../test_utils/with-test-app");
const { assert_throws_async } = require("../../../../test_utils");
const { promisify } = require("util");
const { readFile } = require("fs");
const read = promisify(readFile);
const { resolve } = require("path");
const assert = require("assert");
const axios = require("axios");

describe("image-format", function() {
	async function create_resource(app) {
		app.createChip(app.Sealious.Collection, {
			name: "images",
			fields: [
				{ name: "source", type: "image", required: true },
				{ name: "name", type: "text", required: true },
			],
		});

		const buffer = await read(
			resolve(__dirname, "../../../assets/logo.png")
		);

		await app.run_action(
			new app.Sealious.Context(),
			["collections", "images"],
			"create",
			{
				name: "logo",
				source: new app.Sealious.File(
					new app.Sealious.Context(),
					"logo",
					buffer,
					"logo",
					"image/png"
				),
			}
		);
	}

	it("should return a valid image with a given format when provided", async () => {
		await with_running_app(async ({ app, base_url }) => {
			app.ConfigManager.set("image_formats", {
				thumbnail: {
					size: [200, 200],
				},
			});

			await create_resource(app);

			const { data } = await axios.get(
				`${base_url}/api/v1/collections/images?format[source]=thumbnail`
			);
			assert.ok(data.items[0].source);
			const resp = await axios.get(base_url + data.items[0].source);
			assert.equal(resp.status, 200);
			assert.ok(resp.data);
		});
	});

	it("should throw a neat error message when format is not defined", async () => {
		await with_running_app(async ({ app, rest_api }) => {
			create_resource(app);

			const { items } = await rest_api.get(
				"/api/v1/collections/images?format[source]=seal"
			);

			const sample_uri = items[0].source;

			await assert_throws_async(
				async () => await rest_api.get(sample_uri),
				error => {
					assert.equal(error.response.status, 404);
					assert.equal(
						error.response.data.message,
						"Unknown image format: seal"
					);
					assert.equal(error.response.data.type, "bad_subject");
				}
			);
		});
	});
});
