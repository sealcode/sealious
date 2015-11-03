var Sealious = require("sealious");
SubjectDescription = Sealious.SubjectDescription;

module.exports = {
	test_start: function(){
		describe("SubjectDescription", function(){
			it("can be constructed from string", function(done){
				var d = new SubjectDescription("foo.bar.baz");
				if(d.elements[0] == "foo" && d.elements[1] == "bar" && d.elements[2] == "baz" ){
					done();
				}else{
					done(new Error("It didn't parse correctly"));
				}
			});
			it("can be contructed from array", function(done){
				var elements = ["foo", "bar", "baz"];
				var d = new SubjectDescription(elements);
				if(d.elements[0] == "foo" && d.elements[1] == "bar" && d.elements[2] == "baz" ){
					done();
				}else{
					done(new Error("It didn't parse correctly"));
				}
			});
			it("can be constructed from an instance of itself", function(done){
				var elements = ["foo", "bar", "baz"];
				var d = new SubjectDescription(elements);
				var d2 = new SubjectDescription(d);
				if(d.elements[0] == "foo" && d.elements[1] == "bar" && d.elements[2] == "baz" ){
					done();
				}else{
					done(new Error("It didn't parse correctly"));
				}
			});
		})
	}
}