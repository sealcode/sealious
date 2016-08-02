const locreq = require("locreq")(__dirname);
const assert = require("assert");
const FieldTypeDescription = locreq("lib/data-structures/field-type-description.js");

describe("Sealious.FieldTypeDescription", function() {
    it("returns a FieldTypeDescription object", function() {
        const ftd = new FieldTypeDescription("a", "b", "c");
        assert.strictEqual(ftd.summary, "a");
        assert.strictEqual(ftd.raw_params, "b");
        assert.strictEqual(ftd.extra_info, "c");

        const ftd2 = new FieldTypeDescription("a", "b");
        assert.deepEqual(ftd2.extra_info, {});
    });
});
