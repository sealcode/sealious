const assert = require("assert");
const locreq = require("locreq")(__dirname);
const axios = require("axios");
const with_test_app = locreq("test_utils/with-test-app.js");

describe("text", () => {
	const COLLECTION_NAME = "surnames";

	async function create_test_collection({ app, params }) {
		app.createChip(app.Sealious.Collection, {
			name: COLLECTION_NAME,
			fields: [
				{
					name: "surname",
					type: "text",
					params,
				},
			],
		});
	}

	function assert_creation_error_factory({ base_url, collection }) {
		return async ({ resource, message }) => {
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
		with_test_app(async ({ app, base_url }) => {
			await create_test_collection({ app, params: {} });
			const assert_creation_error = assert_creation_error_factory({
				base_url,
				collection: COLLECTION_NAME,
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
		with_test_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
				params: { min_length: 3, max_length: 5 },
			});
			const assert_creation_error = assert_creation_error_factory({
				base_url,
				collection: COLLECTION_NAME,
			});
			await assert_creation_error({
				resource: { surname: "lo" },
				message: "Text 'lo' is too short, minimum length is 3 chars.",
			});
			await assert_creation_error({
				resource: { surname: "abcdefghijk" },
				message:
					"Text 'abcdefghijk' has exceeded max length of 5 chars.",
			});
		}));

	it("should let proper string in", async () =>
		with_test_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
				params: { min_length: 3, max_length: 5 },
			});
			return axios
				.post(`${base_url}/api/v1/collections/surnames`, {
					surname: "1234",
				})
				.then(resp => assert.deepEqual(resp.status, 201));
		}));
});
