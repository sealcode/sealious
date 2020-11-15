import assert from "assert";
import { withRunningApp } from "../test_utils/with-test-app";
import { assertThrowsAsync } from "../test_utils/assert-throws-async";
import { request, RequestOptions } from "http";
import Field from "../chip-types/field";
import { App, Collection, FieldTypes } from "../main";
import { TestAppType } from "../test_utils/test-app";

function extend(t: TestAppType) {
	class ArrayOfObjects extends Field {
		typeName = "array-of-objects";
		async isProperValue(_: any, new_value: any) {
			if (!Array.isArray(new_value)) {
				return Field.invalid("It should be array of objects.");
			}

			for (const value of new_value) {
				if (typeof value !== "object") {
					return Field.invalid("One of array item isn't object.");
				}
			}
			return Field.valid();
		}
	}

	const complex_data = new (class ComplexData extends Collection {
		name = "complex-data";
		fields = {
			body: new ArrayOfObjects(),
			source: new FieldTypes.Image(),
		};
	})();

	const strings = new (class Strings extends Collection {
		name = "strings";
		fields = {
			title: new FieldTypes.Text(),
		};
	})();

	return class extends t {
		collections = {
			...t.BaseCollections,
			strings,
			"complex-data": complex_data,
		};
	};
}

async function asyncRequest(
	options: RequestOptions,
	form_data: string
): Promise<{ body: any; source: any }> {
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

describe("get-request-body", () => {
	it("throws application error when `null` is provided as root field value and content-type is set to `application/json`", async () =>
		withRunningApp(extend, async ({ rest_api }) => {
			await assertThrowsAsync(
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
		await withRunningApp(extend, async ({ app }) => {
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
			const Test = new RegExp(
				/\/api\/v1\/formatted-images\/\S*\/test.png/
			);
			const { body, source } = await asyncRequest(options, form_data);
			assert.strict.deepEqual(body, [["Foo", { Bar: "baz" }]]);
			assert.ok(Test.test(source));
		});
	});
});
