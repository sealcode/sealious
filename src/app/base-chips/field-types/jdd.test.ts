import assert from "assert";
import { Collection, FieldTypes } from "../../../main.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import { TestApp } from "../../../test_utils/test-app.js";
import {
	withRunningApp,
	type TestAppConstructor,
} from "../../../test_utils/with-test-app.js";
import type { JDDocument } from "./jdd.js";

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			posts: new (class extends Collection {
				fields = {
					name: new FieldTypes.Text(),
					document: new FieldTypes.JDD(),
				};
			})(),
		};
	};
}

function extendWhitelist(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			posts: new (class extends Collection {
				fields = {
					name: new FieldTypes.Text(),
					document: new FieldTypes.JDD(["Test", "Cmp"]),
				};
			})(),
		};
	};
}

describe("jdd", () => {
	it("should add properly formated JDD", async () =>
		withRunningApp(extend, async ({ app }) => {
			const item = await app.collections.posts.suCreate({
				name: "Test",
				document: [
					{
						component_name: "Test",
						args: {},
					},
				],
			});
			const response_doc = item.get("document") as JDDocument;
			assert.strictEqual(response_doc[0]!.component_name, "Test");
		}));

	it("should add properly formated JDD with argument", async () =>
		withRunningApp(extend, async ({ app }) => {
			const item = await app.collections.posts.suCreate({
				name: "Test",
				document: [
					{
						component_name: "Test",
						args: {
							title: "Ipsum",
							content:
								"**Duis ut diam quam nulla**.\n\nLectus mauris *ultrices* eros!",
						},
					},
				],
			});
			const response_doc = item.get("document") as JDDocument;
			assert.strictEqual(response_doc[0]!.component_name, "Test");
			assert.strictEqual(response_doc[0]!.args.title, "Ipsum");
			assert.strictEqual(
				response_doc[0]!.args.content,
				"**Duis ut diam quam nulla**.\n\nLectus mauris *ultrices* eros!"
			);
		}));

	it("should add document with whitelisted components", async () =>
		withRunningApp(extendWhitelist, async ({ app }) => {
			const item = await app.collections.posts.suCreate({
				name: "Test",
				document: [
					{
						component_name: "Test",
						args: {},
					},
					{
						component_name: "Cmp",
						args: {},
					},
				],
			});
			const response_doc = item.get("document") as JDDocument;
			assert.strictEqual(response_doc.length, 2);
		}));

	it("should throw an error if component is not whitelisted", async () =>
		withRunningApp(extendWhitelist, async ({ app }) =>
			assertThrowsAsync(
				() =>
					app.collections.posts.suCreate({
						name: "Test",
						document: [
							{
								component_name: "Test",
								args: {},
							},
							{
								component_name: "NotInWhiteList",
								args: {},
							},
						],
					}),
				(e) =>
					assert.strictEqual(
						e.field_messages.document.message,
						"Some of the components are not allowed here"
					)
			)
		));
});
