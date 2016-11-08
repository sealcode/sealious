const assert = require("assert");
const locreq = require("locreq")(__dirname);

const FieldType = locreq("lib/chip-types/field-type.js");
const app = {};

describe("Sealious.FieldType", function(){
    it("loads a predefined chip", function(done){
        const int = locreq("lib/app/base-chips/field-types/int.js");
        const field_type = new FieldType(app, int);
        assert.strictEqual(field_type.name, "int");
        field_type.get_description()
            .then(function(description){
                assert.strictEqual(description, "An integer number.");
            }).catch(done);
        field_type.is_proper_value(null, null, 2)
            .then(function(){
            }).catch(done);
        field_type.encode(null, null, "2")
            .then(function(result){
                assert.strictEqual(result, 2);
            });
        field_type.is_proper_value(null, null, "a")
            .then(function(){
                done(new Error("It didn't reject"));
            })
            .catch(function(err){
                assert.strictEqual(err, "Value 'a' is not a int number format.");
                done();
            });
    });
});
