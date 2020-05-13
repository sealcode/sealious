const assert = require("assert");
const { with_running_app } = require("../../test_utils/with-test-app.js");
const { assert_throws_async } = require("../../test_utils");

describe("request multiple items", () => {
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
			items[seal.name] = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "seals"],
				"create",
				seal
			);
		}
	}
	it("returns requested items when using run_action", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_resources(app, rest_api);

			const {
				items: [hoover, nelly],
			} = await app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "seals", [items.Hoover.id, items.Nelly.id]],
				"show"
			);

			assert.equal(hoover.name, "Hoover");
			assert.equal(nelly.name, "Nelly");
		}));

	it("returns requested items when using rest api", async () =>
		with_running_app(async ({ app, rest_api }) => {
			await create_resources(app, rest_api);

			const response = await rest_api.getSealiousResponse(
				`/api/v1/collections/seals/${items.Hoover.id}+${items.Nelly.id}?attachments[water_area]=true`
			);

			assert.equal(response.items.length, 2);
			const [hoover, nelly] = response.items;
			assert.equal(hoover.name, "Hoover");
			assert.equal(hoover.water_area.name, "Arabic Sea");
			assert.equal(nelly.name, "Nelly");
			assert.equal(nelly.water_area.name, "Baltic Sea");
		}));
});
