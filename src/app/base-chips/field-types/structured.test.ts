import assert from "assert";
import { Collection } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import Int from "./int.js";
import { Structured } from "./structured.js";
import Text from "./text.js";

describe("structured", () => {
	it("works with creating and retrieving information", async () =>
		withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...TestApp.BaseCollections,
						people: new (class extends Collection {
							fields = {
								structured: new Structured({
									name: new Text(),
									age: new Int(),
								}),
							};
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.people.suCreate({
					structured: { name: "John", age: 40 },
				});
				await app.collections.people.suCreate({
					structured: { name: "Alice", age: 35 },
				});
				const { items: result } = await app.collections.people
					.suList()
					.fetch();
				assert.deepStrictEqual(
					result.map((e) => ({ structured: e.get("structured") })),
					[
						{
							structured: {
								age: 40,
								name: "John",
							},
						},
						{
							structured: {
								age: 35,
								name: "Alice",
							},
						},
					]
				);
			}
		));
});
