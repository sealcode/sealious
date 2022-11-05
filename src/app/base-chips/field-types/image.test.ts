import assert from "assert";
import { Collection, File } from "../../../main";
import { withRunningApp } from "../../../test_utils/test-utils";
import { App } from "../../app";
import Image from "./image";
import _locreq from "locreq";
const locreq = _locreq(__dirname);

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
});
