import assert from "assert";
import { Collection, FieldTypes } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { DeepReverseSingleReference } from "./deep-reverse-single-reference.js";
import SingleReference from "./single-reference.js";
import Text from "./text.js";

import _locreq from "locreq";
import { module_dirname } from "../../../utils/module_filename.js";
const locreq = _locreq(module_dirname(import.meta.url));

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

	it("handles formatting of the referenced collection", async () => {
		return withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...TestApp.BaseCollections,
						dogs: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								photos: new FieldTypes.DeepReverseSingleReference(
									{
										intermediary_collection: "dog_to_photo",
										intermediary_field_that_points_here:
											"dog",
										intermediary_field_that_points_there:
											"photo",
										target_collection: "photos",
									}
								),
							};
						})(),
						dog_to_photo: new (class extends Collection {
							fields = {
								dog: new FieldTypes.SingleReference("dogs"),
								photo: new FieldTypes.SingleReference("photos"),
							};
						})(),
						photos: new (class extends Collection {
							fields = {
								photo: new FieldTypes.Image(),
							};
						})(),
					};
				},
			async ({ app }) => {
				let leon = await app.collections.dogs.suCreate({
					name: "Leon",
				});
				let photo = await app.collections.photos.suCreate({
					photo: app.FileManager.fromPath(
						locreq.resolve(
							"src/app/base-chips/field-types/default-image.jpg"
						)
					),
				});
				await app.collections.dog_to_photo.suCreate({
					dog: leon.id,
					photo: photo.id,
				});
				leon = (
					await app.collections.dogs
						.suList()
						.ids([leon.id])
						.format({ photos: { photo: "url" } })
						.attach({ photos: true })
						.fetch()
				).items[0]!;
				assert.strictEqual(
					typeof leon.getAttachments("photos")[0]!.get("photo"),
					"string"
				);
			}
		);
	});

	it("adds ids in an n-to-n collection scenario with shortname", () =>
		withRunningApp(
			(TestClass) =>
				class extends TestClass {
					collections = {
						...TestApp.BaseCollections,
						articles: new (class extends Collection {
							fields = {
								title: new Text(),
								categories: new DeepReverseSingleReference(
									"article_category"
								),
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

	it("properly auto maches missing configuration", () =>
		withRunningApp(
			(TestClass) =>
				class extends TestClass {
					collections = {
						...TestApp.BaseCollections,
						articles: new (class extends Collection {
							fields = {
								title: new Text(),
								categories: new DeepReverseSingleReference(
									"article_category"
								),
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
				// {
				// 		intermediary_collection: "article_category",
				// 		intermediary_field_that_points_here: "article",
				// 		intermediary_field_that_points_there: "category",
				// 		target_collection: "categories",
				// }
				assert.deepStrictEqual(
					app.collections.articles.fields.categories
						.intermediary_collection,
					"article_category"
				);
				assert.deepStrictEqual(
					app.collections.articles.fields.categories
						.intermediary_field_that_points_there,
					"category"
				);
				assert.deepStrictEqual(
					app.collections.articles.fields.categories
						.target_collection,
					"categories"
				);
				assert.deepStrictEqual(
					app.collections.articles.fields.categories
						.referencing_field,
					"article"
				);
			}
		));

	it("should throw an error if auto configuration is not possible", async () => {
		try {
			await withRunningApp(
				(TestClass) =>
					class extends TestClass {
						collections = {
							...TestApp.BaseCollections,
							articles: new (class extends Collection {
								fields = {
									title: new Text(),
									categories: new DeepReverseSingleReference(
										"article_category"
									),
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
									category2: new SingleReference(
										"categories"
									),
								};
							})(),
						};
					},
				() => Promise.resolve()
			);
		} catch (err) {
			assert.deepEqual(
				err.message,
				"Couldn't match intermediary fields automatically. Please provide detailed configuration or clear intermediary collection."
			);
		}
	});

	it("doesn't change value when passed 'undefined' via .set", async () => {
		await withRunningApp(
			(TestClass) =>
				class extends TestClass {
					collections = {
						...TestApp.BaseCollections,
						articles: new (class extends Collection {
							fields = {
								title: new Text(),
								categories: new DeepReverseSingleReference(
									"article_category"
								),
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
				const category1 = await app.collections.categories.suCreate({
					name: "category1",
				});
				const article = await app.collections.articles.suCreate({
					title: "title",
				});

				await app.collections.article_category.suCreate({
					article: article.id,
					category: category1.id,
				});

				const context = new app.SuperContext();
				console.debug(
					"@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
				);
				article.setMultiple({ categories: undefined });
				await article.save(context);
				const article_again = await app.collections.articles.suGetByID(
					article.id
				);
				assert.strictEqual(
					(article_again.get("categories") as string[]).length,
					1
				);
			}
		);
	});
});
