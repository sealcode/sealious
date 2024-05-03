import assert from "assert";
import {
	TestAppConstructor,
	withRunningApp,
	withStoppedApp,
} from "../test_utils/with-test-app.js";
import Field from "../chip-types/field.js";
import { Collection, FieldTypes } from "../main.js";
import asyncRequest from "../test_utils/async-request.js";
import parseBody from "./parse-body.js";
import JsonObject from "../app/base-chips/field-types/json-object.js";
import { TestApp } from "../test_utils/test-app.js";

import _locreq from "locreq";
import { module_dirname } from "../utils/module_filename.js";
import { FilePointer } from "@sealcode/file-manager";
const locreq = _locreq(module_dirname(import.meta.url));

function extend(t: TestAppConstructor<TestApp>) {
	class ArrayOfObjects extends Field<Array<Record<string, unknown>>> {
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

	const any_json = new (class ComplexData extends Collection {
		name = "any_json";
		fields = {
			body: new JsonObject(),
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
			any_json,
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
			const response = (await asyncRequest(options, form_data)) as {
				source: string;
				body: Array<Record<string, unknown>>;
			};
			const { body, source } = response;
			assert.strict.deepStrictEqual(body, [["Foo", { Bar: "baz" }]]);
			// if an API response stems from HTTP, it should automatically choose the "url" format for file fields, unless requested otherwise
			assert.ok(source.endsWith(".png"));
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

	it("handles arrays data sent within multipart/form-data", async () => {
		await withRunningApp(extend, async ({ port }) => {
			// PNG file is empty but it doesnt matter for the test

			const response = await fetch(
				`http://localhost:${port}/api/v1/collections/any_json`,
				{
					credentials: "include",
					headers: {
						"Content-Type":
							"multipart/form-data; boundary=209086842812694783493155782262",
					},
					body: `--209086842812694783493155782262\r\nContent-Disposition: form-data; name="body.component_args[table][rows][0][cells][0][color]"\r\n\r\nred\r\n--209086842812694783493155782262\r\nContent-Disposition: form-data; name="body.component_args[table][rows][0][cells][0][word]"\r\n\r\nbanana\r\n--209086842812694783493155782262\r\nContent-Disposition: form-data; name="body.component_args[table][rows][1][cells][0][image].old"\r\n\r\n{"persistent":true,"file_id":"4379b88e-d6f3-43d9-b87b-569d6179be61.data"}\r\n--209086842812694783493155782262\r\nContent-Disposition: form-data; name="body.component_args[table][rows][1][cells][0][color]"\r\n\r\ngreen\r\n--209086842812694783493155782262\r\nContent-Disposition: form-data; name="body.component_args[table][rows][2][cells][0][word]"\r\n\r\npineapple\r\n--209086842812694783493155782262\r\nContent-Disposition: form-data; name="body.component_args[table][rows][2][cells][0][image].old"\r\n\r\n{"persistent":true,"file_id":"2ee38767-af26-492f-997f-e3797917761e.data"}\r\n--209086842812694783493155782262--\r\n`,
					method: "POST",
					mode: "cors",
				}
			);

			const { body } = (await response.json()) as any;
			assert.strict.deepStrictEqual(body, {
				component_args: {
					table: {
						rows: [
							{
								cells: [
									{
										color: "red",
										word: "banana",
									},
								],
							},
							{
								cells: [
									{
										color: "green",
										image: {
											old: '{"persistent":true,"file_id":"4379b88e-d6f3-43d9-b87b-569d6179be61.data"}',
										},
									},
								],
							},
							{
								cells: [
									{
										image: {
											old: '{"persistent":true,"file_id":"2ee38767-af26-492f-997f-e3797917761e.data"}',
										},
										word: "pineapple",
									},
								],
							},
						],
					},
				},
			});
		});
	});

	it("resolves files by their token into a proper FilePointer", async () => {
		await withRunningApp(extend, async ({ port, app }) => {
			const file = app.FileManager.fromPath(
				locreq.resolve("src/assets/logo.png")
			);

			let received_body: any;
			const TEST_PATH = "/for-testing-purposes";
			app.HTTPServer.router.post(TEST_PATH, parseBody(), (ctx) => {
				received_body = ctx.$body;
				ctx.body = "{}";
				ctx.status = 200;
			});

			const token = await file.save(false);
			// PNG file is empty but it doesnt matter for the test
			const form_data =
				`-----------------------------12598523621949976270510557487
Content-Disposition: form-data; name="photo[old]"

${token}
-----------------------------12598523621949976270510557487
Content-Disposition: form-data; name="photo[new]"; filename="Screenshot from 2024-04-23 14-48-34.png"
Content-Type: image/png

PNG
-----------------------------12598523621949976270510557487--

`.replaceAll(/\n/g, "\r\n");

			await fetch(`http://localhost:${port}${TEST_PATH}`, {
				credentials: "include",
				headers: {
					"Content-Type":
						"multipart/form-data; boundary=---------------------------12598523621949976270510557487",
				},
				body: form_data,
				method: "POST",
				mode: "cors",
			});

			assert(received_body.photo.old instanceof FilePointer);
			assert(received_body.photo.new[0] instanceof FilePointer);
		});
	});
});
