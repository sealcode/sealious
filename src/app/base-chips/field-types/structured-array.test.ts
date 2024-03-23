import assert from "assert";
import Collection from "../../../chip-types/collection.js";
import { FieldTypes } from "../../../main.js";
import {
	assertThrowsAsync,
	withRunningApp,
} from "../../../test_utils/test-utils.js";
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

	it("handles entry removal properly", async () =>
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
					entries: [
						{ title: "pen", price: 1.1 },
						{ title: "apple", price: 2.2 },
						{ title: "pineapple", price: 3.3 },
					],
				});
				invoice.set("entries", { remove: 0 });
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [
					{ title: "apple", price: 2.2 },
					{ title: "pineapple", price: 3.3 },
				]);

				const same_invoice = await app.collections.invoices.suGetByID(
					invoice.id
				);
				same_invoice.set("entries", { remove: 1 });
				await same_invoice.save(new app.SuperContext());
				assert.deepStrictEqual(same_invoice.get("entries"), [
					{ title: "apple", price: 2.2 },
				]);
			}
		));

	it("handles entry swap properly", async () =>
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
					entries: [
						{ title: "pen", price: 1.1 },
						{ title: "apple", price: 2.2 },
						{ title: "pineapple", price: 3.3 },
					],
				});
				invoice.set("entries", { swap: [0, 1] });
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [
					{ title: "apple", price: 2.2 },
					{ title: "pen", price: 1.1 },
					{ title: "pineapple", price: 3.3 },
				]);
			}
		));

	it("handles insert action properly", async () =>
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
					entries: [
						{ title: "pen", price: 1.1 },
						{ title: "apple", price: 2.2 },
					],
				});
				invoice.set("entries", {
					insert: {
						value: { title: "pineapple", price: 3.3 },
						index: 1,
					},
				});
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [
					{ title: "pen", price: 1.1 },
					{ title: "pineapple", price: 3.3 },
					{ title: "apple", price: 2.2 },
				]);

				invoice.set("entries", {
					insert: {
						value: { title: "last", price: 4.4 },
					},
				});
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [
					{ title: "pen", price: 1.1 },
					{ title: "pineapple", price: 3.3 },
					{ title: "apple", price: 2.2 },
					{ title: "last", price: 4.4 },
				]);
			}
		));

	it("handles actions with data property preset", async () =>
		// this is helpful when handling form input, some fields are changed but
		// not yet saved and then the users pressed "remove this row"
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
					entries: [
						{ title: "pen", price: 1.1 },
						{ title: "apple", price: 2.2 },
					],
				});
				invoice.set("entries", {
					insert: {
						value: { title: "pineapple", price: 3.3 },
						index: 1,
					},
					data: [
						{ title: "Pen", price: 100 },
						{ title: "Apple", price: 200 },
					],
				});
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [
					{ title: "Pen", price: 100 },
					{ title: "pineapple", price: 3.3 },
					{ title: "Apple", price: 200 },
				]);
			}
		));

	it("just updates the array if the action is empty", async () =>
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
					entries: [
						{ title: "pen", price: 1.1 },
						{ title: "apple", price: 2.2 },
					],
				});
				invoice.set("entries", {
					data: [
						{ title: "Pen", price: 100 },
						{ title: "Apple", price: 200 },
					],
				});
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [
					{ title: "Pen", price: 100 },
					{ title: "Apple", price: 200 },
				]);
			}
		));

	it("Handles insert action where indexes are strings and array is currently empty", async () =>
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
					entries: [],
				});
				invoice.set("entries", {
					insert: {
						index: "0",
					},
				});
				await invoice.save(new app.SuperContext());
				assert.deepStrictEqual(invoice.get("entries"), [{}]);
			}
		));
});
