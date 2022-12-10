import type { ShapeToType } from "@sealcode/ts-predicates";
import type Context from "../../../../context";
import { ArrayAction } from "./array-action";

const ReplaceInputShape = {};
const ReplaceParsedShape = {};
export class Replace extends ArrayAction<
	ShapeToType<typeof ReplaceInputShape>,
	ShapeToType<typeof ReplaceParsedShape>
> {
	InputShape = ReplaceInputShape;
	async _parse(
		_context: Context
	): Promise<ShapeToType<typeof ReplaceParsedShape> | null> {
		return {};
	}
	async run<T>(
		_context: Context,
		action: ShapeToType<typeof ReplaceParsedShape>,
		array: T[]
	) {
		return array;
	}
}
