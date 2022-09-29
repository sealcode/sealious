import assert from "assert";
import {
	TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { Collection, FieldTypes, Field, App } from "../../../main";
import type { DerivingFn } from "./derived-value";
import { sleep } from "../../../test_utils/sleep";
import { TestApp } from "../../../test_utils/test-app";

const extend =
	<T extends Field = FieldTypes.Text>(derived_value_params: {
		deriving_fn: DerivingFn<T>;
		fields: string[];
	}) =>
	(t: TestAppConstructor) => {
		return class extends t {
			collections = {
				...TestApp.BaseCollections,
				people: new (class extends Collection {
					name = "people";
					fields = {
						username: new FieldTypes.Text(),
						surname: new FieldTypes.Text(),
						name_and_surname: new FieldTypes.DerivedValue(
							new FieldTypes.Text(),
							// @ts-ignore
							{
								...derived_value_params,
							}
						),
						age: new FieldTypes.Int(),
					};
				})(),
			};
		};
	};

describe("derived-value", () => {
	it("properly reacts to pre:create handler", async () =>
		withRunningApp(
			extend({
				fields: ["username", "surname"],
				deriving_fn: async (_, username: string, surname: string) =>
					`${username} ${surname}`,
			}),
			async ({ rest_api }) => {
				const person = await rest_api.post(
					"/api/v1/collections/people",
					{
						username: "Jan",
						surname: "Kowalski",
					}
				);

				assert.deepStrictEqual(person.name_and_surname, "Jan Kowalski");
			}
		));

	it("properly reacts to pre:edit handler", async () =>
		withRunningApp(
			extend({
				fields: ["username", "surname"],
				deriving_fn: async (_, username: string, surname: string) =>
					`${username} ${surname}`,
			}),
			async ({ rest_api }) => {
				const person = await rest_api.post(
					"/api/v1/collections/people",
					{
						username: "Jan",
						surname: "Kowalski",
					}
				);

				assert.deepStrictEqual("Jan Kowalski", person.name_and_surname);

				const {
					items: [updated_person],
				} = await rest_api.patch(
					`/api/v1/collections/people/${person.id}`,
					{
						username: "Janusz",
					}
				);

				assert.deepStrictEqual(updated_person.username, "Janusz");

				assert.deepStrictEqual(
					updated_person.name_and_surname,
					"Janusz Kowalski"
				);

				const {
					items: [updated_person2],
				} = await rest_api.patch(
					`/api/v1/collections/people/${person.id}`,
					{
						username: "John",
						surname: "Doe",
					}
				);

				assert.deepStrictEqual(updated_person2.username, "John");
				assert.deepStrictEqual(updated_person2.surname, "Doe");
				assert.deepStrictEqual(
					updated_person2.name_and_surname,
					"John Doe"
				);
			}
		));

	it("value isn't undefined after edit on fields other than the ones concerning derived_value", async () =>
		withRunningApp(
			extend({
				fields: ["username", "surname"],
				deriving_fn: async (_, username: string, surname: string) =>
					`${username} ${surname}`,
			}),
			async ({ rest_api }) => {
				const person = await rest_api.post(
					"/api/v1/collections/people",
					{
						username: "Jan",
						surname: "Kowalski",
						age: 60,
					}
				);

				assert.deepStrictEqual(60, person.age);

				const {
					items: [updated_person],
				} = await rest_api.patch(
					`/api/v1/collections/people/${person.id}`,
					{
						age: 22,
					}
				);

				assert.deepStrictEqual(updated_person.age, 22);
				assert.deepStrictEqual(
					updated_person.name_and_surname,
					"Jan Kowalski"
				);
			}
		));

	it("throws when the value returned from deriving_fn is unnacceptable by target_field_type of derived-value", async () => {
		const str = 555;
		await withRunningApp(
			extend<FieldTypes.Int>({
				fields: ["username", "surname"],
				deriving_fn: async (_, __: string, ___: string) => str,
			}),
			async ({ app, rest_api }) => {
				await assertThrowsAsync(
					async () => {
						await rest_api.post("/api/v1/collections/people", {
							username: "Jan",
							surname: "Kowalski",
						});
					},
					(error) => {
						assert.deepStrictEqual(
							error.response.data.data.field_messages
								.name_and_surname.message,
							app.i18n("invalid_text", [str, typeof str])
						);
					}
				);
			}
		);

		it("should init the base field with the given app", () =>
			withRunningApp(
				(app_class: TestAppConstructor) => {
					return class extends app_class {
						collections = {
							...TestApp.BaseCollections,
							A: new (class extends Collection {
								fields = {
									simple: new FieldTypes.Text(),
									derived: new FieldTypes.DerivedValue(
										new FieldTypes.SingleReference("A"),
										{
											fields: ["simple"],
											deriving_fn: async (_, simple) => {
												return "any_id"; // this isn't a proper ID, and the SingleReference should detect that by being able to access the `this.app` instance and reading the database. If any other error than "bad id" will be thrown, it means that the base field is not initiated properly
											},
										}
									),
								};
							})(),
						};
					};
				},
				async ({ app }) => {
					await assertThrowsAsync(
						() =>
							app.collections.A.create(new app.SuperContext(), {
								simple: "anything",
							}),
						(error) =>
							assert.strictEqual(error.message, "Invalid values!")
					);
				}
			));
	});

	it("avoids a race condition when there is a derived field and a before:edit listener on the collection", () =>
		withRunningApp(
			(test_class) =>
				class extends test_class {
					collections = {
						...TestApp.BaseCollections,
						products: new (class Products extends Collection {
							fields: Record<string, Field> = {
								name: new FieldTypes.Text(),
								category: new FieldTypes.DerivedValue(
									new FieldTypes.Text(),
									{
										fields: ["name"],
										deriving_fn: async (
											_,
											name: string
										) => {
											await sleep(0);
											return `${name} after sleep`;
										},
									}
								),
							};

							async init(app: App, name: string): Promise<void> {
								await super.init(app, name);

								this.on(
									"before:edit",
									async ([context, product]) => {
										await product.decode(context);
										product.get("name");
										await sleep(100);
										product.get("name"); // should throw an error "decode first" if there's a race condition
									}
								);
							}
						})(),
					};
				},
			async ({ app }) => {
				const product = await app.collections.products.create(
					new app.SuperContext(),
					{ name: "aaa" }
				);
				product.setMultiple({ name: "bbb" });
				await product.save(new app.SuperContext());
			}
		));
});
