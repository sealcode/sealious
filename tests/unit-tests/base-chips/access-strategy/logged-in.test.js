const Context = require.main.require("lib/context.js");
const assert = require("assert");
const assert_no_error = require.main.require("tests/util/assert-no-error.js");
const assert_error = require.main.require("tests/util/assert-error.js");

const logged_in = require.main.require("lib/base-chips/access-strategy-types/logged_in.js");

describe("AccessStrategy.Logged-In", function() {
    it("returns the name of the access strategy", function() {
        assert.strictEqual(logged_in.name, "logged_in");
    });
    it("resolves the checker function", function(done) {
        logged_in.checker_function({user_id: true})
            .then(function() {
                done();
            })
            .catch(function(err) {
                done(new Error(err));
            });
    });
    it("rejects the checker function", function(done) {
        logged_in.checker_function({user_id: false})
            .then(function() {
                done("It didn't reject the checker function!");
            })
            .catch(function(err) {
                assert.notStrictEqual(err.indexOf("Only logged-in users can perform this action."), -1);
                done();
            });
    });
});
