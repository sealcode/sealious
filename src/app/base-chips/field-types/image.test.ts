import assert from "assert";
import { Collection } from "../../../main.js";
import { MockRestApi } from "../../../test_utils/test-utils.js";
import { App } from "../../app.js";
import ImageField from "./image.js";
import _locreq from "locreq";
import { module_dirname } from "../../../utils/module_filename.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { PathFilePointer } from "@sealcode/file-manager";
import { ImageValue } from "./image-value.js";
const locreq = _locreq(module_dirname(import.meta.url));

describe("FieldTypes.Image", () => {
	it("returns an instance of File when provided with the format 'file'", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new ImageField() };
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: app.fileManager.fromPath(
						locreq.resolve("src/assets/logo.png")
					),
				});
				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.fetch();

				const imageValue = item!.get("image");
				assert.ok(imageValue instanceof ImageValue);
				assert(imageValue.toFile() instanceof PathFilePointer);
			}
		));

	it("handles an array with a single file as input", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new ImageField() };
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: [
						app.fileManager.fromPath(
							locreq.resolve("src/assets/logo.png")
						),
					],
				});
				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.fetch();

				const imageValue = item!.get("image");
				assert.ok(imageValue instanceof ImageValue);
				assert(imageValue.toFile() instanceof PathFilePointer);
			}
		));

	it("should format image as a url path (no hostname)", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						images: new (class extends Collection {
							fields = { image: new ImageField() };
						})(),
					};
				},
			async ({ app, rest_api }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: [
						app.fileManager.fromPath(
							locreq.resolve("src/assets/logo.png")
						),
					],
				});
				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.fetch();

				const imageValue = item!.get("image");
				assert.ok(imageValue instanceof ImageValue);
				const response = await rest_api.get(imageValue.toPath());
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
							fields = { image: new ImageField() };
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.images.create(new app.SuperContext(), {
					image: [
						app.fileManager.fromPath(
							locreq.resolve("src/assets/logo.png")
						),
					],
				});

				const {
					items: [item],
				} = await app.collections.images
					.list(new app.SuperContext())
					.fetch({ is_http_api_request: true });

				const imageValue = item!.get("image");
				assert.ok(imageValue instanceof ImageValue);

				const response = await MockRestApi.getWithFullUrl(
					imageValue.toUrl()
				);

				assert.strictEqual(response.status, 200);
			}
		));
});
