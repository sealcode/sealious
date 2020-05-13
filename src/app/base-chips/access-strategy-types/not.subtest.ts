import assert from "assert";
import Bluebird from "bluebird";
import * as Sealious from "./../../../main";
import { with_running_app } from "../../../../test_utils/with-test-app";
import assert_throws_async from "../../../../test_utils/assert_throws_async.js";
import Context from "../../../context";
import SealiousResponse from "../../../../common_lib/response/sealious-response";

describe("NotAccessStrategy", () => {
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

		create_less_than_strategy(app, 2);
		create_less_than_strategy(app, 6);

		const collections = [
			{
				name: "collection-not(less-than(2))",
				strategy: ["less-than(2)"],
			},
			{
				name: "collection-not(less-than(6))",
				strategy: ["less-than(6)"],
			},
			{
				name: "collection-not(public)",
				strategy: ["public"],
			},
			{
				name: "collection-not(noone)",
				strategy: ["noone"],
			},
		];

		for (const { name, strategy } of collections) {
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
					show: ["not", strategy],
					create: "public",
				},
			});
		}

		for (let i of [0, 1, 2, 3, 4]) {
			const { id } = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number: i }
			);

			await Bluebird.map(collections, ({ name }) =>
				app.run_action(
					new app.Sealious.SuperContext(),
					["collections", name],
					"create",
					{ number: id }
				)
			);
		}
	}

	function create_less_than_strategy(app: Sealious.App, number: number) {
		class LessThanStrategy extends Sealious.AccessStrategy {
			async getRestrictingQuery() {
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
					return Sealious.AccessStrategy.deny(
						`Given value is not lower than ${number}`
					);
				}
				return Sealious.AccessStrategy.allow(
					`Number is less than ${number}`
				);
			}
			isItemSensitive = async () => true;
		}
		app.ChipManager.addChip(
			"access_strategy_type",
			`less-than(${number})`,
			LessThanStrategy
		);
	}

	it("returns nothing for collection-not(public)", () =>
		with_running_app(async ({ app, rest_api }) => {
			await setup(app);
			await assert_throws_async(
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
		with_running_app(async ({ app, rest_api }) => {
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
		with_running_app(async ({ app, rest_api }) => {
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
		with_running_app(async ({ app, rest_api }) => {
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
