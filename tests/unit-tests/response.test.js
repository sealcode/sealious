
module.exports = {
	test_init: function(){
		Sealious.Response({"field": "value"}, true, "type", "message")
	},
	test_start: function(){
		describe("Sealious.Response", function(){
			it("returns a Sealious.Response object", function(done){
				var error = new Sealious.Errors.BadContext("This is an error", "test_data");
				var response = Sealious.Response.fromError(error);
				if (response.data === "test_data")
					if (response.type === "permission")
						if (response.status_message === "This is an error")
							done();
				else
					done("Wrong status_message")
				else
					done("Wrong type")
				else
					done("Wrong data")
			})
		})
	}
};
