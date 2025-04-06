import assert from "assert";
import { App, Collection, FieldTypes } from "../main.js";
import { withRunningApp } from "../test_utils/with-test-app.js";

import { StructuredArray } from "../app/base-chips/field-types/structured-array.js";

// import Generator from "./generator.js";

import fs from "fs";

describe("SchemaGenerator", () => {
	it("properly maps types for the fields", async () =>
		withRunningApp(
			(test_app) =>
				class extends test_app {
					collections = {
						...App.BaseCollections,
						water_areas: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								temperature: new FieldTypes.Int(),
								best_spots: new StructuredArray({
									name: new FieldTypes.Text(),
									location: new FieldTypes.Text(),
								}),
							};
						})(),

						seals: new (class extends Collection {
							fields = {
								name: new (class extends FieldTypes.Text {
									hasDefaultValue = () => true;
									async getDefaultValue() {
										return "foczusia";
									}
								})({
									min_length: 2,
									max_length: 64,
								}),
								favorite_number: new FieldTypes.Int({
									min: 1,
									max: 9,
								}).setRequired(true),
								water_area: new FieldTypes.SingleReference(
									"water_areas"
								),
								fav_food: new FieldTypes.EnumMultiple([
									"flour",
									"carrot",
									"eggs",
									"water",
									"salt",
								]),
							};
						})(),
					};
				},
			async ({ rest_api }) => {
				const file = fs.readFileSync(
					"./src/schemas/test-basic-schema.json",
					"utf8"
				);
				const parsed_file = JSON.parse(file);

				const response = await rest_api.get("/docs/schema");

				assert.equal(
					JSON.stringify(parsed_file),
					JSON.stringify(response)
				);
			}
		));
});
