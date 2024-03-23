import {
	hasShape,
	Predicate,
	Shape,
	ShapeToType,
} from "@sealcode/ts-predicates";
import type Context from "../../../../context.js";

export abstract class ArrayAction<
	InputShape extends Record<string, unknown>,
	ParsedShape extends Record<string, unknown>
> {
	constructor(
		public element_predicate: Predicate,
		public element_validator: (
			context: Context,
			element: unknown,
			index: number
		) => Promise<{
			valid: boolean;
			reason: string;
		}>
	) {}

	abstract InputShape: Shape;

	async validate<T>(
		context: Context,
		action: unknown,
		array: T[]
	): Promise<{ valid: boolean; reason: string }> {
		if (!hasShape(this.InputShape, action)) {
			return { valid: false, reason: "Wrong action shape" };
		}
		return this._validate(context, action, array);
	}

	async _validate<T>(
		context: Context,
		action: ShapeToType<this["InputShape"]>,
		array: T[]
	): Promise<{ valid: boolean; reason: string }> {
		return { valid: true, reason: "Correct shape" };
	}

	abstract _parse<T>(
		context: Context,
		input: InputShape,
		array: T[],
		empty_element: T
	): Promise<ParsedShape | null>;

	abstract run<T>(
		context: Context,
		action: ParsedShape,
		array: T[],
		empty_element: T
	): Promise<T[]>;

	async parse<T>(
		context: Context,
		input: unknown,
		array: T[],
		empty_element: T
	) {
		const validate_result = await this.validate(context, input, array);
		if (!validate_result.valid) {
			return null;
		}
		return this._parse(context, input as InputShape, array, empty_element);
	}
}
