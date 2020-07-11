import axios from "axios";
import assert from "assert";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { withRunningApp, withStoppedApp } from "../../test_utils/with-test-app";
import { AccessStrategies } from "../../main";

describe("registration-intents", () => {
	it("doesn't allow setting a role for registration intention when the user in context can't create user-roles", async () =>
		withRunningApp(async ({ app, base_url }) => {
			app.collections["user-roles"].setAccessStrategy({
				create: AccessStrategies.Noone,
			});
			await assertThrowsAsync(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/registration-intents`,
						{
							email: "cunning@fox.com",
							role: "admin",
						}
					),
				(e: any) => {
					assert.equal(
						e.response.data.data.role.message,
						"you can't create user-roles - because  noone is allowed"
					);
				}
			);
		}));

	it("allows setting a role for registration intention when the user in context can create user-roles", async () =>
		withStoppedApp(async ({ app, base_url }) => {
			app.ConfigManager.set("roles", ["admin"]);
			await app.start();
			app.collections["user-roles"].setAccessStrategy({
				create: AccessStrategies.Public,
			});
			const intent = (
				await axios.post(
					`${base_url}/api/v1/collections/registration-intents`,
					{
						email: "genuine@fox.com",
						role: "admin",
					}
				)
			).data;
			assert.equal(intent.role, "admin");

			const { role } = await app.runAction(
				new app.SuperContext(),
				["collections", "registration-intents", intent.id],
				"show"
			);

			assert.equal(role, "admin");
		}));
});
