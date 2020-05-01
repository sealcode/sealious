const assert = require("assert");
const { with_running_app } = require("../../test_utils/with-test-app.js");
const { assert_throws_async } = require("../../test_utils");

describe("sorting", () => {
	const items = {};
	async function create_resources(app, rest_api) {
		app.createChip(app.Sealious.Collection, {
			name: "water_areas",
			fields: [
				{
					name: "name",
					type: "text",
					required: true,
				},
				{
					name: "temperature",
					type: "int",
					required: true,
				},
			],
		});

		app.createChip(app.Sealious.Collection, {
			name: "seals",
			fields: [
				{
					name: "name",
					type: "text",
					required: true,
				},
				{
					name: "favorite_number",
					type: "int",
					required: true,
				},
				{
					name: "water_area",
					type: "single_reference",
					params: { collection: "water_areas" },
				},
			],
		});

		items.baltic_sea = await rest_api.post(
			"/api/v1/collections/water_areas",
			{
				name: "Baltic Sea",
				temperature: 10,
			}
		);

		items.arabic_sea = await rest_api.post(
			"/api/v1/collections/water_areas",
			{
				name: "Arabic Sea",
				temperature: 20,
			}
		);

		const seals = [
			{
				name: "Hoover",
				favorite_number: 3,
				water_area: items.arabic_sea.id,
			},
			{
				name: "Maksiu",
				favorite_number: 3,
				water_area: items.baltic_sea.id,
			},
			{
				name: "Nelly",
				favorite_number: 8,
				water_area: items.baltic_sea.id,
			},
		];

		for (let seal of seals) {
			await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "seals"],
				"create",
				seal
			);
		}
	}
	it("properly sorts for correct sort key", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_resources(app, rest_api);
			const { items } = await rest_api.get(
				"/api/v1/collections/seals?sort[favorite_number]=desc"
			);

			assert.deepEqual(
				items.map((item) => item.favorite_number),
				[8, 3, 3]
			);
		}));

	it("throws application error for incorrect sort key", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_resources(app, rest_api);

			await assert_throws_async(
				async () =>
					await rest_api.get(
						"/api/v1/collections/seals?sort[favorite_number]=dsc"
					),
				(e) => {
					assert.equal(e.response.status, 405);
					assert.equal(
						e.response.data.message,
						"Unknown sort key: dsc. Available sort keys are: desc, descending, asc, ascending."
					);
				}
			);
		}));
});
