import assert from "assert";
import Bluebird from "bluebird";
import { App, Collection, FieldTypes, Policies } from "../../main";

import { withRunningApp } from "../../test_utils/with-test-app";
import create_policies from "../../test_utils/policy-types/create-policies-with-complex-pipeline";
import And from "./and";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { TestAppType } from "../../test_utils/test-app";

const [ComplexDenyPipeline, ComplexAllowPipeline] = create_policies.allowDeny();

const collections_to_create = [
	{
		name:
			"collection-and(nested-and(allow, public), nested-or(allow, noone))",
		policies: [
			new And([new ComplexAllowPipeline(), new Policies.Public()]),
			new Policies.Or([new ComplexAllowPipeline(), new Policies.Noone()]),
		],
	},
	{
		name: "collection-and(ComplexAllowPipeline, noone)",
		policies: [new ComplexAllowPipeline(), new Policies.Noone()],
	},
	{
		name: "collection-and(ComplexAllowPipeline, public)",
		policies: [new ComplexAllowPipeline(), new Policies.Public()],
	},
	{
		name: "collection-and(complexDenyPipeline, public)",
		policies: [new ComplexDenyPipeline(), new Policies.Public()],
	},
];

function extend(t: TestAppType) {
	const collections: { [name: string]: Collection } = {};
	for (const { name, policies } of collections_to_create) {
		collections[name] = new (class extends Collection {
			name = name;
			fields = {
				number: new FieldTypes.SingleReference("numbers"),
			};
			policies = {
				show: new And(policies),
				create: new Policies.Public(),
			};
		})();
	}

	return class extends t {
		collections = {
			...t.BaseCollections,
			numbers: new (class extends Collection {
				name = "numbers";
				fields = {
					number: new FieldTypes.Int(),
				};
			})(),
		};
	};
}

describe("AndPolicy", () => {
	async function setup(app: App) {
		let numbers = await Bluebird.map([0, 1, 2], (n) =>
			app.collections.numbers.suCreate({
				number: n,
			})
		);

		for (const number of numbers) {
			await Bluebird.map(collections_to_create, ({ name }) =>
				app.collections[name].suCreate({
					number: number.id,
				})
			);
		}
	}

	it("return everything for collection-and(nested-and(allow, public), nested-or(allow, noone))", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
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
		withRunningApp(extend, async ({ app, rest_api }) => {
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
		withRunningApp(extend, async ({ app, rest_api }) => {
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
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app);
			const { items } = await rest_api.get(
				"/api/v1/collections/collection-and(complexDenyPipeline, public)"
			);
			assert.equal(items.length, 0);
		}));
});
