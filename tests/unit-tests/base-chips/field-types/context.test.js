const locreq = require("locreq")(__dirname);
const field_type_context = locreq("lib/base-chips/field-types/context.js");
const Context = locreq("lib/context.js");

const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

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
