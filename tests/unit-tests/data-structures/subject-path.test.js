var SubjectPath = require.main.require("lib/data-structures/subject-path.js");

describe("SubjectPath", function(){

	it("can be constructed from string", function(done){
		var d = new SubjectPath("foo.bar.baz");
		if (d.elements[0] == "foo" && d.elements[1] == "bar" && d.elements[2] == "baz" ){
			done();
		} else {
			done(new Error("It didn't parse correctly"));
		}
	});

	it("can be contructed from array", function(done){
		var elements = ["foo", "bar", "baz"];
		var d = new SubjectPath(elements);
		if (d.elements[0] == "foo" && d.elements[1] == "bar" && d.elements[2] == "baz" ){
			done();
		} else {
			done(new Error("It didn't parse correctly"));
		}
	});

	it("can be constructed from an instance of itself", function(done){
		var elements = ["foo", "bar", "baz"];
		var d = new SubjectPath(elements);
		var d2 = new SubjectPath(d);
		if (d.elements[0] == "foo" && d.elements[1] == "bar" && d.elements[2] == "baz" ){
			done();
		} else {
			done(new Error("It didn't parse correctly"));
		}
	});
})
