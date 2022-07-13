import assert from "assert";
import Bluebird from "bluebird";

import {
	TestAppConstructor,
	withRunningApp,
} from "../../test_utils/with-test-app";
import create_policies from "../../test_utils/policy-types/create-policies-with-complex-pipeline";
import type * as Sealious from "../../main";
import { Collection, FieldTypes, Policies, Policy } from "../../main";
import { TestApp } from "../../test_utils/test-app";

const [ComplexDenyPipeline, ComplexAllowPipeline] = create_policies.allowDeny();

const collections = [
	{
		name: "collection-or(nested-or(allow,noone),nested-and(allow,public))",
		policies: [
			new Policies.Or([new ComplexAllowPipeline(), new Policies.Noone()]),
			new Policies.And([
				new ComplexAllowPipeline(),
				new Policies.Public(),
			]),
		],
	},
	{
		name: "collection-or(complex-allow-pipeline,public)",
		policies: [new ComplexAllowPipeline(), new Policies.Public()],
	},
	{
		name: "collection-or(complex-deny-pipeline,noone)",
		policies: [new ComplexDenyPipeline(), new Policies.Noone()],
	},
	{
		name: "collection-or(complex-deny-pipeline,public)",
		policies: [new ComplexDenyPipeline(), new Policies.Public()],
	},
];

function extend(t: TestAppConstructor) {
	const numbers = new (class extends Collection {
		name = "numbers";
		fields = {
			number: new FieldTypes.Int(),
		};
	})();

	const collections_to_add: { [collection: string]: Collection } = {
		numbers,
	};

	for (const { name, policies } of collections) {
		collections_to_add[name] = new (class extends Collection {
			name = name;
			fields = {
				number: new FieldTypes.SingleReference("numbers"),
			};
			policies = {
				list: new Policies.Or(policies),
				show: new Policies.Or(policies),
				create: new Policies.Public(),
			};
		})();
	}

	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			...collections_to_add,
			numbers,
		};
	};
}

async function createItems(app: Sealious.App) {
	let numbers = await Bluebird.map([0, 1, 2], (n) =>
		app.collections.numbers.suCreate({ number: n })
	);

	for (const number of numbers) {
		await Bluebird.map(collections, ({ name }) =>
			app.collections[name].suCreate({
				number: number.id,
			})
		);
	}
}

describe("OrPolicy", () => {
	it("returns everything for collection-or(nested-or(allow,noone),nested-and(allow,public))", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await createItems(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-or(nested-or(allow,noone),nested-and(allow,public))"
				)
				.then(({ items }: any) => assert.equal(items.length, 3));
		}));

	it("returns everything for or(complex-allow-pipeline,public)", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await createItems(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-or(complex-allow-pipeline,public)"
				)
				.then(({ items }: any) => assert.equal(items.length, 3));
		}));

	it("returns nothing for or(complex-deny-pipeline,noone)", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await createItems(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-or(complex-deny-pipeline,noone)"
				)
				.then(({ items }: any) => assert.equal(items.length, 0));
		}));

	it("returns everything for or(complex-deny-pipeline,public)", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await createItems(app);
			return rest_api
				.get(
					"/api/v1/collections/collection-or(complex-deny-pipeline,public)"
				)
				.then(({ items }: any) => assert.equal(items.length, 3));
		}));
});
