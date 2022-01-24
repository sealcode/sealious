import assert from "assert";
import axios from "axios";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { Collection, FieldTypes, Policies } from "../../../main";
import { TestAppType } from "../../../test_utils/test-app";

function extend(t: TestAppType) {
	return class extends t {
		collections = {
			...t.BaseCollections,
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

describe("settable-by", async () => {
	it("should not allow any value when rejected by access strategy", async () =>
		withRunningApp(extend, async ({ app, base_url }) => {
			await assertThrowsAsync(
				() =>
					axios.post(
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
			const response = (
				await axios.post(
					`${base_url}/api/v1/collections/allowed-collection`,
					{
						any: 1,
					}
				)
			).data;
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
					axios.post(
						`${base_url}/api/v1/collections/allowed-collection`,
						{
							any: value,
						}
					),
				(e) => {
					assert.equal(
						e.response.data.data.field_messages.any.message,
						app.i18n("invalid_integer", [value])
					);
				}
			);
		}));
});
