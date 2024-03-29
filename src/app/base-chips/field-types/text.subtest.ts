import assert from "assert";
import axios from "axios";
import { TestAppConstructor, withRunningApp } from "../../../test_utils/with-test-app";
import { Collection, FieldTypes } from "../../../main";
import { TestApp } from "../../../test_utils/test-app";
import SingleReference from "./single-reference";
import ReverseSingleReference from "./reverse-single-reference";

const extend = (text_params: ConstructorParameters<typeof FieldTypes.Text>[0] = {}) =>
	function (t: TestAppConstructor) {
		return class extends t {
			collections = {
				...TestApp.BaseCollections,
				surnames: new (class extends Collection {
					fields = {
						surname: new FieldTypes.Text(text_params),
					};
				})(),
				people: new (class extends Collection {
					fields = {
						pesel: new FieldTypes.Text(),
						surname: new FieldTypes.SingleReference("surnames"),
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
				await axios.post(`${base_url}/api/v1/collections/${collection}`, resource);
				throw "This should not pass";
			} catch (e) {
				assert.deepStrictEqual(
					e.response.data.data.field_messages.surname.message,
					message
				);
			}
		};
	}

	it("shouldn't allow a value that isn't a string", async () =>
		withRunningApp(extend(), async ({ app, base_url }) => {
			const assert_creation_error = assert_creation_error_factory({
				base_url,
				collection: "surnames",
			});
			await assert_creation_error({
				resource: { surname: false },
				message: app.i18n("invalid_text", [false, typeof false]),
			});
			await assert_creation_error({
				resource: { surname: {} },
				message: app.i18n("invalid_text", [{}, typeof {}]),
			});
		}));

	it("should respect given min and max length", async () => {
		const min = 3;
		const max = 5;
		withRunningApp(extend({ min_length: min, max_length: max }), async ({ app, base_url }) => {
			const assert_creation_error = assert_creation_error_factory({
				base_url,
				collection: "surnames",
			});
			let text = "lo";
			await assert_creation_error({
				resource: { surname: text },
				message: app.i18n("too_short_text", [text, min]),
			});
			text = "abcdefghijk";
			await assert_creation_error({
				resource: { surname: text },
				message: app.i18n("too_long_text", [text, max]),
			});
		});
	});

	it("should let proper string in", async () =>
		withRunningApp(extend({ min_length: 3, max_length: 5 }), async ({ base_url }) => {
			return axios
				.post(`${base_url}/api/v1/collections/surnames`, {
					surname: "1234",
				})
				.then((resp) => assert.deepEqual(resp.status, 201));
		}));

	it("should respond with null when no value is stored", async () =>
		withRunningApp(extend({ min_length: 3, max_length: 5 }), async ({ app }) => {
			await app.collections.surnames.suCreate({});
			const {
				items: [surname],
			} = await app.collections.surnames.suList().fetch();
			assert.strictEqual(surname.get("surname"), null);
		}));

	it("should allow to filter value by array", async () =>
		withRunningApp(extend({ min_length: 3, max_length: 5 }), async ({ app }) => {
			await app.collections.surnames.suCreate({ surname: "Smith" });
			const {
				items: [surname],
			} = await app.collections.surnames
				.suList()
				.filter({ surname: ["Johnson", "Smith"] })
				.fetch();
			assert.strictEqual(surname.get("surname"), "Smith");
		}));

	it("should allow to filter value by array over a single-reference field", async () =>
		withRunningApp(extend({ min_length: 3, max_length: 9 }), async ({ app }) => {
			const surname = await app.collections.surnames.suCreate({ surname: "Smith" });
			const surname2 = await app.collections.surnames.suCreate({ surname: "Secondary" });
			const person = await app.collections.people.suCreate({
				pesel: "123123123",
				surname: surname.id,
			});
			const person2 = await app.collections.people.suCreate({
				pesel: "456456456",
				surname: surname2.id,
			});
			const { items: single_match } = await app.collections.people
				.suList()
				.filter({ surname: { surname: ["Smith"] } })
				.fetch();
			assert.strictEqual(single_match.length, 1);
			assert.strictEqual(single_match[0].get("surname"), surname.id);
		}));

	it("allows to filter by a simple value", async () =>
		withRunningApp(extend({ min_length: 3, max_length: 9 }), async ({ app }) => {
			const surname = await app.collections.surnames.suCreate({ surname: "Smith" });
			const surname2 = await app.collections.surnames.suCreate({ surname: "Secondary" });
			const { items: single_match } = await app.collections.surnames
				.suList()
				.filter({ surname: "Smith" })
				.fetch();
			assert.strictEqual(single_match.length, 1);
			assert.strictEqual(single_match[0].get("surname"), "Smith");
		}));

	it("allows to filter by an empty value", async () =>
		withRunningApp(extend(), async ({ app }) => {
			const surname = await app.collections.surnames.suCreate({ surname: "" });
			const { items: single_match } = await app.collections.surnames
				.suList()
				.filter({ surname: "" })
				.fetch();
			assert.strictEqual(single_match.length, 1);
			assert.strictEqual(single_match[0].get("surname"), "");
		}));
});
