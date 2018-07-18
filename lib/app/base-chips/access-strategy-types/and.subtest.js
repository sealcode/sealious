const assert = require("assert");
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const { with_running_app } = locreq("test_utils/with-test-app.js");
const { get_collection_as, create_resource_as } = locreq("test_utils");
const create_strategies = locreq(
	"test_utils/access-strategy-types/create_strategies_with_complex_pipeline"
);

describe("AndAccessStrategy", () => {
	let port;
	async function setup(app) {
		port = app.ConfigManager.get("www-server.port");
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
					"collection-and(nested-and(allow, public), nested-or(allow, noone))",
				strategies: [
					["and", ["complex-allow-pipeline", "public"]],
					["or", ["complex-allow-pipeline", "noone"]],
				],
			},
			{
				name: "collection-and(complex-allow-pipeline, noone)",
				strategies: ["complex-allow-pipeline", "noone"],
			},
			{
				name: "collection-and(complex-allow-pipeline, public)",
				strategies: ["complex-allow-pipeline", "public"],
			},
			{
				name: "collection-and(complex-deny-pipeline, public)",
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
					show: ["and", strategies],
					create: "public",
				},
			});
		}

		let numbers = await Promise.map([0, 1, 2], n =>
			app.run_action(
				new app.Sealious.SuperContext(),
				["collections", "numbers"],
				"create",
				{ number: n }
			)
		);

		for (const number of numbers) {
			await Promise.map(collections, ({ name }) =>
				app.run_action(
					new app.Sealious.SuperContext(),
					["collections", name],
					"create",
					{ number: number.id }
				)
			);
		}
	}

	it("return everything for collection-and(nested-and(allow, public), nested-or(allow, noone))", () =>
		with_running_app(async ({ app }) => {
			await setup(app);
			return get_collection_as({
				collection:
					"collection-and(nested-and(allow, public), nested-or(allow, noone))",
				port,
			}).then(data => assert.equal(data.length, 3));
		}));

	it("returns nothing for and(complex-allow-pipeline, noone)", () =>
		with_running_app(async ({ app }) => {
			await setup(app);
			return get_collection_as({
				collection: "collection-and(complex-allow-pipeline, noone)",
				port,
			}).then(data => assert.equal(data.length, 0));
		}));

	it("returns everything for and(complex-allow-pipeline, public)", () =>
		with_running_app(async ({ app }) => {
			await setup(app);
			return get_collection_as({
				collection: "collection-and(complex-allow-pipeline, public)",
				port,
			}).then(data => assert.equal(data.length, 3));
		}));

	it("returns nothing for and(complex-deny-pipeline, public)", () =>
		with_running_app(async ({ app }) => {
			await setup(app);
			return get_collection_as({
				collection: "collection-and(complex-deny-pipeline, public)",
				port,
			}).then(data => assert.equal(data.length, 0));
		}));
});
