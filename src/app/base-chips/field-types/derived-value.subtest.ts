import assert from "assert";
import { withStoppedApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import {
	App,
	Collection,
	FieldTypes,
	FieldDefinitionHelper as field,
	Field,
} from "../../../main";
import { DerivingFn } from "./derived-value";

function make_test_collection<T extends Field>(
	app: App,
	derived_value_params: {
		deriving_fn: DerivingFn<T>;
		fields: string[];
	}
) {
	Collection.fromDefinition(app, {
		name: "people",
		fields: [
			field("username", FieldTypes.Text, {}, true),
			field("surname", FieldTypes.Text, {}, true),
			field("name_and_surname", FieldTypes.DerivedValue, {
				base_field_type: FieldTypes.Text,
				base_field_params: {},
				...derived_value_params,
			}),
			field("age", FieldTypes.Int),
		],
	});
}

describe("derived-value", () => {
	it("throws when deriving_fn param is not a function", async () =>
		withStoppedApp(async ({ app }) => {
			assert.throws(
				() =>
					make_test_collection(app, {
						fields: ["username", "surname"],
						// @ts-ignore
						deriving_fn: "definitely not a function",
					}),
				/Error: 'deriving_fn' param in name_and_surname derived-value field is not a function./
			);
		}));

	it("throws when field param is not an array", async () =>
		withStoppedApp(async ({ app }) => {
			assert.throws(
				() =>
					make_test_collection(app, {
						// @ts-ignore
						fields: "definitely not an array",
						// @ts-ignore
						deriving_fn: () => {},
					}),
				/Error: 'fields' param in name_and_surname derived-value field is not an array./
			);
		}));

	it("throws when at least one of the elements of fields param is not declared in the collection", async () =>
		withStoppedApp(async ({ app }) => {
			assert.throws(
				() =>
					make_test_collection(app, {
						fields: ["username", "shoe_size"],
						// @ts-ignore
						deriving_fn: () => {},
					}),
				(error) =>
					error.message ===
					`Missing declaration for fields from derived-value params: 'shoe_size' in people collection. REMEMBER: 'derived-value' field must be declared *after* the fields it depends on.`
			);
		}));

	it("throws an error if given value that is not proper for some field", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			make_test_collection(app, {
				fields: ["username", "surname"],
				deriving_fn: async (username: string, surname: string) =>
					`${username} ${surname}`,
			});

			await app.start();

			assertThrowsAsync(
				async () => {
					await rest_api.post("/api/v1/collections/people", {
						username: "Antoine",
						surname: 123123,
					});
				},
				(error) =>
					assert.deepEqual(
						error.response.data.data.surname.message,
						"Type of 123123 is number, not string."
					)
			);
		}));

	it("properly reacts to pre:create handler", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			make_test_collection(app, {
				fields: ["username", "surname"],
				deriving_fn: async (username: string, surname: string) =>
					`${username} ${surname}`,
			});

			await app.start();

			const person = await rest_api.post("/api/v1/collections/people", {
				username: "Jan",
				surname: "Kowalski",
			});

			assert.deepEqual("Jan Kowalski", person.name_and_surname);
		}));

	it("properly reacts to pre:edit handler", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			make_test_collection(app, {
				fields: ["username", "surname"],
				deriving_fn: async (username: string, surname: string) =>
					`${username} ${surname}`,
			});

			await app.start();

			const person = await rest_api.post("/api/v1/collections/people", {
				username: "Jan",
				surname: "Kowalski",
			});

			assert.deepEqual("Jan Kowalski", person.name_and_surname);

			const updated_person = await rest_api.patch(
				`/api/v1/collections/people/${person.id}`,
				{
					username: "Janusz",
				}
			);

			assert.deepEqual(updated_person.item.username, "Janusz");

			assert.deepEqual(
				updated_person.item.name_and_surname,
				"Janusz Kowalski"
			);

			const updated_person2 = await rest_api.patch(
				`/api/v1/collections/people/${person.id}`,
				{
					username: "John",
					surname: "Doe",
				}
			);
			assert.deepEqual(updated_person2.item.username, "John");
			assert.deepEqual(updated_person2.item.surname, "Doe");
			assert.deepEqual(updated_person2.item.name_and_surname, "John Doe");
		}));

	it("value isn't undefined after edit on fields other than the ones concerning derived_value", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			make_test_collection(app, {
				fields: ["username", "surname"],
				deriving_fn: async (username: string, surname: string) =>
					`${username} ${surname}`,
			});

			await app.start();

			const person = await rest_api.post("/api/v1/collections/people", {
				username: "Jan",
				surname: "Kowalski",
				age: 60,
			});

			assert.deepEqual(60, person.age);

			const updated_person = await rest_api.patch(
				`/api/v1/collections/people/${person.id}`,
				{
					age: 22,
				}
			);

			assert.deepEqual(updated_person.item.age, 22);
			assert.deepEqual(
				updated_person.item.name_and_surname,
				"Jan Kowalski"
			);
		}));
	it("throws when the value returned from deriving_fn is unnacceptable by target_field_type of derived-value", async () =>
		withStoppedApp(async ({ app, rest_api }) => {
			make_test_collection(app, {
				fields: ["username", "surname"],
				deriving_fn: async (_: string, __: string) => 555,
			});

			await app.start();

			await assertThrowsAsync(
				async () => {
					await rest_api.post("/api/v1/collections/people", {
						username: "Jan",
						surname: "Kowalski",
					});
				},
				(error) => {
					assert.deepEqual(
						error.response.data.data.name_and_surname.message,
						"Type of 555 is number, not string."
					);
				}
			);
		}));
});
