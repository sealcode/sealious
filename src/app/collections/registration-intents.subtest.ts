import axios from "axios";
import assert from "assert";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { withRunningApp, withStoppedApp } from "../../test_utils/with-test-app";
import { Policies, Policy } from "../../main";
import { TestAppType } from "../../test_utils/test-app";
import Users from "./users";

const extend = (policy: Policy) => (t: TestAppType) =>
	class extends t {
		collections = {
			...t.BaseCollections,
			users: new (class extends Users {
				policy = {
					create: policy,
				};
			})(),
		};
	};

describe("registration-intents", () => {
	it("doesn't allow setting a role for registration intention when the user in context can't create user-roles", async () =>
		withRunningApp(extend(new Policies.Noone()), async ({ base_url }) => {
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
		withStoppedApp(
			extend(new Policies.Public()),
			async ({ app, base_url }) => {
				app.ConfigManager.set("roles", ["admin"]);
				await app.start();
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

				const role = (
					await app.collections["registration-intents"].suGetByID(
						intent.id
					)
				).get("role");

				assert.equal(role, "admin");
			}
		));
});
