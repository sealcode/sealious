const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const { with_running_app, with_stopped_app } = locreq(
	"test_utils/with-test-app.js"
);
const assert_throws_async = locreq("test_utils/assert_throws_async.js");

const make_test_collection = (app, derived_value_params) => () =>
	app.createChip(app.Sealious.Collection, {
		name: "people",
		fields: [
			{
				name: "username",
				type: "text",
				required: true,
			},
			{
				name: "surname",
				type: "text",
				required: true,
			},
			{
				name: "name_and_surname",
				type: "derived-value",
				params: {
					base_field_type: { name: "text" },
					...derived_value_params,
				},
			},
			{ name: "age", type: "int" },
		],
	});

describe("derived-value", () => {
	it("throws when derived_fn param is not a function", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await assert_throws_async(
				make_test_collection(app, {
					fields: ["username", "surname"],
					derived_fn: "definitely not a function",
				}),
				error => {
					assert.equal(
						error,
						`Error: 'derived_fn' param in name_and_surname derived-value field is not a function.`
					);
				}
			);
		}));

	it("throws when field param is not an array", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await assert_throws_async(
				make_test_collection(app, {
					fields: "definitely not an array",
					derived_fn: () => {},
				}),
				error => {
					assert.equal(
						error,
						`Error: 'fields' param in name_and_surname derived-value field is not an array.`
					);
				}
			);
		}));

	it("throws when at least one of the elements of fields param is not declared in the collection", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await assert_throws_async(
				make_test_collection(app, {
					fields: ["username", "shoe_size"],
					derived_fn: () => {},
				}),
				error => {
					assert.equal(
						error,
						`Error: Missing declaration for fields from derived-value params: 'shoe_size' in people collection. REMEMBER: 'derived-value' field must be declared *after* the fields it depends on.`
					);
				}
			);
		}));

	it("throws an error if given value that is not proper for some field", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await make_test_collection(app, {
				fields: ["username", "surname"],
				derived_fn: async (username, surname) =>
					`${username} ${surname}`,
			})();

			await assert_throws_async(
				async () => {
					const person = await rest_api.post(
						"/api/v1/collections/people",
						{
							username: "Antoine",
							surname: 123123,
						}
					);
				},
				error =>
					assert.deepEqual(
						error.response.data.data.surname.message,
						"Type of 123123 is number, not string."
					)
			);
		}));

	it("properly reacts to pre:create handler", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await make_test_collection(app, {
				fields: ["username", "surname"],
				derived_fn: async (username, surname) =>
					`${username} ${surname}`,
			})();

			const person = await rest_api.post("/api/v1/collections/people", {
				username: "Jan",
				surname: "Kowalski",
			});

			assert.deepEqual("Jan Kowalski", person.body.name_and_surname);
		}));

	it("properly reacts to pre:edit handler", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await make_test_collection(app, {
				fields: ["username", "surname"],
				derived_fn: async (username, surname) =>
					`${username} ${surname}`,
			})();

			const person = await rest_api.post("/api/v1/collections/people", {
				username: "Jan",
				surname: "Kowalski",
			});

			assert.deepEqual("Jan Kowalski", person.body.name_and_surname);

			const updated_person = await rest_api.patch(
				`/api/v1/collections/people/${person.id}`,
				{
					username: "Janusz",
				}
			);

			assert.deepEqual(updated_person.body.username, "Janusz");
			assert.deepEqual(
				updated_person.body.name_and_surname,
				"Janusz Kowalski"
			);

			const updated_person2 = await rest_api.patch(
				`/api/v1/collections/people/${person.id}`,
				{
					username: "John",
					surname: "Doe",
				}
			);
			assert.deepEqual(updated_person2.body.username, "John");
			assert.deepEqual(updated_person2.body.surname, "Doe");
			assert.deepEqual(updated_person2.body.name_and_surname, "John Doe");
		}));

	it("value isn't undefined after edit on fields other than the ones conerning derived_value", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await make_test_collection(app, {
				fields: ["username", "surname"],
				derived_fn: async (username, surname) =>
					`${username} ${surname}`,
			})();

			const person = await rest_api.post("/api/v1/collections/people", {
				username: "Jan",
				surname: "Kowalski",
				age: 60,
			});

			assert.deepEqual(60, person.body.age);

			const updated_person = await rest_api.patch(
				`/api/v1/collections/people/${person.id}`,
				{
					age: 22,
				}
			);

			assert.deepEqual(updated_person.body.age, 22);
			assert.deepEqual(
				updated_person.body.name_and_surname,
				"Jan Kowalski"
			);
		}));
	it("throws when the value returned from derived_fn is unnacceptable by target_field_type of derived-value", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await make_test_collection(app, {
				fields: ["username", "surname"],
				derived_fn: async (username, surname) => 555,
			})();

			await assert_throws_async(
				async () => {
					const person = await rest_api.post(
						"/api/v1/collections/people",
						{
							username: "Jan",
							surname: "Kowalski",
						}
					);
				},
				error => {
					assert.deepEqual(
						error.response.data.data.name_and_surname.message,
						"Type of 555 is number, not string."
					);
				}
			);
		}));
});
