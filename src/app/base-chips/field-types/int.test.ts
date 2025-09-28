import { equal, deepEqual } from "assert";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async.js";
import type { IntStorageParams } from "./int.js";
import { Collection, FieldTypes } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import { post } from "../../../test_utils/http_request.js";

describe("int", () => {
	const COLLECTION_NAME = "ages";

	const extend = (params?: IntStorageParams) => (t: TestAppConstructor) => {
		const col = new (class extends Collection {
			name = COLLECTION_NAME;
			fields = {
				age: new FieldTypes.Int(params || {}),
			};
		})();
		return class extends t {
			collections = {
				...TestApp.BaseCollections,
				[COLLECTION_NAME]: col,
			};
		};
	};

	function assertFormatIsNotAccepted(provided_value: any) {
		return withRunningApp(extend(), async ({ base_url }) => {
			await assertThrowsAsync(
				() =>
					post(`${base_url}/api/v1/collections/${COLLECTION_NAME}`, {
						age: provided_value,
					}),
				(e) => {
					equal(
						e.response.data.data.field_messages.age.message,
						`Value '${provided_value}' is not a int number format.`
					);
				}
			);
		});
	}

	it("should allow an integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const response = await post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: 10,
				}
			);
			equal(response.age, 10);
		}));

	it("should allow a string which can be interpreted as an integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const response = await post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: "1",
				}
			);
			equal(response.age, 1);
		}));

	it("should respect given min and max value", async () => {
		const min = 30;
		const max = 50;
		await withRunningApp(
			extend({ min: min, max: max }),
			async ({ app, base_url }) => {
				let age = 29;
				await assertThrowsAsync(
					() =>
						post(
							`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
							{
								age: age,
							}
						),
					(e) => {
						equal(
							e.response?.data?.data?.field_messages.age.message,
							`Value ${age} should be larger than or equal to ${min}.`
						);
					}
				);
				age = 51;
				await assertThrowsAsync(
					() =>
						post(
							`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
							{
								age: age,
							}
						),
					(e) => {
						equal(
							e.response?.data?.data?.field_messages.age.message,
							`Value ${age} should be smaller than or equal to ${max}.`
						);
					}
				);
			}
		);
	});

	it("should let proper a string as an integer value in the defined range", async () =>
		withRunningApp(extend({ min: -2, max: 6 }), async ({ base_url }) => {
			const response = await fetch(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						age: "-1",
					}),
				}
			);
			deepEqual(response.status, 201);
		}));

	it("should allow a largest integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const response = await post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: Number.MAX_SAFE_INTEGER,
				}
			);
			equal(response.age, Number.MAX_SAFE_INTEGER);
		}));

	it("should allow a smallest integer value provided as a string value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const response = await post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: Number.MIN_SAFE_INTEGER.toString(),
				}
			);
			equal(response.age, Number.MIN_SAFE_INTEGER);
		}));

	it("should allow a string with whitespace characters which can be interpreted as an integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const response = await post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: " -20 ",
				}
			);
			equal(response.age, -20);
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
