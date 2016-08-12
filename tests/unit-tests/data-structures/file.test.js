"use strict";
const locreq = require("locreq")(__dirname);
const File = locreq("lib/data-structures/file.js");
const Context = locreq("lib/context.js");

const assert = require("assert");

describe("Sealious.File", function(){
	it("references a file", function(){
		assert.doesNotThrow(function() {
			File.Reference("id", "filename")
		});
	});
	// it("finds a file from id", function(){
	// 	// doesn't work
	// 	// File.from_id(new Context(), "my_test_file")
	// 	// .then(function(result){
	// 	// 	if (result === undefined)
	// 	// 		done();
	// 	// 	else
	// 	// 		done(new Error("Result isn't undefined"))
	// 	// })
	// 	// .catch(function(error){
	// 	// 	done(new Error(error));
	// 	// })
	// })
	it("return a new file from db entry", function(){
		const db_document = {
			creation_context: new Context(),
			original_name: "original_name",
			data: "data",
			id: "id",
			mime_type: "mime_type"
		}

		const result = File.from_db_entry(db_document, "path");
		assert.strictEqual(result.filename, db_document.original_name);
		assert.strictEqual(result.data, db_document.data);
		assert.strictEqual(result.id, db_document.id);
		assert.strictEqual(result.mime, db_document.mime_type)
	});
});
