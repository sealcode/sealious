import assert from "assert";
import axios from "axios";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { Collection, FieldTypes } from "../../../main";
import { TestAppType } from "../../../test_utils/test-app";

const extend = (
	text_params: ConstructorParameters<typeof FieldTypes.Text>[0] = {}
) =>
	function (t: TestAppType) {
		return class extends t {
			collections = {
				...t.BaseCollections,
				surnames: new (class extends Collection {
					fields = {
						surname: new FieldTypes.Text(text_params),
					};
				})(),
			};
		};
	};

describe("text", () => {
	function assert_creation_error_factory({
		base_url,
		collection,
	}: {
		base_url: string;
		collection: string;
	}) {
		return async ({
			resource,
			message,
		}: {
			resource: { [field_name: string]: any };
			message: string;
		}) => {
			try {
				await axios.post(
					`${base_url}/api/v1/collections/${collection}`,
					resource
				);
				throw "This should not pass";
			} catch (e) {
				assert.deepEqual(e.response.data.data.surname.message, message);
			}
		};
	}

	it("shouldn't allow a value that isn't a string", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const assert_creation_error = assert_creation_error_factory({
				base_url,
				collection: "surnames",
			});
			await assert_creation_error({
				resource: { surname: false },
				message: "Type of false is boolean, not string.",
			});
			await assert_creation_error({
				resource: { surname: {} },
				message: "Type of [object Object] is object, not string.",
			});
		}));

	it("should respect given min and max length", async () =>
		withRunningApp(
			extend({ min_length: 3, max_length: 5 }),
			async ({ base_url }) => {
				const assert_creation_error = assert_creation_error_factory({
					base_url,
					collection: "surnames",
				});
				await assert_creation_error({
					resource: { surname: "lo" },
					message:
						"Text 'lo' is too short, minimum length is 3 chars.",
				});
				await assert_creation_error({
					resource: { surname: "abcdefghijk" },
					message:
						"Text 'abcdefghijk' has exceeded max length of 5 chars.",
				});
			}
		));

	it("should let proper string in", async () =>
		withRunningApp(
			extend({ min_length: 3, max_length: 5 }),
			async ({ base_url }) => {
				return axios
					.post(`${base_url}/api/v1/collections/surnames`, {
						surname: "1234",
					})
					.then((resp) => assert.deepEqual(resp.status, 201));
			}
		));

	it("should respond with null when no value is stored", async () =>
		withRunningApp(
			extend({ min_length: 3, max_length: 5 }),
			async ({ app }) => {
				await app.collections.surnames.suCreate({});
				const {
					items: [surname],
				} = await app.collections.surnames.suList().fetch();
				assert.strictEqual(surname.get("surname"), null);
			}
		));
});
