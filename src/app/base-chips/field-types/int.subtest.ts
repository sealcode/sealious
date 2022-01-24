import Axios from "axios";
import { equal, deepEqual } from "assert";
import { withRunningApp } from "../../../test_utils/with-test-app";
import { assertThrowsAsync } from "../../../test_utils/assert-throws-async";
import { IntStorageParams } from "./int";
import { Collection, FieldTypes } from "../../../main";
import { TestAppType } from "../../../test_utils/test-app";

describe("int", () => {
	const COLLECTION_NAME = "ages";

	const extend = (params?: IntStorageParams) => (t: TestAppType) => {
		const col = new (class extends Collection {
			name = COLLECTION_NAME;
			fields = {
				age: new FieldTypes.Int(params || {}),
			};
		})();
		return class extends t {
			collections = {
				...t.BaseCollections,
				[COLLECTION_NAME]: col,
			};
		};
	};

	function assertFormatIsNotAccepted(provided_value: any) {
		return withRunningApp(extend(), async ({ app, base_url }) => {
			await assertThrowsAsync(
				() =>
					Axios.post(
						`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
						{
							age: provided_value,
						}
					),
				(e) => {
					equal(
						e.response.data.data.field_messages.age.message,
						app.i18n("invalid_integer", [provided_value])
					);
				}
			);
		});
	}

	it("should allow an integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const { data: response } = await Axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: 10,
				}
			);
			equal(response.age, 10);
		}));

	it("should allow a string which can be interpreted as an integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const { data: response } = await Axios.post(
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
		withRunningApp(
			extend({ min: min, max: max }),
			async ({ app, base_url }) => {
				let age = 29;
				await assertThrowsAsync(
					() =>
						Axios.post(
							`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
							{
								age: age,
							}
						),
					(e) => {
						equal(
							e.response.data.data.age.message,
							app.i18n("too_small_integer", [age, min])
						);
					}
				);
				age = 51;
				await assertThrowsAsync(
					() =>
						Axios.post(
							`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
							{
								age: age,
							}
						),
					(e) => {
						equal(
							e.response.data.data.age.message,
							app.i18n("too_big_integer", [age, max])
						);
					}
				);
			}
		);
	});

	it("should let proper a string as an integer value in the defined range", async () =>
		withRunningApp(extend({ min: -2, max: 6 }), async ({ base_url }) => {
			return Axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: "-1",
				}
			).then((response) => deepEqual(response.status, 201));
		}));

	it("should allow a largest integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const { data: response } = await Axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: Number.MAX_SAFE_INTEGER,
				}
			);
			equal(response.age, Number.MAX_SAFE_INTEGER);
		}));

	it("should allow a smallest integer value provided as a string value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const { data: response } = await Axios.post(
				`${base_url}/api/v1/collections/${COLLECTION_NAME}`,
				{
					age: Number.MIN_SAFE_INTEGER.toString(),
				}
			);
			equal(response.age, Number.MIN_SAFE_INTEGER);
		}));

	it("should allow a string with whitespace characters which can be interpreted as an integer value", async () =>
		withRunningApp(extend(), async ({ base_url }) => {
			const { data: response } = await Axios.post(
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
