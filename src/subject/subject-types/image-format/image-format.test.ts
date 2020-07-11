const locreq = require("locreq")(__dirname);
import {
	App,
	Collection,
	FieldDefinitionHelper as field,
	FieldTypes,
} from "../../../main";

import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import assert from "assert";
import axios from "axios";
import File from "../../../data-structures/file";
import Image from "../../../app/base-chips/field-types/image";

describe("image-format", function () {
	async function create_resource(app: App) {
		Collection.fromDefinition(app, {
			name: "images",
			fields: [
				field("name", FieldTypes.Text, {}, true),
				field("source", Image, {}, true),
			],
		});

		try {
			await app.runAction(
				new app.Context(),
				["collections", "images"],
				"create",
				{
					name: "logo",
					source: await File.fromPath(
						app,
						locreq.resolve("src/assets/logo.png")
					),
				}
			);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}

	it("should return a valid image with a given format when provided", async () => {
		return withRunningApp(async ({ app, base_url }) => {
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
		await withRunningApp(async ({ app, rest_api }) => {
			await create_resource(app);

			const { items } = await rest_api.get(
				"/api/v1/collections/images?format[source]=seal"
			);

			const sample_uri = items[0].source;

			await assertThrowsAsync(
				async () => await rest_api.get(sample_uri),
				(error) => {
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
