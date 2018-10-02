const axios = require("axios");
const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const { assert_throws_async } = locreq("test_utils");

describe("int", () => {
	const COLLECTION_NAME = "ages";

	function assertFormatIsNotAccepted(provided_value) {
		return with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
			});

			await assert_throws_async(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
						{
							age: provided_value,
						}
					),
				e => {
					assert.equal(
						e.response.data.data.age.message,
						`Value '${provided_value}' is not a int number format.`
					);
				}
			);
		});
	}

	async function create_test_collection({ app, params }) {
		app.createChip(app.Sealious.Collection, {
			name: COLLECTION_NAME,
			fields: [
				{
					name: "age",
					type: "int",
					params,
				},
			],
		});
	}

	it("should allow an integer value", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
			});

			const { data: response } = await axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: 10,
				}
			);
			assert.equal(response.age, 10);
		}));

	it("should allow a string which can be interpreted as an integer value", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
			});

			const { data: response } = await axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: "1",
				}
			);
			assert.equal(response.age, 1);
		}));

	it("should respect given min and max value", async () =>
		with_running_app(async ({ app, base_url }) => {
			const [min, max] = [30, 50];

			await create_test_collection({
				app,
				params: { min, max },
			});

			await assert_throws_async(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
						{
							age: 29,
						}
					),
				e => {
					assert.equal(
						e.response.data.data.age.message,
						`Value should be larger or equal to '${min}'.`
					);
				}
			);

			await assert_throws_async(
				() =>
					axios.post(
						`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
						{
							age: 51,
						}
					),
				e => {
					assert.equal(
						e.response.data.data.age.message,
						`Value should be smaller or equal to '${max}'.`
					);
				}
			);
		}));

	it("should let proper a string as an integer value in the defined range", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
				params: { min: -2, max: 6 },
			});
			return axios
				.post(`${base_url}/api/v1/collections/${COLLECTION_NAME}`, {
					age: "-1",
				})
				.then(response => assert.deepEqual(response.status, 201));
		}));

	it("should allow a largest integer value", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
			});

			const { data: response } = await axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: Number.MAX_SAFE_INTEGER,
				}
			);
			assert.equal(response.age, Number.MAX_SAFE_INTEGER);
		}));

	it("should allow a smallest integer value provided as a string value", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
			});

			const { data: response } = await axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: Number.MIN_SAFE_INTEGER.toString(),
				}
			);
			assert.equal(response.age, Number.MIN_SAFE_INTEGER);
		}));

	it("should allow a string with whitespace characters which can be interpreted as an integer value", async () =>
		with_running_app(async ({ app, base_url }) => {
			await create_test_collection({
				app,
			});

			const { data: response } = await axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: " -20 ",
				}
			);
			assert.equal(response.age, -20);
		}));

	it("shouldn't allow a boolean value", async () =>
		await assertFormatIsNotAccepted(true));

	it("shouldn't allow an object value", async () =>
		await assertFormatIsNotAccepted({}));

	it("shouldn't allow a string which cannot be interpreted as an integer value", async () =>
		await assertFormatIsNotAccepted("2013ffff"));

	it("shouldn't allow a float number which cannot be interpreted as an integer value", async () =>
		await assertFormatIsNotAccepted(1.2));

	it("shouldn't allow a float number inserted as a string which cannot be interpreted as an integer value", async () =>
		await assertFormatIsNotAccepted("1.2"));
});
