import assert from "assert";
import Bluebird from "bluebird";

import { with_running_app } from "../../../../test_utils/with-test-app";
import create_strategies from "../../../../test_utils/access-strategy-types/create_strategies_with_complex_pipeline";
import * as Sealious from "../../../main";

describe("OrAccessStrategy", () => {
	async function setup(app: Sealious.App) {
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
					"collection-or(nested-or(allow, noone), nested-and(allow, public))",
				strategies: [
					["or", ["complex-allow-pipeline", "noone"]],
					["and", ["complex-allow-pipeline", "public"]],
				],
			},
			{
				name: "collection-or(complex-allow-pipeline, public)",
				strategies: ["complex-allow-pipeline", "public"],
			},
			{
				name: "collection-or(complex-deny-pipeline, noone)",
				strategies: ["complex-deny-pipeline", "noone"],
			},
			{
				name: "collection-or(complex-deny-pipeline, public)",
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
					show: ["or", strategies],
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

	it("returns everything for collection-or(nested-or(allow, noone), nested-and(allow, public))", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(nested-or(allow, noone), nested-and(allow, public))"
				)
				.then(({ items }) => assert.equal(items.length, 3));
		}));

	it("returns everything for or(complex-allow-pipeline, public)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(complex-allow-pipeline, public)"
				)
				.then(({ items }) => assert.equal(items.length, 3));
		}));

	it("returns nothing for or(complex-deny-pipeline, noone)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(complex-deny-pipeline, noone)"
				)
				.then(({ items }) => assert.equal(items.length, 0));
		}));

	it("returns everything for or(complex-deny-pipeline, public)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			return rest_api
				.getSealiousResponse(
					"/api/v1/collections/collection-or(complex-deny-pipeline, public)"
				)
				.then(({ items }) => assert.equal(items.length, 3));
		}));
});
