const Promise = require("bluebird");
const faker = require("faker");

module.exports = async function populate(app) {
	app.createChip(app.Sealious.Collection, {
		name: "water_areas",
		fields: [
			{
				name: "name",
				type: "text",
				required: true,
			},
			{
				name: "type",
				type: "single_reference",
				params: { collection: "water_area_types" },
			},
		],
	});

	app.createChip(app.Sealious.Collection, {
		name: "water_area_types",
		fields: [
			{
				name: "type_name",
				type: "text",
				required: true,
			},
			{
				name: "how_good_for_seals",
				type: "text",
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
				name: "weight",
				type: "float",
				required: true,
			},
			{
				name: "dob",
				type: "date",
				required: true,
			},
			{
				name: "favourite_word",
				type: "text",
			},
			{
				name: "water_area",
				type: "single_reference",
				params: { collection: "water_areas" },
			},
		],
	});

	const items = {};

	items.cool_sea = await app.run_action(
		new app.Sealious.SuperContext(),
		["collections", "water_area_types"],
		"create",
		{
			type_name: "Cool Sea",
			how_good_for_seals: "perfect",
		}
	);

	items.warm_sea = await app.run_action(
		new app.Sealious.SuperContext(),
		["collections", "water_area_types"],
		"create",
		{
			type_name: "Cool Sea",
			how_good_for_seals: "perfect",
		}
	);

	items.northern_sea = await app.run_action(
		new app.Sealious.SuperContext(),
		["collections", "water_areas"],
		"create",
		{
			name: "Northern Sea",
			type: items.cool_sea.id,
		}
	);

	items.baltic_sea = await app.run_action(
		new app.Sealious.SuperContext(),
		["collections", "water_areas"],
		"create",
		{
			name: "Baltic Sea",
			type: items.cool_sea.id,
		}
	);

	items.arabic_sea = await app.run_action(
		new app.Sealious.SuperContext(),
		["collections", "water_areas"],
		"create",
		{
			name: "Arabic Sea",
			type: items.warm_sea.id,
		}
	);

	const randomSea = () =>
		items[
			faker.random.arrayElement([
				"northern_sea",
				"baltic_sea",
				"arabic_sea",
			])
		].id;

	const seals = [];

	for (let i = 0; i < 5000; ++i) {
		seals.push({
			name: faker.name.firstName(),
			weight: faker.random.number() / 100,
			dob: faker.date
				.past()
				.toISOString()
				.split("T")[0],
			favourite_word: faker.lorem.word(),
			water_area: randomSea(),
		});
	}

	await Promise.map(
		seals,
		seal =>
			app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "seals"],
				"create",
				seal
			),
		{ concurrency: 25 }
	);
};
