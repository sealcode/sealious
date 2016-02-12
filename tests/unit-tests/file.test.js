var Sealious = require("sealious");

module.exports = {
	test_init: function(){
		Sealious.File(new Sealious.Context(), "filename", "just_data", "my_test_file", false)
	},
	test_start: function(){
		describe("Sealious.File", function(){
			it("references a file", function(done){
				try {
					Sealious.File.Reference("id", "filename")
					done();
				}
				catch (e) {
					done(new Error(e));
				}
			});
			it("finds a file from id", function(done){
				console.log("do sprawdzenia")
				Sealious.File.from_id(new Sealious.Context(), "my_test_file")
				.then(function(result){
					if (result === undefined)
						done();
					else
						done(new Error("Result isn't undefined"))
				})
				.catch(function(error){
					done(new Error(error));
				})
			})
			it("return a new file from db entry", function(done){
				var db_document = {
					creation_context: new Sealious.Context(),
					original_name: "original_name",
					data: "data",
					id: "id",
					mime_type: "mime_type"
				}

				var result = Sealious.File.from_db_entry(db_document, "path");
				if (result.filename === db_document.original_name)
					if (result.data === db_document.data)
						if (result.id === db_document.id)
							if (result.mime === db_document.mime_type)
								done();
				else
					done(new Error("Wrong mime type"))
				else
					done(new Error("Wrong id"))
				else
					done(new Error("Wrong data"))
				else
					done(new Error("Wrong filename"))
			})
		})
	}
}