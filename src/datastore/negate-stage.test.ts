import assert from "assert";
import negate_match from "./negate-stage.js";

describe("negate-stage", () => {
	it("properly negates queries", () => {
		assert.deepStrictEqual(negate_match({}), {});
		assert.deepStrictEqual(negate_match({ done: false }), { done: true });
		assert.deepStrictEqual(negate_match({ name: "seal" }), {
			name: { $not: { $eq: "seal" } },
		});
	});
});
