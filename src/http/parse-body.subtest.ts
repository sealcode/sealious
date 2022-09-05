import assert from "assert";
import {
	TestAppConstructor,
	withRunningApp,
	withStoppedApp,
} from "../test_utils/with-test-app";
import Field from "../chip-types/field";
import { Collection, FieldTypes } from "../main";
import asyncRequest from "../test_utils/async-request";
import { TestApp } from "../test_utils/test-utils";
import axios from "axios";
import parseBody from "./parse-body";

function extend(t: TestAppConstructor<TestApp>) {
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
			...TestApp.BaseCollections,
			strings,
			"complex-data": complex_data,
		};
	};
}

describe("parseBody", () => {
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
			const { body, source } = (await asyncRequest(
				options,
				form_data
			)) as {
				source: Record<string, unknown>;
				body: Array<Record<string, unknown>>;
			};
			assert.strict.deepStrictEqual(body, [["Foo", { Bar: "baz" }]]);
			assert.deepStrictEqual(source?.filename, "test.png");
		});
	});

	it("includes the url query params as parts of body, if they don't overlap", async () => {
		await withStoppedApp(extend, async (test) => {
			test.app.HTTPServer.router.post(
				"/echo-data",
				parseBody(),
				async (ctx) => {
					ctx.body = ctx.$body;
				}
			);

			await test.app.start();
			const response = await test.rest_api.post(
				"/echo-data?token=abc&json_data=ignore",
				{
					json_data: "123",
				}
			);
			assert.strictEqual(response.json_data, "123");
			assert.strictEqual(response.token, "abc");
			await test.app.stop();
		});
	});
});
