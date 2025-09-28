import assert from "assert";
import _locreq from "locreq";
import Collection from "../../../chip-types/collection.js";
import { FieldTypes } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { module_dirname } from "../../../utils/module_filename.js";
import Public from "../../policy-types/public.js";
import SameAsForResourceInField from "../../policy-types/same-as-for-resource-in-field.js";
import FileField from "./file.js";
import ReverseSingleReference from "./reverse-single-reference.js";
import SingleReference from "./single-reference.js";
import Text from "./text.js";

const locreq = _locreq(module_dirname(import.meta.url));

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
				const context = new app.SuperContext();
				const buff = Buffer.from("Hello world!", "utf-8");
				const file = app.fileManager.fromData(buff, "txt");

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
					item!.get("file") as string
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
				const context = new app.Context({ user_id: user.id });
				const person = await app.collections.people.create(context, {
					name: "Ben",
				});
				const file = app.fileManager.fromPath(
					locreq.resolve("package.json")
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

				await rest_api.get(item!.get("file") as string);
			}
		);
	});

	describe("uploaded_files endpoint", () => {
		it("adds mimetype to the uploaded files", async () => {
			return withRunningApp(
				(t) =>
					class extends t {
						collections = {
							...TestApp.BaseCollections,
							photos: new (class extends Collection {
								fields = {
									photo: new FieldTypes.Image(),
								};
							})(),
						};
					},
				async ({ app }) => {
					await app.collections.photos.suCreate({
						photo: app.fileManager.fromPath(
							locreq.resolve(
								"src/app/base-chips/field-types/default-image.jpg"
							)
						),
					});
					const photo2 = (
						await app.collections.photos
							.suList()
							.format({ photo: "url" })
							.fetch()
					).items[0];
					const url = photo2!.get("photo");
					assert.strictEqual(typeof url, "string");
					const response = await fetch(url as string);
					assert.equal(
						response.headers.get("content-type"),
						"image/jpeg"
					);
				}
			);
		});
	});
});
