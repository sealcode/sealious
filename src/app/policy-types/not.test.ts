import assert from "assert";
import Bluebird from "bluebird";
import type Context from "../../context.js";
import * as Sealious from "../../main.js";
import {
	Collection,
	CollectionItem,
	FieldTypes,
	Policies,
} from "../../main.js";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async.js";
import {
	type TestAppConstructor,
	withRunningApp,
} from "../../test_utils/with-test-app.js";
import getAttachment from "../../test_utils/get-attachment.js";
import { TestApp } from "../../test_utils/test-app.js";

function create_less_than_policy(number: number) {
	return new (class extends Sealious.Policy {
		async _getRestrictingQuery() {
			const query = new Sealious.Query();
			const id = query.lookup({
				from: "numbers",
				localField: "number",
				foreignField: "id",
				unwind: true,
			});
			query.match({
				[`${id}.number`]: {
					$lt: number,
				},
			});
			return query;
		}
		async checkerFunction(
			_: Context,
			item_getter: () => Promise<CollectionItem>
		) {
			const item = await item_getter();
			const item_number = (
				item as unknown as {
					number: { number: number };
				}
			).number.number;
			if (item_number >= number) {
				return Sealious.Policy.deny(
					`Given value is not lower than ${number}`
				);
			}
			return Sealious.Policy.allow(`Number is less than ${number}`);
		}
		isItemSensitive = async () => true;
	})();
}

const l = (n: number) => create_less_than_policy(n);

const collections_to_create = [
	{
		name: "collection-not(less-than(2))",
		policy: l(2),
	},
	{
		name: "collection-not(less-than(6))",
		policy: l(6),
	},
	{
		name: "collection-not(public)",
		policy: new Policies.Public(),
	},
	{
		name: "collection-not(noone)",
		policy: new Policies.Noone(),
	},
];

function extend(t: TestAppConstructor) {
	const collections_to_add: { [name: string]: Collection } = {};
	for (const { name, policy } of collections_to_create) {
		collections_to_add[name] = new (class extends Collection {
			fields = {
				number: new FieldTypes.SingleReference("numbers"),
			};
			policies = {
				list: new Policies.Not(policy),
				show: new Policies.Not(policy),
				create: new Policies.Public(),
			};
		})();
	}

	return class extends t {
		collections = {
			...TestApp.BaseCollections,
			...collections_to_add,
			numbers: new (class extends Collection {
				fields = {
					number: new FieldTypes.Int(),
				};
			})(),
		};
	};
}

describe("NotPolicy", () => {
	async function setup(app: Sealious.App) {
		for (let i of [0, 1, 2, 3, 4]) {
			const { id } = await app.collections.numbers.suCreate({
				number: i,
			});
			await Bluebird.map(collections_to_create, ({ name }) =>
				app.collections[name].suCreate({
					number: id,
				})
			);
		}
	}

	it("returns nothing for collection-not(public)", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app);
			await assertThrowsAsync(
				async () =>
					await rest_api.get(
						"/api/v1/collections/collection-not(public)"
					),
				(e) => {
					assert.strictEqual((e as any).response.status, 401);
				}
			);
		}));

	it("returns everything for collection-not(noone)", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app);

			const response = await rest_api.get(
				"/api/v1/collections/collection-not(noone)?attachments[number]=true"
			);

			const numbers = response.items.map(
				(item: any) => getAttachment(item, "number", response).number
			);

			assert.deepEqual(numbers, [0, 1, 2, 3, 4]);
		}));

	it("returns correct numbers for collection-not(less-than(2))", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app);

			const response = await rest_api.get(
				"/api/v1/collections/collection-not(less-than(2))?attachments[number]=true"
			);

			const numbers = response.items.map(
				(item: any) => getAttachment(item, "number", response).number
			);

			assert.deepEqual(numbers, [2, 3, 4]);
		}));

	it("returns correct numbers for collection-not(less-than(6))", () =>
		withRunningApp(extend, async ({ app, rest_api }) => {
			await setup(app);

			const response = await rest_api.get(
				"/api/v1/collections/collection-not(less-than(6))?attachments[number]=true"
			);

			const numbers = response.items.map(
				(item: any) => getAttachment(item, "number", response).number
			);

			assert.deepEqual(numbers, []);
		}));
});
