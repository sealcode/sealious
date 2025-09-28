import assert from "assert";
import Collection from "../../../chip-types/collection.js";
import { FieldTypes } from "../../../main.js";
import { assertThrowsAsync } from "../../../test_utils/test-utils.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { App } from "../../app.js";
import { StructuredArray } from "./structured-array.js";

describe("structured-array", () => {
	it("accepts a simple valid value and rejects an invalid one", async () =>
		withRunningApp(
			(testapp) =>
				class extends testapp {
					collections = {
						...App.BaseCollections,
						invoices: new (class extends Collection {
							fields = {
								entries: new StructuredArray({
									title: new FieldTypes.Text(),
									price: new FieldTypes.Float(),
								}),
							};
						})(),
					};
				},
			async ({ app }) => {
				await app.collections.invoices.suCreate({
					entries: [
						{ title: "pen", price: 1.2 },
						{ title: "apple", price: 2.2 },
					],
				});
				assertThrowsAsync(() =>
					app.collections.invoices.suCreate({
						// @ts-ignore
						entries: [{ title: [], price: 1.2 }],
					})
				);
			}
		));

	it("reports the output type as an array", async () =>
		withRunningApp(
			(testapp) =>
				class extends testapp {
					collections = {
						...App.BaseCollections,
						invoices: new (class extends Collection {
							fields = {
								entries: new StructuredArray({
									title: new FieldTypes.Text(),
									price: new FieldTypes.Float(),
								}),
							};
						})(),
					};
				},
			async ({ app }) => {
				const invoice = await app.collections.invoices.suCreate({
					entries: [{ title: "Hello", price: 999 }],
				});
				await invoice.save(new app.SuperContext());

				// this would throw a TS error if the types were wrong:
				invoice.get("entries")?.[0];
			}
		));

	it("Init subfields properly so it works with single-reference as a subfield", async () =>
		withRunningApp(
			(testapp) =>
				class extends testapp {
					collections = {
						...App.BaseCollections,
						products: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
							};
						})(),
						invoices: new (class extends Collection {
							fields = {
								entries: new StructuredArray({
									product: new FieldTypes.SingleReference(
										"products"
									),
									price: new FieldTypes.Float(),
								}),
							};
						})(),
					};
				},
			async ({ app }) => {
				const pen = await app.collections.products.suCreate({
					name: "pen",
				});
				await app.collections.invoices.suCreate({
					entries: [{ product: pen.id, price: 1.2 }],
				});
			}
		));

	it("should support attachments", async () =>
		withRunningApp(
			(testapp) =>
				class extends testapp {
					collections = {
						...App.BaseCollections,
						products: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
							};
						})(),
						invoices: new (class extends Collection {
							fields = {
								entries: new StructuredArray({
									product: new FieldTypes.SingleReference(
										"products"
									),
								}),
								product: new FieldTypes.SingleReference(
									"products"
								),
							};
						})(),
					};
				},
			async ({ app }) => {
				const pen = await app.collections.products.suCreate({
					name: "pen",
				});
				await app.collections.invoices.suCreate({
					entries: [{ product: pen.id }],
				});
				const list = app.collections.invoices
					.suList()
					.attach({ entries: { product: true }, product: true });
				const result = await list.fetch();
				assert.strictEqual(result.items.length, 1);
				assert.strictEqual(
					result.items[0]?.getAttachments("entries")[0]?.get("name"),
					"pen"
				);
			}
		));
});
