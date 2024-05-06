import assert from "assert";
import { Collection } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { DeepReverseSingleReference } from "./deep-reverse-single-reference.js";
import SingleReference from "./single-reference.js";
import Text from "./text.js";

describe("deep-reverse-single-reference", () => {
	it("adds ids in an n-to-n collection scenario", () =>
		withRunningApp(
			(TestClass) =>
				class extends TestClass {
					collections = {
						...TestApp.BaseCollections,
						articles: new (class extends Collection {
							fields = {
								title: new Text(),
								categories: new DeepReverseSingleReference({
									intermediary_collection: "article_category",
									intermediary_field_that_points_here:
										"article",
									intermediary_field_that_points_there:
										"category",
									target_collection: "categories",
								}),
							};
						})(),
						categories: new (class extends Collection {
							fields = {
								name: new Text(),
							};
						})(),
						article_category: new (class extends Collection {
							fields = {
								article: new SingleReference("articles"),
								category: new SingleReference("categories"),
							};
						})(),
					};
				},
			async ({ app }) => {
				const article = await app.collections.articles.suCreate({
					title: "Hello, world",
				});
				const category = await app.collections.categories.suCreate({
					name: "lifestyle",
				});
				const assignment =
					await app.collections.article_category.suCreate({
						article: article.id,
						category: category.id,
					});

				const article_bis = await app.collections.articles.suGetByID(
					article.id
				);
				assert.deepStrictEqual(article_bis.get("categories"), [
					category.id,
				]);

				await app.collections.article_category.suRemoveByID(
					assignment.id
				);

				const article_tris = await app.collections.articles.suGetByID(
					article.id
				);
				assert.deepStrictEqual(article_tris.get("categories"), []);
			}
		));
});
