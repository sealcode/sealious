import assert from "assert";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { App, Collection, FieldTypes, Policies } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { post } from "../../../test_utils/http_request.js";

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
		withRunningApp(extend, async ({ app, base_url }) => {
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
						app.i18n("policy_noone_deny")
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
		withRunningApp(extend, async ({ app, base_url }) => {
			const value = "thing";
			await assertThrowsAsync(
				() =>
					post(`${base_url}/api/v1/collections/allowed-collection`, {
						any: value,
					}),
				(e) => {
					assert.equal(
						e.response.data.data.field_messages.any.message,
						app.i18n("invalid_integer", [value])
					);
				}
			);
		}));

	it("uses the transition checker from the inner field", async () => {
		let call_count = 0;
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
										(_, old_value, new_value) => {
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
});
