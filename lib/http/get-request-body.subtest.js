const assert = require("assert");
const { with_running_app } = require("../../test_utils/with-test-app.js");
const { assert_throws_async } = require("../../test_utils");
const { request } = require("http");

describe("get-request-body", () => {
	async function async_request(options, form_data) {
		return new Promise((resolve) => {
			const req = request(options, (res) => {
				res.setEncoding("utf-8");
				res.on("data", (chunk) => {
					const { body, source } = JSON.parse(chunk);
					resolve({ body, source });
				});
			});

			req.write(form_data);
			req.end();
		});
	}

	async function create_resources(app) {
		app.createChip(Sealious.FieldType, {
			name: "array-of-objects",
			is_proper_value: (_, __, new_value) => {
				if (!Array.isArray(new_value)) {
					return Promise.reject("It should be array of objects.");
				}

				for (const value of new_value) {
					if (typeof value !== "object") {
						return Promise.reject(
							"One of array item isn't object."
						);
					}
				}
				return Promise.resolve();
			},
		});

		app.createChip(app.Sealious.Collection, {
			name: "complex-data",
			fields: [
				{
					name: "body",
					type: "array-of-objects",
					required: true,
				},
				{
					name: "source",
					type: "image",
					required: true,
				},
			],
		});

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

				(e) => {
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

	it("handles complex data sent as multipart/form-data", async () => {
		await with_running_app(async ({ app }) => {
			await create_resources(app);
			// PNG file is empty but it doesnt matter for the test
			const form_data =
				'------------------------------4ebf00fbcf09\r\nContent-Disposition: form-data; name="source"; filename="test.png"\r\nContent-Type: image/png\r\n\r\nPNG\r\n\r\n\r\n------------------------------4ebf00fbcf09\r\nContent-Disposition: form-data; name="body"; filename="blob"\r\nContent-Type: application/json\r\n\r\n[["Foo", {"Bar": "baz"}]]\r\n------------------------------4ebf00fbcf09--\r\n';

			const options = {
				hostname: "localhost",
				port: 8888,
				path: "/api/v1/collections/complex-data",
				method: "POST",
				headers: {
					"Content-Type":
						"multipart/form-data; boundary=----------------------------4ebf00fbcf09",
				},
			};
			const Test = new RegExp(/\/api\/v1\/uploaded-files\/\S*\/test.png/);
			const { body, source } = await async_request(options, form_data);
			assert.strict.deepEqual(body, [["Foo", { Bar: "baz" }]]);
			assert.ok(Test.test(source));
		});
	});
});
