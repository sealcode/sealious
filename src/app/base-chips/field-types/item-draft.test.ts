import assert from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import Collection, {
	type CollectionValidationResult,
} from "../../../chip-types/collection.js";
import {
	App,
	CollectionItemBody,
	Context,
	FieldTypes,
	Policies,
} from "../../../main.js";

const URL = "/api/v1/collections/boolseals";

function extend(t: TestAppConstructor) {
	const articles = new (class Articles extends Collection {
		name = "articles";
		fields = {
			title: new FieldTypes.Text(),
		};
		defaultPolicy = new Policies.Public();

		async validate(
			context: Context,
			new_body: CollectionItemBody<Articles>
		): Promise<CollectionValidationResult> {
			const title = new_body.getInput("title");
			if (title && title.length > 5) {
				return [{ error: "Title too long", fields: ["title"] }];
			}
			return [];
		}
	})();

	const drafts = new (class extends Collection {
		name = "drafts";
		fields = {
			draft: new FieldTypes.ItemDraft<typeof articles>("articles"),
		};
	})();
	return class extends t {
		collections = {
			...App.BaseCollections,
			articles,
			drafts,
		};
	};
}

describe("itemDraft", () => {
	it("Validates the value using the target collection's validation logic", async () =>
		withRunningApp(extend, async ({ app }) => {
			await assertThrowsAsync(
				() =>
					app.collections.drafts.create(new app.Context(), {
						draft: { title: "Waaay to long title" },
					}),
				(error) =>
					assert.deepStrictEqual(error.field_messages, {
						draft: {
							message: '{"title":{"message":"Title too long"}}',
						},
					})
			);
		}));

	it("Validates the value using the target field built-in logic", async () =>
		withRunningApp(extend, async ({ app }) => {
			await assertThrowsAsync(
				() =>
					app.collections.drafts.create(new app.Context(), {
						draft: { title: 2 as any },
					}),
				(error) =>
					assert.deepStrictEqual(error.field_messages, {
						draft: {
							message:
								'{"title":{"message":"Type of 2 is number, not string."}}',
						},
					})
			);
		}));

	it("Creates a target element when calling .finalize", async () =>
		withRunningApp(extend, async ({ app }) => {
			const draft_item = await app.collections.drafts.create(
				new app.Context(),
				{
					draft: { title: "TITLE" },
				}
			);
			const draft = draft_item.get("draft");
			const { items: items_before } = await app.collections.articles
				.suList()
				.fetch();
			assert.strictEqual(items_before.length, 0);
			await draft?.finalize(new app.Context());
			const { items } = await app.collections.articles.suList().fetch();
			assert.strictEqual(items.length, 1);
			assert.strictEqual(items[0]?.get("title"), "TITLE");
		}));
});
