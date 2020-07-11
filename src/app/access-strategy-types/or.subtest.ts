import assert from "assert";
import Bluebird from "bluebird";

import { withRunningApp } from "../../test_utils/with-test-app";
import create_strategies from "../../test_utils/access-strategy-types/create-strategies-with-complex-pipeline";
import * as Sealious from "../../main";
import {
	Collection,
	FieldTypes,
	AccessStrategies,
	FieldDefinitionHelper as field,
} from "../../main";

describe("OrAccessStrategy", () => {
	async function setup(app: Sealious.App) {
		Collection.fromDefinition(app, {
			name: "numbers",
			fields: [field("number", FieldTypes.Int)],
		});

		const [
			ComplexDenyPipeline,
			ComplexAllowPipeline,
		] = create_strategies.allowDeny();
		create_strategies.allowDeny();

		const collections = [
			{
				name:
					"collection-or(nested-or(allow, noone), nested-and(allow, public))",
				strategies: [
					new AccessStrategies.Or([
						ComplexAllowPipeline,
						AccessStrategies.Noone,
					]),
					new AccessStrategies.And([
						ComplexAllowPipeline,
						AccessStrategies.Public,
					]),
				],
			},
			{
				name: "collection-or(complex-allow-pipeline, public)",
				strategies: [ComplexAllowPipeline, AccessStrategies.Public],
			},
			{
				name: "collection-or(complex-deny-pipeline, noone)",
				strategies: [ComplexDenyPipeline, AccessStrategies.Noone],
			},
			{
				name: "collection-or(complex-deny-pipeline, public)",
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
						{ target_collection: () => app.collections.numbers },
						true
					),
				],
				access_strategy: {
					show: new AccessStrategies.Or(strategies),
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

	it("returns everything for collection-or(nested-or(allow, noone), nested-and(allow, public))", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(nested-or(allow, noone), nested-and(allow, public))"
				)
				.then(({ items }) => assert.equal(items.length, 3));
		}));

	it("returns everything for or(complex-allow-pipeline, public)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(complex-allow-pipeline, public)"
				)
				.then(({ items }) => assert.equal(items.length, 3));
		}));

	it("returns nothing for or(complex-deny-pipeline, noone)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(complex-deny-pipeline, noone)"
				)
				.then(({ items }) => assert.equal(items.length, 0));
		}));

	it("returns everything for or(complex-deny-pipeline, public)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(complex-deny-pipeline, public)"
				)
				.then(({ items }) => assert.equal(items.length, 3));
		}));
});
