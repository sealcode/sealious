import assert from "assert";
import type Policy from "../../chip-types/policy";
import {
	ActionName,
	App,
	Collection,
	FieldTypes,
	Policies,
	Context,
} from "../../main";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import type MockRestApi from "../../test_utils/rest-api";
import { TestApp } from "../../test_utils/test-app";
import {
	TestAppConstructor,
	withRunningApp,
} from "../../test_utils/with-test-app";
import Matches from "../base-chips/special_filters/matches";

const extend =
	(policies: {
		[action_name in ActionName]?: Policy;
	}) =>
	(t: TestAppConstructor) => {
		const Numbers = new (class extends Collection {
			name = "numbers";
			fields = {
				number: new FieldTypes.Int(),
			};
			named_filters = {
				greater_than_1: new Matches("numbers", {
					number: { ">": 1 },
				}),
			};
			policies = policies;
		})();

		const NumberNotes = new (class extends Collection {
			name = "number-notes";
			fields = {
				note: new FieldTypes.Text(),
				number: new FieldTypes.SingleReference("numbers"),
			};
			policies = {
				create: new Policies.SameAsForResourceInField({
					action_name: "create",
					field: "number",
					collection_name: "number-notes",
				}),
				show: new Policies.SameAsForResourceInField({
					action_name: "show",
					field: "number",
					collection_name: "number-notes",
				}),
				edit: new Policies.SameAsForResourceInField({
					action_name: "edit",
					field: "number",
					collection_name: "number-notes",
				}),
				list: new Policies.SameAsForResourceInField({
					action_name: "list",
					field: "number",
					collection_name: "number-notes",
				}),
			};
		})();

		return class extends t {
			collections = {
				...TestApp.BaseCollections,
				"number-notes": NumberNotes,
				numbers: Numbers,
			};
		};
	};

describe("SameAsForResourceInField", () => {
	const sessions: { [username: string]: any } = {};
	const numbers: number[] = [];
	async function setup(app: App, rest_api: MockRestApi) {
		numbers.splice(0, numbers.length); // to clear the array;

		const password = "password";
		for (const username of ["alice", "bob"]) {
			await app.collections.users.suCreate({
				username,
				password,
			});
			sessions[username] = await rest_api.login({
				username,
				password,
			});
		}

		for (const n of [0, 1, 2]) {
			numbers.push(
				(
					await rest_api.post(
						"/api/v1/collections/numbers",
						{
							number: n,
						},
						sessions.alice
					)
				).id
			);
		}
	}

	async function post_number_notes(rest_api: MockRestApi, user: string) {
		const notes = [];
		for (const number of numbers) {
			notes.push(
				await rest_api.post(
					"/api/v1/collections/number-notes",
					{
						note: `Lorem ipsum ${notes.length + 1}`,
						number: number,
					},
					sessions[user]
				)
			);
		}
		return notes;
	}

	it("returns everything for number-notes referring to own numbers", () =>
		withRunningApp(
			extend({
				create: new Policies.Public(),
				show: new Policies.Owner(),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);

				const posted_notes = await post_number_notes(rest_api, "alice");

				const { items: got_notes } = await rest_api.get(
					"/api/v1/collections/number-notes",
					sessions.alice
				);

				assert.strictEqual(got_notes.length, posted_notes.length);
			}
		));

	it("returns nothing for number-notes referring to other user's numbers", () =>
		withRunningApp(
			extend({
				create: new Policies.Public(),
				show: new Policies.Owner(),
				list: new Policies.Owner(),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);

				await post_number_notes(rest_api, "alice");

				const { items: got_notes } = await rest_api.get(
					"/api/v1/collections/number-notes",
					sessions.bob
				);

				assert.strictEqual(got_notes.length, 0);
			}
		));

	it("returns item for number-notes referring to numbers with complex access strategy", () =>
		withRunningApp(
			extend({
				create: new Policies.LoggedIn(),
				list: new Policies.Or([
					new Policies.Owner(),
					new Policies.If(
						"numbers",
						"greater_than_1",
						Policies.Public
					),
				]),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);

				await post_number_notes(rest_api, "alice");

				const { items: got_notes } = await rest_api.get(
					"/api/v1/collections/number-notes",
					sessions.bob
				);

				assert.strictEqual(got_notes.length, 1);
			}
		));

	it("doesn't allow to edit number-notes referring to other user's numbers", () =>
		withRunningApp(
			extend({
				create: new Policies.LoggedIn(),
				edit: new Policies.Owner(),
				show: new Policies.Owner(),
			}),
			async ({ app, rest_api }) => {
				await setup(app, rest_api);
				const posted_notes = await post_number_notes(rest_api, "alice");

				await assertThrowsAsync(() =>
					rest_api.patch(
						`/api/v1/collections/number-notes/${
							posted_notes[0].id as string
						}`,
						{ note: "Lorem ipsumm" },
						sessions.bob
					)
				);
			}
		));

	it("works on reverse single reference fields", () =>
		withRunningApp(
			(t) =>
				class extends t {
					collections = {
						...TestApp.BaseCollections,
						organizations: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								user_assignments:
									new FieldTypes.ReverseSingleReference({
										referencing_collection:
											"user_organizations",
										referencing_field: "organization",
									}),
							};
							policies = {
								list: new Policies.Or([
									new Policies.SameAsForResourceInField({
										collection_name: "organizations",
										action_name: "show",
										field: "user_assignments",
									}),
									new Policies.Super(),
								]),
							};
						})(),
						user_organizations: new (class extends Collection {
							fields = {
								user: new FieldTypes.SingleReference("users"),
								organization: new FieldTypes.SingleReference(
									"organizations"
								),
							};
							policies = {
								show: new Policies.UserReferencedInField(
									"user"
								),
							};
						})(),
						projects: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								organization: new FieldTypes.SingleReference(
									"organizations"
								),
							};
							policies = {
								list: new Policies.SameAsForResourceInField({
									collection_name: "projects",
									field: "organization",
									action_name: "list",
								}),
								show: new Policies.SameAsForResourceInField({
									collection_name: "projects",
									field: "organization",
									action_name: "list",
								}),
								edit: new Policies.SameAsForResourceInField({
									collection_name: "projects",
									field: "organization",
									action_name: "list",
								}),
							};
						})(),
					};
				},
			async ({ app }) => {
				const user1 = await app.collections.users.suCreate({
					username: "user1",
					password: "user1user1",
				});
				const user1_context = new Context(app, Date.now(), user1.id);

				const user2 = await app.collections.users.suCreate({
					username: "user2",
					password: "user2user2",
				});
				const user2_context = new Context(app, Date.now(), user2.id);

				const org1 = await app.collections.organizations.suCreate({
					name: "org1",
				});
				await app.collections.user_organizations.suCreate({
					user: user1.id,
					organization: org1.id,
				});

				const org2 = await app.collections.organizations.suCreate({
					name: "org2",
				});
				await app.collections.user_organizations.suCreate({
					user: user2.id,
					organization: org2.id,
				});

				const project = await app.collections.projects.suCreate({
					organization: org1.id,
					name: "project1",
				});
				assert.strictEqual(
					(
						await app.collections.organizations
							.list(user1_context)
							.fetch()
					).items.length,
					1
				);
				assert.strictEqual(
					(
						await app.collections.organizations
							.list(user2_context)
							.fetch()
					).items.length,
					1
				);

				const { items: projects1 } = await app.collections.projects
					.list(user1_context)
					.fetch();

				assert.strictEqual(projects1.length, 1);
				assert.strictEqual(projects1[0].get("name"), "project1");
				assert.strictEqual(projects1[0].id, project.id);
				assert.strictEqual(projects1[0].get("organization"), org1.id);

				assert.strictEqual(
					(await app.collections.projects.list(user2_context).fetch())
						.items.length,
					0
				);

				await assertThrowsAsync(
					async () =>
						app.collections.projects.getByID(
							user2_context,
							project.id
						),

					(e) => {
						assert.notStrictEqual(e, null);
					}
				);

				await assertThrowsAsync(async () =>
					(await app.collections.projects.suGetByID(project.id))
						.set("name", "takeover")
						.save(user2_context)
				);
			}
		));

	it("behaves properly for SingleReference field", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						organizations: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								user_assignments:
									new FieldTypes.ReverseSingleReference({
										referencing_collection:
											"user-organization",
										referencing_field: "organization",
									}),
							};

							defaultPolicy = new Policies.Super();

							policies = {
								list: new Policies.Or([
									new Policies.SameAsForResourceInField({
										collection_name: "organizations",
										action_name: "list",
										field: "user_assignments",
									}),
								]),
							};
						})(),
						"user-organization":
							new (class UserOrganization extends Collection {
								fields = {
									organization:
										new FieldTypes.SingleReference(
											"organizations"
										),
									user: new FieldTypes.SingleReference(
										"users"
									),
								};

								defaultPolicy = new Policies.Super();

								policies = {
									list: new Policies.Or([
										new Policies.UserReferencedInField(
											"user"
										),
										new Policies.Super(),
									]),
								};
							})(),
						projects: new (class Projects extends Collection {
							fields = {
								name: FieldTypes.Required(
									new FieldTypes.Text()
								),
								latest_job: new FieldTypes.SingleReference(
									"jobs"
								),
								organization: new FieldTypes.SingleReference(
									"organizations"
								),
							};
							policies = {
								list: new Policies.SameAsForResourceInField({
									collection_name: "projects",
									field: "organization",
									action_name: "list",
								}),
								create: new Policies.Super(),
								edit: new Policies.Super(),
							};
						})(),
						jobs: new (class Job extends Collection {
							fields = {
								project: new FieldTypes.SingleReference(
									"projects"
								),
								result: new FieldTypes.Text(),
							};

							policies = {
								list: new Policies.SameAsForResourceInField({
									collection_name: "jobs",
									action_name: "list",
									field: "project",
								}),
								create: new Policies.Super(),
								edit: new Policies.Super(),
							};
						})(),
					};
				},
			async ({ app }) => {
				const user = await app.collections.users.suCreate({
					username: "author",
					password: "anyanyanyany",
				});
				const organization =
					await app.collections.organizations.suCreate({
						name: "org",
					});
				await app.collections["user-organization"].suCreate({
					user: user.id,
					organization: organization.id,
				});
				const project = await app.collections.projects.suCreate({
					name: "any",
					organization: organization.id,
				});
				const job = await app.collections.jobs.suCreate({
					project: project.id,
					result: "I'm a job",
				});
				const invisible_project =
					await app.collections.projects.suCreate({
						name: "invisible",
					});
				await app.collections.jobs.suCreate({
					project: invisible_project.id,
					result: "I'm an invisible job",
				});
				const { items: user_visible_jobs } = await app.collections.jobs
					.list(new Context(app, Date.now(), user.id))
					.fetch();
				assert.strictEqual(user_visible_jobs.length, 1);
			}
		));
});
