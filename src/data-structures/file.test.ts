import assert from "assert";
import File from "./file";
import FileField from "../app/base-chips/field-types/file";
import { Collection, SuperContext } from "../main";
import { withRunningApp } from "../test_utils/with-test-app";
import { TestApp } from "../test_utils/test-utils";

describe("file", () => {
	it("should return hello world file", () => {
		return withRunningApp(
			(test_app_type) => {
				return class extends test_app_type {
					collections = {
						...TestApp.BaseCollections,
						with_file: new (class extends Collection {
							fields = {
								file: new FileField(),
							};
						})(),
					};
				};
			},
			async ({ app, rest_api }) => {
				const context = new SuperContext(app);
				const buff = Buffer.from("Hello world!", "utf-8");
				const file = await File.fromData(app, buff, "test-file.txt");

				const response = await app.collections.with_file.create(
					context,
					{
						file,
					}
				);

				const item = await app.collections.with_file.getByID(
					context,
					response.id
				);

				const api_response = await rest_api.get(
					item.get("file") as string
				);

				assert.strictEqual(api_response, "Hello world!");
			}
		);
	});
});
