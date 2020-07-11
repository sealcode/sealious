import assert from "assert";
import Bluebird from "bluebird";
import {
	App,
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../main";

import { withRunningApp } from "../../test_utils/with-test-app";
import create_strategies from "../../test_utils/access-strategy-types/create-strategies-with-complex-pipeline";
import And from "./and";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";

describe("AndAccessStrategy", () => {
	async function setup(app: App) {
		const numbersCollection = Collection.fromDefinition(app, {
			name: "numbers",
			fields: [field("number", FieldTypes.Int)],
		});

		const [
			ComplexDenyPipeline,
			ComplexAllowPipeline,
		] = create_strategies.allowDeny();

		const collections = [
			{
				name:
					"collection-and(nested-and(allow, public), nested-or(allow, noone))",
				strategies: [
					new And([ComplexAllowPipeline, AccessStrategies.Public]),
					new AccessStrategies.Or([
						ComplexAllowPipeline,
						AccessStrategies.Noone,
					]),
				],
			},
			{
				name: "collection-and(ComplexAllowPipeline, noone)",
				strategies: [ComplexAllowPipeline, AccessStrategies.Noone],
			},
			{
				name: "collection-and(ComplexAllowPipeline, public)",
				strategies: [ComplexAllowPipeline, AccessStrategies.Public],
			},
			{
				name: "collection-and(complexDenyPipeline, public)",
				strategies: [ComplexDenyPipeline, AccessStrategies.Public],
			},
		];

		for (const { name, strategies } of collections) {
			Collection.fromDefinition(app, {
				name: name,
				fields: [
					field(
						"number",
						FieldTypes.SingleReference,
						{ target_collection: () => numbersCollection },
						true
					),
				],
				access_strategy: {
					show: new And(strategies),
					create: AccessStrategies.Public,
				},
			});
		}

		let numbers = await Bluebird.map([0, 1, 2], (n) =>
			app.runAction(
				new app.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number: n }
			)
		);

		for (const number of numbers) {
			await Bluebird.map(collections, ({ name }) =>
				app.runAction(
					new app.SuperContext(),
					["collections", name],
					"create",
					{ number: number.id }
				)
			);
		}
	}

	it("return everything for collection-and(nested-and(allow, public), nested-or(allow, noone))", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-and(nested-and(allow, public), nested-or(allow, noone))"
				)
				.then(({ items }: { items: any[] }) =>
					assert.equal(items.length, 3)
				);
		}));

	it("returns nothing for and(ComplexAllowPipeline, noone)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			await assertThrowsAsync(
				() =>
					rest_api.get(
						"/api/v1/collections/collection-and(ComplexAllowPipeline, noone)"
					),
				(e) => {
					assert.equal(e.response.data.message, `noone is allowed`);
				}
			);
		}));

	it("returns everything for and(ComplexAllowPipeline, public)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-and(ComplexAllowPipeline, public)"
				)
				.then(({ items }: { items: any[] }) =>
					assert.equal(items.length, 3)
				);
		}));

	it("returns nothing for and(complex-deny-pipeline, public)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			const { items } = await rest_api.get(
				"/api/v1/collections/collection-and(complexDenyPipeline, public)"
			);
			assert.equal(items.length, 0);
		}));
});
