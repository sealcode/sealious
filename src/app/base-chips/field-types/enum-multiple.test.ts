import { predicates } from "@sealcode/ts-predicates";
import assert from "assert";
import Collection from "../../../chip-types/collection.js";
import { FieldTypes } from "../../../main.js";
import { withRunningApp } from "../../../test_utils/with-test-app.js";
import { App } from "../../app.js";

describe("Fields > EnumMultiple", () => {
	it("allows you to filter array by a single value", async () =>
		withRunningApp(
			(app) =>
				class extends app {
					collections = {
						...App.BaseCollections,
						cakes: new (class extends Collection {
							fields = {
								ingredients: new FieldTypes.EnumMultiple([
									"flour",
									"carrot",
									"eggs",
									"water",
									"salt",
								]),
							};
						})(),
					};
				},
			async ({ app }) => {
				const carrot_cake = await app.collections.cakes.suCreate({
					ingredients: ["flour", "water", "carrot"],
				});
				const carrot_cake_reverse =
					await app.collections.cakes.suCreate({
						ingredients: ["carrot", "water", "flour"],
					});
				const egg_cake = await app.collections.cakes.suCreate({
					ingredients: ["flour", "water", "eggs"],
				});
				const dry_cake = await app.collections.cakes.suCreate({
					ingredients: ["flour", "salt"],
				});

				const { items: watery } = await app.collections.cakes
					.suList()
					.filter({ ingredients: "water" })
					.fetch();
				assert.strictEqual(watery.length, 3);

				const { items: carroty } = await app.collections.cakes
					.suList()
					.filter({ ingredients: "carrot" })
					.fetch();
				assert.strictEqual(carroty.length, 2);

				const { items: carrot_nonreverse } = await app.collections.cakes
					.suList()
					.filter({
						ingredients: {
							exact: ["flour", "water", "carrot"],
						},
					})
					.fetch();
				assert.strictEqual(carrot_nonreverse.length, 1);
				assert.strictEqual(carrot_nonreverse[0].id, carrot_cake.id);

				const { items: carrot_any_direction } =
					await app.collections.cakes
						.suList()
						.filter({
							ingredients: {
								all: ["flour", "water", "carrot"],
							},
						})
						.fetch();
				assert.strictEqual(carrot_any_direction.length, 2);

				const { items: sticky } = await app.collections.cakes
					.suList()
					.filter({
						ingredients: {
							all: ["flour", "water"],
						},
					})
					.fetch();
				assert.strictEqual(sticky.length, 3);

				const { items: eggs_or_salt } = await app.collections.cakes
					.suList()
					.filter({
						ingredients: {
							any: ["eggs", "salt"],
						},
					})
					.fetch();
				assert.strictEqual(eggs_or_salt.length, 2);

				const { items: any_ingredient } = await app.collections.cakes
					.suList()
					.filter({
						ingredients: {
							all: [], // important
						},
					})
					.fetch();
				assert.strictEqual(any_ingredient.length, 4);
			}
		));
});
