const Context = require.main.require("lib/context.js");
const field_type_datetime = require.main.require("lib/base-chips/field-types/datetime.js");
const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Datetime", function(){
    it("returns the name of the field type", function() {
        assert.strictEqual(field_type_datetime.name, "datetime");
    });
    it("returns the description of the field type", function(){
        assert.strictEqual(typeof field_type_datetime.get_description(), "string");
    });
    it("checks if is_proper_value works correctly(given timestamp)", function(done){
        const {accept, reject} = acceptCorrectly(done);
        field_type_datetime.is_proper_value(accept, reject, new Context(), {}, 1);
    });
    it("checks if is_proper_value works correctly(given string)", function(done){
        const {accept, reject} = rejectCorrectly(done);
        field_type_datetime.is_proper_value(accept, reject, new Context(), {}, "test")
    });
    it("checks if encode works properly (given \"1\")", function(){
        assert.strictEqual(field_type_datetime.encode(new Context(), {}, "1"), 1)
    });
});
