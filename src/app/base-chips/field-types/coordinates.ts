import { hasShape, predicates } from "@sealcode/ts-predicates";
import { Context, Field, type ValidationResult } from "../../../main.js";

export type CoordinatesFieldInputType =
	| string
	| number[]
	| { lat: number; lon: number };
type FormatType = "string" | "tuple" | "object";
type GeoJSONPoint = { type: "Point"; coordinates: number[] };

/** A field for coordinates, to handle values in diffrent form and store them in normalized GeoJSON format.
 *
 * **Accepted values**: strings (i.g. "12.12421,65.21312") tuple (i.g. `[12.12421, 65.21312]`) or object (i.g. `{lat: 12.12421, lon: 65.21312})`
 */

export default class Coordinates extends Field<
	CoordinatesFieldInputType,
	CoordinatesFieldInputType,
	GeoJSONPoint
> {
	typeName = "coordinates";

	async isProperValue(
		ctx: Context,
		value: CoordinatesFieldInputType
	): Promise<ValidationResult> {
		if (typeof value === "string" && value.split(",").length === 2) {
			return Field.valid();
		} else if (Array.isArray(value) && value.length === 2) {
			return Field.valid();
		} else if (
			typeof value === "object" &&
			"lat" in value &&
			"lon" in value
		) {
			return Field.valid();
		} else {
			return Field.invalid(ctx.app.i18n("invalid_coordinates"));
		}
	}

	async encode(
		_: Context,
		value: CoordinatesFieldInputType
	): Promise<GeoJSONPoint> {
		if (typeof value === "string") {
			const coords = value.split(",").map(parseFloat);
			const [lat, lon] = [coords[0], coords[1]];

			if (lat === undefined || lon === undefined) {
				throw new Error("coords is missing");
			}

			return {
				type: "Point",
				coordinates: [lat, lon],
			};
		} else if (Array.isArray(value) && value.length === 2) {
			return {
				type: "Point",
				coordinates: value,
			};
		} else if (
			typeof value === "object" &&
			"lat" in value &&
			"lon" in value
		) {
			const { lat, lon } = value as { lat: number; lon: number };
			return {
				type: "Point",
				coordinates: [lat, lon],
			};
		} else {
			throw new Error("Invalid coordinates value");
		}
	}

	async decode(
		_: Context,
		db_value: unknown,
		__: unknown,
		format?: FormatType
	): Promise<CoordinatesFieldInputType> {
		if (
			!hasShape(
				{
					type: predicates.string,
					coordinates: predicates.array(predicates.number),
				},
				db_value
			)
		) {
			throw new Error("db value has incorrect shape");
		}
		const dbValueCasted = db_value as GeoJSONPoint;
		if (
			dbValueCasted?.type !== "Point" ||
			!Array.isArray(dbValueCasted?.coordinates) ||
			dbValueCasted?.coordinates.length !== 2
		) {
			throw new Error("db value is not vnvalid GeoJSON object");
		}

		if (format === "string") {
			return `${dbValueCasted.coordinates[0]},${dbValueCasted.coordinates[1]}`;
		} else if (format === "tuple") {
			return dbValueCasted.coordinates;
		} else if (format === "object") {
			if (
				dbValueCasted.coordinates[0] === undefined ||
				dbValueCasted.coordinates[1] === undefined
			) {
				throw new Error(
					"coordinate provided in dbValueCasted is missing"
				);
			}

			return {
				lat: dbValueCasted.coordinates[0],
				lon: dbValueCasted.coordinates[1],
			};
		} else {
			return dbValueCasted.coordinates;
		}
	}
}
