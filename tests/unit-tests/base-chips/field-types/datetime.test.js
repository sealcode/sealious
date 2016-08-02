const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_datetime = locreq("lib/base-chips/field-types/datetime.js");
const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Datetime", function(){
    it("returns the name of the field type", function() {
        assert.strictEqual(field_type_datetime.name, "datetime");
    });
    it("returns the description of the field type", function(){
        assert.strictEqual(typeof field_type_datetime.get_description(), "string");
    });
    it("checks if is_proper_value works correctly(given timestamp)", function(done){
        const accept = acceptCorrectly(done).accept;
        const reject = acceptCorrectly(done).reject;
        field_type_datetime.is_proper_value(accept, reject, new Context(), {}, 1);
    });
    it("checks if is_proper_value works correctly(given string)", function(done){
        const accept = rejectCorrectly(done).accept;
        const reject = rejectCorrectly(done).reject;
        field_type_datetime.is_proper_value(accept, reject, new Context(), {}, "test");
    });
    it("checks if encode works properly (given \"1\")", function(){
        assert.strictEqual(field_type_datetime.encode(new Context(), {}, "1"), 1);
    });
});
