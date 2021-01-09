import assert from "assert";
import axios from "axios";
import { App, CollectionItem } from "../../main";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import MockRestApi from "../../test_utils/rest-api";
import { withRunningApp } from "../../test_utils/with-test-app";
import Users from "./users";

function createAUser(app: App, username: string) {
	return app.collections.users.suCreate({
		username,
		email: `${username}@example.com`,
		password: "password",
		roles: [],
	});
}

type Unpromisify<T> = T extends Promise<infer R> ? R : T;

async function createAdmin(
	app: App,
	rest_api: MockRestApi
): Promise<
	[CollectionItem<Users>, Unpromisify<ReturnType<typeof rest_api.login>>]
> {
	const user = await createAUser(app, "super_user");
	await app.collections["user-roles"].suCreate({
		user: user.id,
		role: "admin",
	});
	const session = await rest_api.login({
		username: "super_user",
		password: "password",
	});
	return [user, session];
}

describe("user-roles", () => {
	it("rejects when given an empty role", async () =>
		withRunningApp(null, async ({ app, rest_api }) => {
			const [user, session] = await createAdmin(app, rest_api);
			await assertThrowsAsync(
				async () => {
					return rest_api.post(
						`/api/v1/collections/user-roles`,
						{
							user: user.id,
						},
						session
					);
				},
				(e: any) => {
					assert.equal(
						e?.response.data.data.role?.message,
						"Missing value for field 'role'."
					);
				}
			);
		}));

	it("accepts correct dataset", async () =>
		withRunningApp(null, async ({ app, base_url, rest_api }) => {
			const [user, session] = await createAdmin(app, rest_api);
			const response = await axios.post(
				`${base_url}/api/v1/collections/user-roles`,
				{
					user: user.id,
					role: "admin",
				},
				session
			);
			assert.equal(response.status, 201);
		}));
});
