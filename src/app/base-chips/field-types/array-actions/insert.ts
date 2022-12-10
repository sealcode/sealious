import { predicates, ShapeToType } from "@sealcode/ts-predicates";
import type Context from "../../../../context";
import { ArrayAction } from "./array-action";

const InsertInputShape = {
	insert: predicates.shape({
		index: predicates.maybe(
			predicates.or(predicates.number, predicates.string)
		),
		value: predicates.any,
	}),
};
const InsertParsedShape = {
	insert: predicates.shape({
		index: predicates.number,
		value: predicates.any,
	}),
};

export class Insert extends ArrayAction<
	ShapeToType<typeof InsertInputShape>,
	ShapeToType<typeof InsertParsedShape>
> {
	InputShape = InsertInputShape;
	async _validate<T>(
		context: Context,
		action: ShapeToType<typeof InsertInputShape>,
		array: T[]
	): Promise<{ valid: boolean; reason: string }> {
		const validation_result = await this.element_validator(
			context,
			action.insert.value || {},
			action.insert.index == undefined
				? array.length
				: parseInt(action.insert.index.toString())
		);
		if (!validation_result.valid) {
			return {
				valid: false,
				reason: validation_result.reason,
			};
		}
		return { valid: true, reason: "Insert action shape ok" };
	}

	async _parse<T>(
		_context: Context,
		input: ShapeToType<typeof InsertInputShape>,
		array: T[],
		emptyValue: T
	): Promise<ShapeToType<typeof InsertParsedShape> | null> {
		return {
			insert: {
				index: parseInt(
					(input.insert.index || array.length).toString()
				),
				value: input.insert.value || emptyValue,
			},
		};
	}
	async run<T>(
		_context: Context,
		action: ShapeToType<typeof InsertParsedShape>,
		array: T[],
		emptyElement: T
	) {
		const n = parseInt(
			(action.insert.index === undefined
				? array.length
				: action.insert.index
			).toString()
		);
		array = [
			...array.slice(0, n),
			action.insert.value === undefined
				? emptyElement
				: action.insert.value,
			...array.slice(n),
		];
		return array;
	}
}
