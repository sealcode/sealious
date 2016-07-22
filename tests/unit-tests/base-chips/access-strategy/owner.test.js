const Context = require.main.require("lib/context.js");
const assert = require("assert");
const assert_no_error = require.main.require("tests/util/assert-no-error.js");
const assert_error = require.main.require("tests/util/assert-error.js");

const owner = require.main.require("lib/base-chips/access-strategy-types/owner.js");

describe("AccessStrategy.owner", function(){
	it("checks if the user is the owner and returns true", function(done){
		const context = new Context(undefined, "ip", "user_id");
		const item = {
			created_context: {
				user_id: "user_id"
			}
		}
		const result = owner.checker_function(context, {}, item);
		assert_no_error(result, done);
	});

	it("throws if the owner id doesn't match the owner in the created_context", function(done){
		const context = new Context(undefined, "ip", "user_id");
		const item = {
			created_context: {
				user_id: "other_user_id"
			}
		}
		const result = owner.checker_function(context, {}, item);
		assert_error(result, done);
	});
})
