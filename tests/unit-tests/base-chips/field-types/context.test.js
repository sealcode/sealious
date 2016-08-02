const field_type_context = require.main.require("lib/base-chips/field-types/context.js");
const Context = require.main.require("lib/context.js");

const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Context", function(){
    it("returns the name of the field type", function(){
        assert.strictEqual(field_type_context.name, "context");
    });
    it("accepts an instance of Sealious.Context", function(done){
        const accept = acceptCorrectly(done).accept;
        const reject = acceptCorrectly(done).reject;
        field_type_context.is_proper_value(accept, reject, new Context(), {}, new Context());
    });
    it("rejects a non-instance of Sealious.Context", function(done){
        const accept = rejectCorrectly(done).accept;
        const reject = rejectCorrectly(done).reject;
        field_type_context.is_proper_value(accept, reject, new Context(), {}, {});
    });
});
