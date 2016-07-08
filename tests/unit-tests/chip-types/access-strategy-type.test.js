var AccessStrategyType = require.main.require("lib/chip-types/access-strategy-type.js");
var SuperContext = require.main.require("lib/super-context.js");
var Context = require.main.require("lib/context.js");
var assert_no_error = require.main.require("tests/util/assert-no-error.js");
var assert = require.main.require("assert");


describe("AccessStrategyType", function(){
	describe(".prototype.check", function(){
		it("should resolve if given an instance of SuperContext", function(done){
			var sc = new SuperContext();
			var result = AccessStrategyType.prototype.__check({}, sc);
			assert_no_error(result, done);
		});

		it("should resolve with undefined if the strategy is item_sensitive but no item is provided", function(done){
			AccessStrategyType.prototype.__check({item_sensitive: true}, new Context(), {})
			.then(function(result){
				done(assert.equal(result, undefined))
			})
		});

		/*		it("should accept 'false' as a return value in checker_function", function(done){

				});

				it("should accept 'true' as a return value in checker_function", function(done){

				});*/

		it("should pass item as argument if the strategy is item_sensitive", function(done){
			var item = {};
			AccessStrategyType.prototype.__check(
				{
					item_sensitive: true,
					checker_function: function(context, params, _item){
						done(assert.equal(_item, item));
					}
				},
				new Context(),
				{},
				item
			)
		});
	});
});
