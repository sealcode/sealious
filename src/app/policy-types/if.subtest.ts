import assert from "assert";
import { withRunningApp } from "../../test_utils/with-test-app";
import {
	App,
	Collection,
	FieldTypes,
	Policies,
	SpecialFilters,
} from "../../main";
import Matches from "../base-chips/special_filters/matches";
import { TestAppType } from "../../test_utils/test-app";

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
			numbers: new (class extends Collection {
				fields = {
					number: new FieldTypes.Int(),
					number_str: new FieldTypes.Text(),
				};
				named_filters = {
					positive: new Matches("numbers", {
						number: { ">": 0 },
					}),
					negative: new Matches("numbers", {
						number: { "<": 0 },
					}),
				};
				defaultPolicy = new Policies.If(
					"numbers",
					"negative",
					Policies.LoggedIn,
					Policies.Public
				);
			})(),
		};
	};
}

async function createResources(app: App) {
	for (let number of [-1, 0, 1]) {
		await app.collections.numbers.suCreate({
			number,
			number_str: number.toString(),
		});
	}

	await app.collections.users.suCreate({
		username: "user",
		password: "password",
		email: "user@example.com",
		roles: [],
	});
}

describe("if", () => {
	it("should only use 'when_true' access strategy when the item passes the filter", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await createResources(app);
			const session = await rest_api.login({
				username: "user",
				password: "password",
			});

			const { items: resources_when_logged_in } = await rest_api.get(
				"/api/v1/collections/numbers?sort[number]=asc",
				session
			);

			assert.equal(resources_when_logged_in.length, 3);
			assert.equal(resources_when_logged_in[0].number, -1);
		}));

	it("should only use 'when_false' access strategy when the item doesn't pass the filter", async () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await createResources(app);

			const { items: public_resources } = await rest_api.get(
				"/api/v1/collections/numbers?sort[number]=asc"
			);

			assert.equal(public_resources.length, 2);
		}));

	it("should work properly with a boolean field set to false", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...test_app.BaseCollections,
						tasks: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								done: new FieldTypes.Boolean(),
							};

							named_filters = {
								todo: new SpecialFilters.Matches("tasks", {
									done: false,
								}),
							};
							policies = {
								list: new Policies.If(
									"tasks",
									"todo",
									new Policies.Public(),
									new Policies.Noone()
								),
							};
						})(),
					};
				},
			async ({ app, rest_api }) => {
				const data = {
					username: "user",
					password: "passwordpassword",
				};
				await app.collections.users.create(
					new app.SuperContext(),
					data
				);
				const session = await rest_api.login(data);

				await rest_api.get("/api/v1/collections/tasks", session);
			}
		));
});
