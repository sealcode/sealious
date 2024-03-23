import { predicates, ShapeToType } from "@sealcode/ts-predicates";
import type Context from "../../../../context.js";
import { ArrayAction } from "./array-action.js";

const RemoveInputShape = {
	remove: predicates.or(predicates.string, predicates.number),
};
const RemoveParsedShape = { remove: predicates.number };
export class Remove extends ArrayAction<
	ShapeToType<typeof RemoveInputShape>,
	ShapeToType<typeof RemoveParsedShape>
> {
	InputShape = RemoveInputShape;
	async _parse(
		_context: Context,
		input: ShapeToType<typeof RemoveInputShape>
	): Promise<ShapeToType<typeof RemoveParsedShape> | null> {
		return { remove: parseInt(input.remove.toString()) };
	}
	async run<T>(
		_context: Context,
		action: ShapeToType<typeof RemoveParsedShape>,
		array: T[]
	) {
		array = array.filter((_, i) => {
			return i !== action.remove;
		});
		return array;
	}
}
