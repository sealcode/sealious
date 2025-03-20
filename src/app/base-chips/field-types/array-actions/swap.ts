import { predicates, type ShapeToType } from "@sealcode/ts-predicates";
import type Context from "../../../../context.js";
import { ArrayAction } from "./array-action.js";

const SwapInputShape = {
	swap: predicates.array(predicates.or(predicates.string, predicates.number)),
};
const SwapParsedShape = { swap: predicates.array(predicates.number) };
export class Swap extends ArrayAction<
	ShapeToType<typeof SwapInputShape>,
	ShapeToType<typeof SwapParsedShape>
> {
	InputShape = SwapInputShape;
	async _validate<T>(
		_context: Context,
		action: ShapeToType<typeof SwapInputShape>,
		array: T[]
	): Promise<{ valid: boolean; reason: string }> {
		if (action.swap.length != 2) {
			return {
				valid: false,
				reason: "swap action parameter should be a list of two numbers",
			};
		}
		if (
			action.swap.some((index) => {
				index = parseInt(index.toString());
				return index >= array.length || index < 0;
			})
		) {
			return {
				valid: false,
				reason: "swap action parameter out of range",
			};
		}
		return {
			valid: true,
			reason: "swap action parameters ok",
		};
	}

	async _parse(
		_context: Context,
		input: ShapeToType<typeof SwapInputShape>
	): Promise<ShapeToType<typeof SwapParsedShape> | null> {
		if (
			typeof input.swap[0] === "number" &&
			typeof input.swap[1] === "number"
		) {
			return {
				swap: [
					parseInt(input.swap[0].toString()),
					parseInt(input.swap[1].toString()),
				],
			};
		} else {
			return null;
		}
	}
	async run<T>(
		_context: Context,
		action: ShapeToType<typeof SwapParsedShape>,
		array: T[]
	) {
		if (
			typeof action.swap[0] === "number" &&
			typeof action.swap[1] === "number"
		) {
			const temp = array[action.swap[0]];
			array[action.swap[0]] = array[action.swap[1]] as T;
			array[action.swap[1]] = temp as T;
			return array;
		} else {
			return array;
		}
	}
}
