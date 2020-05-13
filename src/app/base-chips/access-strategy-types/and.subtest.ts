import assert from "assert";
import Bluebird from "bluebird";
import { App } from "../../../main";
import * as Sealious from "../../../main";

import { with_running_app } from "../../../../test_utils/with-test-app";
import create_strategies from "../../../../test_utils/access-strategy-types/create_strategies_with_complex_pipeline";

describe("AndAccessStrategy", () => {
	async function setup(app: App) {
		app.createChip(Sealious.Collection, {
			name: "numbers",
			fields: [
				{
					name: "number",
					type: "int",
				},
			],
		});

		create_strategies.allow_deny(app);

		const collections = [
			{
				name:
					"collection-and(nested-and(allow, public), nested-or(allow, noone))",
				strategies: [
					["and", ["complex-allow-pipeline", "public"]],
					["or", ["complex-allow-pipeline", "noone"]],
				],
			},
			{
				name: "collection-and(complex-allow-pipeline, noone)",
				strategies: ["complex-allow-pipeline", "noone"],
			},
			{
				name: "collection-and(complex-allow-pipeline, public)",
				strategies: ["complex-allow-pipeline", "public"],
			},
			{
				name: "collection-and(complex-deny-pipeline, public)",
				strategies: ["complex-deny-pipeline", "public"],
			},
		];

		for (const { name, strategies } of collections) {
			app.createChip(Sealious.Collection, {
				name: name,
				fields: [
					{
						name: "number",
						type: "single_reference",
						params: { collection: "numbers" },
						required: true,
					},
				],
				access_strategy: {
					show: ["and", strategies],
					create: "public",
				},
			});
		}

		let numbers = await Bluebird.map([0, 1, 2], (n) =>
			app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number: n }
			)
		);

		for (const number of numbers) {
			await Bluebird.map(collections, ({ name }) =>
				app.run_action(
					new app.Sealious.SuperContext(),
					["collections", name],
					"create",
					{ number: number.id }
				)
			);
		}
	}

	it("return everything for collection-and(nested-and(allow, public), nested-or(allow, noone))", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-and(nested-and(allow, public), nested-or(allow, noone))"
				)
				.then(({ items }: { items: any[] }) =>
					assert.equal(items.length, 3)
				);
		}));

	it("returns nothing for and(complex-allow-pipeline, noone)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-and(complex-allow-pipeline, noone)"
				)
				.then(({ items }: { items: any[] }) =>
					assert.equal(items.length, 0)
				);
		}));

	it("returns everything for and(complex-allow-pipeline, public)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-and(complex-allow-pipeline, public)"
				)
				.then(({ items }: { items: any[] }) =>
					assert.equal(items.length, 3)
				);
		}));

	it("returns nothing for and(complex-deny-pipeline, public)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-and(complex-deny-pipeline, public)"
				)
				.then(({ items }: { items: any[] }) =>
					assert.equal(items.length, 0)
				);
		}));
});
