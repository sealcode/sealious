import assert from "assert";
import { Collection, File } from "../../../main.js";
import { MockRestApi, withRunningApp } from "../../../test_utils/test-utils.js";
import { App } from "../../app.js";
import Image from "./image.js";
import _locreq from "locreq";
import { module_dirname } from "../../../utils/module_filename.js";
const locreq = _locreq(module_dirname(import.meta.url));

describe("FieldTypes.Image", () => {
	it("returns an instance of File when provided with the format 'file'", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new Image() };
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: await File.fromPath(
						app,
						locreq.resolve("src/assets/logo.png")
					),
				});
				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.format({ image: "file" })
					.fetch();

				assert(item.get("image") instanceof File);
			}
		));

	it("handles an array with a single file as input", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new Image() };
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: [
						await File.fromPath(
							app,
							locreq.resolve("src/assets/logo.png")
						),
					],
				});
				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.format({ image: "file" })
					.fetch();

				assert(item.get("image") instanceof File);
			}
		));

	it("should format image as a url path (no hostname)", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new Image() };
						})(),
					};
				},
			async ({ app, rest_api }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: [
						await File.fromPath(
							app,
							locreq.resolve("src/assets/logo.png")
						),
					],
				});
				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.format({ image: "path" })
					.fetch();

				const response = await rest_api.get(
					item.get("image") as string
				);

				assert(!!response);
			}
		));

	it("should format image as full url (with hostname)", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new Image() };
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: [
						await File.fromPath(
							app,
							locreq.resolve("src/assets/logo.png")
						),
					],
				});

				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.format({ image: "url" })
					.fetch();

				const response = await MockRestApi.getWithFullUrl(
					item.get("image") as string
				);

				assert(response.status === 200);
			}
		));
});
