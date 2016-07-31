const locreq = require("locreq")(__dirname);

const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");
const SuperContext = locreq("lib/super-context.js");
const Context = locreq("lib/context.js");
const assert_no_error = locreq("tests/util/assert-no-error.js");
const assert_error_type = locreq("tests/util/assert-error-type.js");
const assert_error = locreq("tests/util/assert-error.js");
const assert = require("assert");

const ASTP = AccessStrategyType.prototype;

describe("AccessStrategyType", function(){

	it("when the declaration is just an AST instance, returns it unchanged", function(){
		const AST = new AccessStrategyType({checker_function: ()=>true});
		assert.strictEqual(new AccessStrategyType(AST), AST);
	});

	describe(".prototype.__is_item_sensitive", function(){
		it("should work with a boolean 'item_sensitive' value: false", function(done){
			ASTP.__is_item_sensitive({
				item_sensitive: false
			}).then(function(result){
				assert.strictEqual(result, false);
				done();
			});
		});

		it("should work with a boolean 'item_sensitive' value: true", function(done){
			ASTP.__is_item_sensitive({
				item_sensitive: true
			}).then(function(result){
				assert.strictEqual(result, true);
				done();
			});
		});

		it("should work with a function that returns a Boolean value: false", function(done){
			ASTP.__is_item_sensitive({
				item_sensitive: () => false
			}).then(function(result){
				assert.strictEqual(result, false);
				done();
			});
		});

		it("should work with a function that returns a Boolean value: true", function(done){
			ASTP.__is_item_sensitive({
				item_sensitive: () => true
			}).then(function(result){
				assert.strictEqual(result, true);
				done();
			});
		});

		it("should work with a function that returns a Boolean Promise value: false", function(done){
			ASTP.__is_item_sensitive({
				item_sensitive: () => Promise.resolve(false)
			}).then(function(result){
				assert.strictEqual(result, false);
				done();
			});
		});

		it("should work with a function that returns a Boolean Promise value: true", function(done){
			ASTP.__is_item_sensitive({
				item_sensitive: () => Promise.resolve(true)
			}).then(function(result){
				assert.strictEqual(result, true);
				done();
			});
		});
	})

	describe(".prototype.__check", function(){
		it("should resolve if given an instance of SuperContext", function(done){
			const sc = new SuperContext();
			const result = ASTP.__check({}, sc);
			assert_no_error(result, done);
		});

		it("should resolve with undefined if the strategy is item_sensitive but no item is provided", function(done){
			ASTP.__check({item_sensitive: true}, new Context(), {})
			.then(function(result){
				assert.strictEqual(result, undefined);
				done();
			});
		});

		it("should accept 'false' as a return value in checker_function", function(done){
			const declaration = {checker_function: () => false};
			const result = ASTP.__check(declaration, new Context(), {});
			assert_error_type(result, "permission", done);
		});

		it("should accept 'true' as a return value in checker_function", function(done){
			const declaration = {checker_function: () => true};
			const result = ASTP.__check(declaration, new Context(), {});
			assert_no_error(result, done);
		});

		it("should throw an error raised inside checker_function", function(done){
			const declaration = {checker_function: function(){
				throw new Error("Eat my shorts");
			}};
			const result = ASTP.__check(declaration, new Context(), {});
			assert_error(result, done);
		});

		it("should pass item as argument if the strategy is item_sensitive", function(done){
			const item = {};
			ASTP.__check(
				{
					item_sensitive: true,
					checker_function: function(context, params, _item){
						assert.strictEqual(_item, item);
						done();
					}
				},
				new Context(),
				{},
				item
			)
		});
	});

	describe("the bridges between the pure methods", function(){
		it("properly connects the __check method", function(done){
			const smth = {}
			const declaration = {
				checker_function: () => true
			};

			const strategy_type = new AccessStrategyType(declaration);
			const result = strategy_type.check(new Context(), {}, {});
			assert_no_error(result, done);
		});

		it("properly connects the __is_item_sensitive method", function(done){
			const smth = {}
			const declaration = {
				item_sensitive: () => true
			};

			const strategy_type = new AccessStrategyType(declaration);
			const result = strategy_type.is_item_sensitive({});
			assert_no_error(result, done);
		});
	});
});
