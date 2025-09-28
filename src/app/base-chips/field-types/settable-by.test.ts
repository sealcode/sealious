import assert from "assert";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import {
	App,
	Collection,
	Context,
	FieldTypes,
	Policies,
	Policy,
	QueryTypes,
} from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { post } from "../../../test_utils/http_request.js";
import Users from "../../collections/users.js";

function extend(t: TestAppConstructor) {
	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			"forbidden-collection": new (class extends Collection {
				fields = {
					any: new FieldTypes.SettableBy(
						new FieldTypes.Int(),
						new Policies.Noone()
					),
				};
			})(),
			"allowed-collection": new (class extends Collection {
				fields = {
					any: new FieldTypes.SettableBy(
						new FieldTypes.Int(),
						new Policies.Public()
					),
				};
			})(),
		};
	};
}

describe("settable-by", () => {
	it("should not allow any value when rejected by access strategy", async () =>
		withRunningApp(extend, async ({ base_url }) => {
			await assertThrowsAsync(
				() =>
					post(
						`${base_url}/api/v1/collections/forbidden-collection`,
						{
							any: "thing",
						}
					),
				(e) =>
					assert.equal(
						e.response.data.data.field_messages.any.message,
						`Noone is allowed.`
					)
			);
		}));

	it("should allow proper value when accepted by access strategy", async () =>
		withRunningApp(extend, async ({ base_url, rest_api }) => {
			const response = await post(
				`${base_url}/api/v1/collections/allowed-collection`,
				{
					any: 1,
				}
			);
			assert.equal(response.any, 1);

			const {
				items: [created_item],
			} = await rest_api.get(
				`/api/v1/collections/allowed-collection/${response.id}`
			);
			assert.equal(created_item.any, 1);
		}));

	it("should not allow invalid value when access strategy allows", async () =>
		withRunningApp(extend, async ({ base_url }) => {
			const value = "thing";
			await assertThrowsAsync(
				() =>
					post(`${base_url}/api/v1/collections/allowed-collection`, {
						any: value,
					}),
				(e) => {
					assert.equal(
						e.response.data.data.field_messages.any.message,
						`Value '${value}' is not a int number format.`
					);
				}
			);
		}));

	it("uses the transition checker from the inner field", async () => {
		await withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...App.BaseCollections,
						history: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								timestamp: new FieldTypes.SettableBy(
									new FieldTypes.Int().setTransitionChecker(
										async ({ old_value, new_value }) => {
											return old_value == undefined ||
												parseInt(String(new_value)) >
													old_value
												? { valid: true }
												: {
														valid: false,
														reason: "timestamps cannot go back in time",
													};
										}
									),
									new Policies.Public()
								),
							};
						})(),
					};
				},
			async ({ app }) => {
				const event = await app.collections.history.suCreate({
					timestamp: 0,
				});

				event.set("timestamp", 1);
				await event.save(new app.SuperContext());

				await assertThrowsAsync(async () => {
					event.set("timestamp", 0);
					await event.save(new app.SuperContext());
				});
			}
		);
	});

	it("lets create an item with an empty value when setting the value is forbidden", async () => {
		class Roles extends Policy {
			static type_name = "roles";
			allowed_roles: string[];
			constructor(allowed_roles: string[]) {
				super(allowed_roles);
				this.allowed_roles = allowed_roles;
			}

			async countMatchingRoles(context: Context) {
				const user_id = context.user_id as string;
				context.app.Logger.debug2(
					"ROLES",
					"Checking the roles for user",
					user_id
				);
				const roles = await context.getRoles();

				return this.allowed_roles.filter((allowed_role) =>
					roles.includes(allowed_role)
				).length;
			}

			async _getRestrictingQuery(context: Context) {
				if (context.is_super) {
					return new QueryTypes.AllowAll();
				}
				if (context.user_id === null) {
					return new QueryTypes.DenyAll();
				}

				const matching_roles_count =
					await this.countMatchingRoles(context);

				return matching_roles_count > 0
					? new QueryTypes.AllowAll()
					: new QueryTypes.DenyAll();
			}

			async checkerFunction(context: Context) {
				if (context.user_id === null) {
					return Policy.deny(`You are not logged in.`);
				}
				const matching_roles_count =
					await this.countMatchingRoles(context);

				return matching_roles_count > 0
					? Policy.allow(
							`You have one of the roles: ${this.allowed_roles.join(", ")}.`
						)
					: Policy.deny(
							`You don't have any of the roles: ${this.allowed_roles.join(", ")}.`
						);
			}
		}

		class _Users extends Users {
			fields = {
				...App.BaseCollections.users.fields,
				email: new FieldTypes.Email().setRequired(true),
				roles: new FieldTypes.SettableBy(
					new FieldTypes.StructuredArray({
						role: new FieldTypes.Text(),
					}),
					new Roles(["admin"])
				),
				type: new FieldTypes.DisallowUpdate(
					new FieldTypes.Enum(<const>["organization", "worker"])
				),
				phone: new FieldTypes.PhoneNumber(),
				refcode: new FieldTypes.Text(),
				real_name: new FieldTypes.Text(),
				real_surname: new FieldTypes.Text(),
			};

			defaultPolicy = new Policies.Or([
				new Policies.Themselves(),
				new Roles(["admin"]),
			]);

			policies = {
				create: new Policies.Public(),
				show: new Policies.Or([
					new Policies.Themselves(),
					new Roles(["admin"]),
				]),
			};
		}

		await withRunningApp(
			(t) => {
				return class extends t {
					collections = {
						...App.BaseCollections,
						users: new _Users(),
						history: new (class extends Collection {
							fields = {
								title: new FieldTypes.Text(),
								event: new FieldTypes.SettableBy(
									new FieldTypes.StructuredArray({
										type: new FieldTypes.Text(),
									}),
									new Roles(["admin"])
								),
							};
						})(),
					};
				};
			},
			async ({ app }) => {
				const user = await app.collections.users.suCreate({
					username: "test",
					password: "testtest",
					email: "test@test.com",
				});
				const context = new app.Context({ user_id: user.id });
				await app.collections.history.create(context, {
					title: "Some title",
				});
			}
		);
	});
});
