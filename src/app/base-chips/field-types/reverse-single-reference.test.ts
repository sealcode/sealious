/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import assert from "assert";
import Bluebird from "bluebird";
import { App, Collection, Collections, Field, FieldTypes, Policies } from "../../../main.js";
import type { CollectionResponse } from "../../../test_utils/rest-api.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { TestAppConstructor, withRunningApp } from "../../../test_utils/with-test-app.js";

const extend = (with_reverse = true, clear_database = true) =>
	function (t: TestAppConstructor) {
		const b_fields: { [name: string]: Field } = {
			number: new FieldTypes.Int(),
		};
		if (with_reverse) {
			b_fields.references_in_a = new FieldTypes.ReverseSingleReference({
				referencing_collection: "A",
				referencing_field: "reference_to_b",
			});
		}

		return class extends t {
			clear_database_on_stop = clear_database;
			collections = {
				...TestApp.BaseCollections,
				A: new (class extends Collection {
					fields = {
						reference_to_b: new FieldTypes.SingleReference("B"),
						pairity: new FieldTypes.Text(),
					};
				})(),
				B: new (class extends Collection {
					fields = b_fields;
				})(),
			};
		};
	};

describe("reverse-single-reference", () => {
	async function createResources(app: App) {
		const numbers = [1, 2, 3];
		const bs = await Bluebird.map(numbers, (number) =>
			app.collections.B.suCreate({
				number,
			})
		);

		for (const b of bs) {
			for (let i = 1; i <= (b.get("number") as number); i++) {
				await app.collections.A.suCreate({
					reference_to_b: b.id,
					pairity: i % 2 ? "odd" : "even",
				});
			}
		}
	}

	it("recreates the cached values if the field has just been added", async () => {
		await withRunningApp(
			extend(false, false),
			async ({ app }) => {
				await createResources(app);
			},
			"cache-recreate"
		);
		await withRunningApp(
			extend(true),
			async ({ rest_api }) => {
				const {
					items: [result],
				} = (await rest_api.get(
					"/api/v1/collections/B?filter[number]=1"
				)) as CollectionResponse<{ references_in_a: string }>;
				assert.ok(result.references_in_a);
				assert.strictEqual(result.references_in_a.length, 1);
				const {
					items: [result2],
				} = (await rest_api.get(
					"/api/v1/collections/B?filter[number]=2"
				)) as CollectionResponse<{ references_in_a: string }>;
				assert(result2.references_in_a);
				assert.strictEqual(result2.references_in_a.length, 2);
			},
			"cache-recreate"
		);
	});

	it("updates the cached value when a new reference is created", async () => {
		await withRunningApp(extend(true), async ({ app, rest_api }) => {
			await createResources(app);
			const {
				items: [result],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			)) as CollectionResponse;
			assert(result.references_in_a instanceof Array);
			assert.strictEqual(result.references_in_a.length, 2);
		});
	});

	it("updates the cached value when an old reference is deleted", async () =>
		withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...TestApp.BaseCollections,
						dogs: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								photos: new FieldTypes.ReverseSingleReference({
									referencing_collection: "dog_photos",
									referencing_field: "dog",
								}),
							};
						})(),
						dog_photos: new (class extends Collection {
							fields = {
								dog: new FieldTypes.SingleReference("dogs"),
								photo: new FieldTypes.Image(),
							};
						})(),
					};
				},
			async ({ app }) => {
				const dog = await app.collections.dogs.suCreate({ name: "Nora" });
				const first_photo = await app.collections.dog_photos.suCreate({ dog: dog.id });
				await app.collections.dog_photos.suCreate({ dog: dog.id });
				await first_photo.remove(new app.SuperContext());
				const {
					items: [dog_new],
				} = await app.collections.dogs.suList().attach({ photos: true }).fetch();
				assert.strictEqual(dog_new.getAttachments("photos").length, 1);
			}
		));

	it("updates the cached value when an old reference is edited to a new one", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			const {
				items: [result1],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=1"
			)) as CollectionResponse;
			const {
				items: [result2],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			)) as CollectionResponse<{ references_in_a: string }>;
			const referencing_id = result2.references_in_a[0];

			await rest_api.patch(`/api/v1/collections/A/${referencing_id}`, {
				reference_to_b: result1.id,
			});

			const {
				items: [new_result2],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			)) as CollectionResponse<{ references_in_a: string }>;
			assert.strictEqual(new_result2.references_in_a.length, 1);
			const {
				items: [new_result1],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=1"
			)) as CollectionResponse<{ references_in_a: string }>;
			assert.strictEqual(new_result1.references_in_a.length, 2);
		}));

	it("updates the cached value when an old reference is edited to an empty one", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			await rest_api.get("/api/v1/collections/B?filter[number]=1");
			const {
				items: [result2],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			)) as CollectionResponse<{ references_in_a: string }>;
			const referencing_id = result2.references_in_a[0];

			await rest_api.patch(`/api/v1/collections/A/${referencing_id}`, {
				reference_to_b: "",
			});
			const {
				items: [new_result2],
			} = (await rest_api.get(
				"/api/v1/collections/B?filter[number]=2"
			)) as CollectionResponse<{ references_in_a: string }>;
			assert.strictEqual(new_result2.references_in_a.length, 1);
		}));

	it("allows to filter by a value of the referencing resource", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			let { items: results } = (await rest_api.get(
				"/api/v1/collections/B?filter[references_in_a][pairity]=non-existant"
			)) as CollectionResponse;
			assert.strictEqual(results.length, 0);

			results = (
				(await rest_api.get(
					"/api/v1/collections/B?filter[references_in_a][pairity]=odd"
				)) as CollectionResponse
			).items;
			assert.strictEqual(results.length, 3);

			results = (
				(await rest_api.get(
					"/api/v1/collections/B?filter[references_in_a][pairity]=even&filter[number]=3"
				)) as CollectionResponse
			).items;
			assert.strictEqual(results.length, 1);
		}));

	it("allows to display the full body of the referencing resources", async () =>
		withRunningApp(extend(true), async ({ rest_api, app }) => {
			await createResources(app);
			const { items, attachments } = (await rest_api.get(
				"/api/v1/collections/B?attachments[references_in_a]=true"
			)) as CollectionResponse<{ references_in_a: string }>;

			const referenced_id = items[0].references_in_a[0];
			assert.strictEqual(attachments[referenced_id].pairity, "odd");
		}));

	it("handles nested attachments", async () =>
		withRunningApp(
			(test_app: TestAppConstructor) =>
				class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						organizations: new (class extends Collection {
							fields = {
								name: FieldTypes.Required(
									new FieldTypes.Text({
										full_text_search: true,
										min_length: 2,
										max_length: 16,
									})
								),
							};
						})(),
						"user-organization": new (class extends Collection {
							fields = {
								organization: FieldTypes.Required(
									new FieldTypes.SingleReference("organizations")
								),
								user: FieldTypes.Required(new FieldTypes.SingleReference("users")),
							};
						})(),
						users: new (class extends Collections.users {
							fields = {
								...App.BaseCollections.users.fields,
								description: new FieldTypes.Text(),
								organizations: new FieldTypes.ReverseSingleReference({
									referencing_collection: "user-organization",
									referencing_field: "user",
								}),
							};
							policies = {
								create: new Policies.Public(),
								show: new Policies.Public(),
							};
							defaultPolicy = new Policies.Public();
						})(),
					};
				},
			async ({ app, rest_api }) => {
				const user = await rest_api.post("/api/v1/collections/users", {
					username: "user1",
					password: "user1user1",
					email: "user1@example.com",
				});
				const org = await rest_api.post("/api/v1/collections/organizations", {
					name: "org",
				});
				await rest_api.post("/api/v1/collections/user-organization", {
					user: user.id,
					organization: org.id,
				});
				const response = await rest_api.get(
					"/api/v1/collections/users?attachments[organizations][organization]=true"
				);
				const rel_id = response.items[0].organizations[0];
				const org_id = response.attachments[rel_id].organization;
				assert.strictEqual(response?.attachments?.[org_id]?.name, "org");
				const db_response = await app.collections.users
					.suList()
					.attach({
						organizations: { organization: true },
					} as unknown as any)
					.fetch();
				assert.strictEqual(
					db_response.items[0]
						.getAttachments(
							/* @ts-ignore */
							"organizations"
						)[0]
						.getAttachments("organization")[0]
						.get("name"),
					"org"
				);

				const user2 = await rest_api.post("/api/v1/collections/users", {
					username: "user2",
					password: "user2user2",
					email: "user2@example.com",
				});
				const db_response2 = await app.collections.users
					.suList()
					.ids([user2.id])
					.attach({
						organizations: { organization: true },
					} as unknown as any)
					.fetch();

				assert.deepStrictEqual(
					db_response2.items[0].getAttachments(
						/* @ts-ignore */
						"organizations"
					),
					[]
				);
			}
		));
});
