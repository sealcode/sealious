import assert from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { Collection, FieldTypes, Field } from "../../../main";
import { DerivingFn } from "./derived-value";
import { TestAppType } from "../../../test_utils/test-app";

const extend = <T extends Field = FieldTypes.Text>(derived_value_params: {
	deriving_fn: DerivingFn<T>;
	fields: string[];
}) => (t: TestAppType) => {
	return class extends t {
		collections = {
			...t.BaseCollections,
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
				deriving_fn: async (username: string, surname: string) =>
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

				assert.deepEqual(person.name_and_surname, "Jan Kowalski");
			}
		));

	it("properly reacts to pre:edit handler", async () =>
		withRunningApp(
			extend({
				fields: ["username", "surname"],
				deriving_fn: async (username: string, surname: string) =>
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

				assert.deepEqual("Jan Kowalski", person.name_and_surname);

				const {
					items: [updated_person],
				} = await rest_api.patch(
					`/api/v1/collections/people/${person.id}`,
					{
						username: "Janusz",
					}
				);

				assert.deepEqual(updated_person.username, "Janusz");

				assert.deepEqual(
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

				assert.deepEqual(updated_person2.username, "John");
				assert.deepEqual(updated_person2.surname, "Doe");
				assert.deepEqual(updated_person2.name_and_surname, "John Doe");
			}
		));

	it("value isn't undefined after edit on fields other than the ones concerning derived_value", async () =>
		withRunningApp(
			extend({
				fields: ["username", "surname"],
				deriving_fn: async (username: string, surname: string) =>
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

				assert.deepEqual(60, person.age);

				const {
					items: [updated_person],
				} = await rest_api.patch(
					`/api/v1/collections/people/${person.id}`,
					{
						age: 22,
					}
				);

				assert.deepEqual(updated_person.age, 22);
				assert.deepEqual(
					updated_person.name_and_surname,
					"Jan Kowalski"
				);
			}
		));

	it("throws when the value returned from deriving_fn is unnacceptable by target_field_type of derived-value", async () =>
		withRunningApp(
			extend<FieldTypes.Int>({
				fields: ["username", "surname"],
				deriving_fn: async (_: string, __: string) => 555,
			}),
			async ({ rest_api }) => {
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
			}
		));
});
