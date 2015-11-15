var Sealious = require("sealious");

module.exports = {
	test_init: function() {

	},
	test_start: function() {
		describe("Sealious.Datastore", function() {
			it("returns a developer error \"not implemented\"", function(done) {
				var func = Sealious.Dispatcher.datastore.return_not_implemented("not implemented");
				try {
					func();
					done("It didn't throw an error at all")
				}
				catch (e) {
					if (e.type === "dev_error")
						done();
					else
						done("It didn't throw a proper error");
				}
			})
		})
	}
}