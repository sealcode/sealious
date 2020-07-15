import assert from "assert";
import Bluebird from "bluebird";

import { withRunningApp } from "../../test_utils/with-test-app";
import create_policies from "../../test_utils/policy-types/create-policies-with-complex-pipeline";
import * as Sealious from "../../main";
import {
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";

describe("OrPolicy", () => {
	async function setup(app: Sealious.App) {
		Collection.fromDefinition(app, {
			name: "numbers",
			fields: [field("number", FieldTypes.Int)],
		});

		const [
			ComplexDenyPipeline,
			ComplexAllowPipeline,
		] = create_policies.allowDeny();
		create_policies.allowDeny();

		const collections = [
			{
				name:
					"collection-or(nested-or(allow, noone), nested-and(allow, public))",
				policies: [
					new Policies.Or([ComplexAllowPipeline, Policies.Noone]),
					new Policies.And([ComplexAllowPipeline, Policies.Public]),
				],
			},
			{
				name: "collection-or(complex-allow-pipeline, public)",
				policies: [ComplexAllowPipeline, Policies.Public],
			},
			{
				name: "collection-or(complex-deny-pipeline, noone)",
				policies: [ComplexDenyPipeline, Policies.Noone],
			},
			{
				name: "collection-or(complex-deny-pipeline, public)",
				policies: [ComplexDenyPipeline, Policies.Public],
			},
		];

		for (const { name, policies } of collections) {
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
				policy: {
					show: new Policies.Or(policies),
					create: Policies.Public,
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
