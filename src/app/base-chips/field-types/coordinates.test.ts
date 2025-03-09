import assert from "assert";
import { Collection, FieldTypes, Policies } from "../../../main.js";
import { TestApp } from "../../../test_utils/test-app.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../../test_utils/with-test-app.js";

const extend = (t: TestAppConstructor) =>
	class extends t {
		collections = {
			...TestApp.BaseCollections,
			coords: new (class extends Collection {
				fields = {
					coordField: new FieldTypes.Coordinates(),
				};
				defaultPolicy = new Policies.Public();
			})(),
		};
	};

describe("coordinates", () => {
	const testCoordsString = "12.12421,65.21312";
	const testCoordsTuple = [12.12421, 65.21312];
	const testCoordsObject = { lat: 12.12421, lon: 65.21312 };
	const coordsInstance = new FieldTypes.Coordinates();

	it("should return true if provided value is in correct format", async () => {
		await withRunningApp(extend, async ({ app }): Promise<void> => {
			await app.collections.coords.suCreate({
				coordField: testCoordsString,
			});
			const res1 = await coordsInstance.isProperValue(
				new app.SuperContext(),
				testCoordsString
			);
			const res2 = await coordsInstance.isProperValue(
				new app.SuperContext(),
				testCoordsObject
			);
			const res3 = await coordsInstance.isProperValue(
				new app.SuperContext(),
				testCoordsObject
			);
			assert.strictEqual(res1.valid, true);
			assert.strictEqual(res2.valid, true);
			assert.strictEqual(res3.valid, true);
		});
	});

	it("should encode provided values in the form of: string, object and tuple correctly to geoJSONObject", async () => {
		await withRunningApp(extend, async ({ app }): Promise<void> => {
			const geoJSONObjectExample = {
				type: "Point",
				coordinates: [12.12421, 65.21312],
			};
			const res = await coordsInstance.encode(
				new app.SuperContext(),
				testCoordsString
			);
			assert.deepStrictEqual(res, geoJSONObjectExample);
			const res2 = await coordsInstance.encode(
				new app.SuperContext(),
				testCoordsObject
			);
			assert.deepStrictEqual(res2, geoJSONObjectExample);
			const res3 = await coordsInstance.encode(
				new app.SuperContext(),
				testCoordsTuple
			);
			assert.deepStrictEqual(res3, geoJSONObjectExample);
		});
	});

	it("should assert that provided value is formated according to format type", async () => {
		await withRunningApp(extend, async ({ app }): Promise<void> => {
			await app.collections.coords.suCreate({
				coordField: testCoordsString,
			});
			const response = await app.collections.coords
				.list(new app.SuperContext())
				.format({ coordField: "string" })
				.fetch();
			assert.strictEqual(
				response.items[0].get("coordField"),
				testCoordsString
			);

			await app.collections.coords.suCreate({
				coordField: testCoordsTuple,
			});
			const response2 = await app.collections.coords
				.list(new app.SuperContext())
				.format({ coordField: "tuple" })
				.fetch();
			assert.notStrictEqual(
				response2.items[0].get("coordField"),
				testCoordsTuple
			);

			await app.collections.coords.suCreate({
				coordField: testCoordsObject,
			});
			const response3 = await app.collections.coords
				.list(new app.SuperContext())
				.format({ coordField: "object" })
				.fetch();
			assert.notStrictEqual(
				response3.items[0].get("coordField"),
				testCoordsObject
			);
		});
	});
});
