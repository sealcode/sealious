import _locreq from "locreq";
const locreq = _locreq(__dirname);
import assert from "assert";
import File from "./file";
import FileField from "../app/base-chips/field-types/file";
import { Collection, Context, SuperContext } from "../main";
import { withRunningApp } from "../test_utils/with-test-app";
import { TestApp } from "../test_utils/test-utils";
import ReverseSingleReference from "../app/base-chips/field-types/reverse-single-reference";
import SingleReference from "../app/base-chips/field-types/single-reference";
import Text from "../app/base-chips/field-types/text";
import SameAsForResourceInField from "../app/policy-types/same-as-for-resource-in-field";
import Public from "../app/policy-types/public";

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

				const {
					items: [item],
				} = await app.collections.with_file
					.list(context)
					.ids([response.id])
					.format({ file: "url" })
					.fetch();

				const api_response = await rest_api.get(
					item.get("file") as string
				);

				assert.strictEqual(api_response, "Hello world!");
			}
		);
	});

	it("should work with a file from path and a Policy that causes the encode function to run before finishing write", () => {
		return withRunningApp(
			(test_app_type) => {
				return class extends test_app_type {
					collections = {
						...TestApp.BaseCollections,
						photos: new (class extends Collection {
							fields = {
								file: new FileField(),
								person: new SingleReference("people"),
							};
							defaultPolicy = new SameAsForResourceInField({
								action_name: "edit",
								collection_name: "photos",
								field: "person",
							});
							policies = { show: new Public() };
						})(),
						people: new (class extends Collection {
							fields = {
								name: new Text(),
								files: new ReverseSingleReference({
									referencing_field: "person",
									referencing_collection: "photos",
								}),
							};
						})(),
					};
				};
			},
			async ({ app, rest_api }) => {
				const user = await app.collections.users.suCreate({
					username: "user",
					password: "useruser",
				});
				const context = new Context(app, Date.now(), user.id);
				const person = await app.collections.people.create(context, {
					name: "Ben",
				});
				const file = await File.fromPath(
					app,
					locreq.resolve("src/data-structures/file.test.ts")
				);
				const response = await app.collections.photos.create(context, {
					file,
					person: person.id,
				});
				const {
					items: [item],
				} = await app.collections.photos
					.list(context)
					.ids([response.id])
					.format({ file: "url" })
					.fetch();

				await rest_api.get(item.get("file") as string);
			}
		);
	});
});
