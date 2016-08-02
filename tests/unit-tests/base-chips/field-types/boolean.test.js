const locreq = require("locreq")(__dirname);
const field_type_boolean = locreq("lib/base-chips/field-types/boolean.js");
const Context = locreq("lib/context.js");

const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

const assert = require("assert");


describe("FieldType.Boolean", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_boolean.name, "boolean");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_boolean.get_description(), "string");
	});
	it("checks if is_proper_value works correctly (given boolean)", function(done){
        const accept = acceptCorrectly(done).accept;
        const reject = acceptCorrectly(done).reject;
		field_type_boolean.is_proper_value(accept, reject, new Context(), {}, true);
	});
	it("checks if is_proper_value works correctly (given 1)", function(done){
		const accept = acceptCorrectly(done).accept;
        const reject = acceptCorrectly(done).reject;
        field_type_boolean.is_proper_value(accept, reject, new Context(), {}, 1);
	});
	it("checks if is_proper_value works correctly (given \"true\")", function(done){
		const accept = acceptCorrectly(done).accept;
        const reject = acceptCorrectly(done).reject;
        field_type_boolean.is_proper_value(accept, reject, new Context(), {}, "true");
	});
	it("checks if is_proper_value works correctly (given 2)", function(done){
		const accept = rejectCorrectly(done).accept;
        const reject = rejectCorrectly(done).reject;
        field_type_boolean.is_proper_value(accept, reject, new Context(), {}, 2);
	});
	it("encodes the value correctly (given boolean)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, true), true);
	});
	it("encodes the value correctly (given 1)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, 1), true);
	});
	it("encodes the value correctly (given 0)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, 0), false);
	});
	it("encodes the value correctly (given \"false\")", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, "false"), false);
	});
	it("encodes the value correctly (given \"true\")", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, "true"), true);
	});
	it("encodes the value correctly (given \"true\")", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, "true"), true);
	});
	it("doesn't encode the value (given 5)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, 5), undefined);
	});
	it("filters to query when filter is an empty string", function(){
		assert.deepEqual(field_type_boolean.filter_to_query(new Context(), {}, ""), {$in: [true, false]});
	});
	it("filters to query when filter is null", function(){
		assert.deepEqual(field_type_boolean.filter_to_query(new Context(), {}, null), {$in: [true, false]});
	});
	it("filters by encoding the value \"true\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "true"), true);
	});
	it("filters by encoding the value \"false\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "false"), false);
	});
	it("filters by encoding the value \"1\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "1"), true);
	});
	it("filters by encoding the value \"0\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "0"), false);
	});
	it("filters by encoding the value 0", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, 0), false);
	});
});
