const assert = require("assert");
const locreq = require("locreq")(__dirname);
const { with_running_app } = locreq("test_utils/with-test-app.js");
const { assert_throws_async } = locreq("test_utils");

describe("get-request-body", () => {
	async function create_resources(app, rest_api) {
		app.createChip(app.Sealious.Collection, {
			name: "strings",
			fields: [
				{
					name: "title",
					type: "text",
				},
			],
		});
	}

	it("throws application error when `null` is provided as root field value and content-type is set to `application/json`", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_resources(app, rest_api);

			await assert_throws_async(
				async () =>
					await rest_api.post(
						"/api/v1/collections/strings",
						{ title: null },
						{
							headers: { "content-type": "application/json" },
						}
					),

				e => {
					assert.equal(e.response.status, 403);
					assert.equal(
						e.response.data.message,
						"There are problems with some of the provided values."
					);

					assert.notEqual(e.response.status, 500);
					assert.notEqual(
						e.response.data.message,
						"An internal server error occurred"
					);
				}
			);
		}));
});
