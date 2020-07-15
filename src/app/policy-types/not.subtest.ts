import assert from "assert";
import Bluebird from "bluebird";
import SealiousResponse from "../../../common_lib/response/sealious-response";
import Context from "../../context";
import * as Sealious from "../../main";
import {
	Collection,
	FieldTypes,
	Policies,
	FieldDefinitionHelper as field,
} from "../../main";
import { assertThrowsAsync } from "../../test_utils/assert-throws-async";
import { withRunningApp } from "../../test_utils/with-test-app";

describe("NotPolicy", () => {
	async function setup(app: Sealious.App) {
		Collection.fromDefinition(app, {
			name: "numbers",
			fields: [field("number", FieldTypes.Int)],
		});

		const l = (n: number) => create_less_than_strategy(n);

		const collections = [
			{
				name: "collection-not(less-than(2))",
				strategy: [l(2)],
			},
			{
				name: "collection-not(less-than(6))",
				strategy: [l(6)],
			},
			{
				name: "collection-not(public)",
				strategy: Policies.Public,
			},
			{
				name: "collection-not(noone)",
				strategy: Policies.Noone,
			},
		];

		for (const { name, strategy } of collections) {
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
					show: [Policies.Not, strategy],
					create: Policies.Public,
				},
			});
		}

		for (let i of [0, 1, 2, 3, 4]) {
			const { id } = await app.runAction(
				new app.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number: i }
			);

			await Bluebird.map(collections, ({ name }) =>
				app.runAction(
					new app.SuperContext(),
					["collections", name],
					"create",
					{ number: id }
				)
			);
		}
	}

	function create_less_than_strategy(number: number) {
		return class extends Sealious.Policy {
			async _getRestrictingQuery() {
				const query = new Sealious.Query();
				const id = query.lookup({
					from: "numbers",
					localField: "number",
					foreignField: "sealious_id",
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
				sealious_response: SealiousResponse
			) {
				const item_number = ((sealious_response as unknown) as {
					number: { number: number };
				}).number.number;
				if (item_number >= number) {
					return Sealious.Policy.deny(
						`Given value is not lower than ${number}`
					);
				}
				return Sealious.Policy.allow(`Number is less than ${number}`);
			}
			isItemSensitive = async () => true;
		};
	}

	it("returns nothing for collection-not(public)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);
			await assertThrowsAsync(
				async () =>
					await rest_api.get(
						"/api/v1/collections/collection-not(public)"
					),
				(e) => {
					assert.equal((e as any).response.status, 401);
				}
			);
		}));

	it("returns everything for collection-not(noone)", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);

			const response = await rest_api.getSealiousResponse(
				"/api/v1/collections/collection-not(noone)?attachments[number]=true"
			);

			const numbers = response.items.map(
				(item) => (item.number as { number: number }).number
			);

			assert.deepEqual(numbers, [0, 1, 2, 3, 4]);
		}));

	it("returns correct numbers for collection-not(less-than(2))", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);

			const response = await rest_api.getSealiousResponse(
				"/api/v1/collections/collection-not(less-than(2))?attachments[number]=true"
			);

			const numbers = response.items.map(
				(item) => (item.number as { number: number }).number
			);

			assert.deepEqual(numbers, [2, 3, 4]);
		}));

	it("returns correct numbers for collection-not(less-than(6))", () =>
		withRunningApp(async ({ app, rest_api }) => {
			await setup(app);

			const response = await rest_api.getSealiousResponse(
				"/api/v1/collections/collection-not(less-than(6))?attachments[number]=true"
			);

			const numbers = response.items.map(
				(item) => (item.number as { number: number }).number
			);

			assert.deepEqual(numbers, []);
		}));
});
