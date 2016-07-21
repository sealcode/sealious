const CheckVersion = require.main.require("lib/utils/check-version.js");
const request = require("request-promise");
const assert = require("assert");

describe("Sealious.CheckVersion", function() {
    it("says there are no updates to Sealious", function(done) {
        request("http://registry.npmjs.org/sealious/0.7")
            .then(res => JSON.parse(res))
            .then(sealious_npm => CheckVersion(sealious_npm))
            .then( ({status, message}) => {
                assert.strictEqual(status, "info");
                assert.notStrictEqual(message.indexOf("up-to-date"), -1);
                done();
            })
            .catch(function(err) {
                done(new Error(err));
            });
    });
    it("says there are updates to Sealious", function(done) {
        const pkg = {version: "0.7.1"};
        CheckVersion(pkg)
            .then( ({status, message}) => {
                assert.strictEqual(status, "warning");
                assert.notStrictEqual(message.indexOf("update available"), -1);
                done();
            })
            .catch(function(err) {
                done(new Error(err));
            });
    });
    it("throws an error because an invalid argument was passed", function() {
        assert.throws(function() {
            CheckVersion("troll");
        },
        function(err) {
            if (err.type === "validation") {
                return true;
            }
        },
        "Unexpected error");
    });
    it("throws an error because a nonexisiting version was given", function(done) {
        CheckVersion({version: "0.888888.10"})
            .then(function() {
                done(new Error("It didn't throw the error!"));
            })
            .catch(function(err) {
                if (err.statusCode === 404) {
                    done();
                }
                else {
                    done(new Error(err));
                }
            });
    });
});
