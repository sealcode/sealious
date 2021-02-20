import assert from "assert";
import { withRunningApp } from "../test_utils/with-test-app";
import { assertThrowsAsync } from "../test_utils/assert-throws-async";
import Field from "../chip-types/field";
import { Collection, FieldTypes } from "../main";
import { TestAppType } from "../test_utils/test-app";
import asyncRequest from "../test_utils/async-request";

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

describe("get-request-body", () => {
	it("handles complex data sent as multipart/form-data", async () => {
		await withRunningApp(extend, async ({ port }) => {
			// PNG file is empty but it doesnt matter for the test
			const form_data =
				'------------------------------4ebf00fbcf09\r\nContent-Disposition: form-data; name="source"; filename="test.png"\r\nContent-Type: image/png\r\n\r\nPNG\r\n\r\n\r\n------------------------------4ebf00fbcf09\r\nContent-Disposition: form-data; name="body"; filename="blob"\r\nContent-Type: application/json\r\n\r\n[["Foo", {"Bar": "baz"}]]\r\n------------------------------4ebf00fbcf09--\r\n';

			const options = {
				hostname: "localhost",
				port: port,
				path: "/api/v1/collections/complex-data",
				method: "POST",
				headers: {
					"Content-Type":
						"multipart/form-data; boundary=----------------------------4ebf00fbcf09",
				},
			};
			const Test = new RegExp(/\/api\/v1\/uploaded-files\/\S*\/test.png/);
			const { body, source } = (await asyncRequest(
				options,
				form_data
			)) as { source: "string"; body: Array<Record<string, unknown>> };
			assert.strict.deepStrictEqual(body, [["Foo", { Bar: "baz" }]]);
			assert.match(source, Test);
		});
	});
});
