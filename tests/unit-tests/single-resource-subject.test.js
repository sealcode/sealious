var Sealious = require("sealious");
var UUIDGenerator = require("uid");

var assert_error_type = require("../util/assert-error-type.js");

var SingleResourceSubject = require("../../lib/subject/subject-types/single-resource-subject.js");

module.exports = {
	test_start: function(){
		describe("Subject type: single-resource", function(){
			describe(".get_resource", function(){
				var rt_name = UUIDGenerator(10);

				var field_value = UUIDGenerator(10);

				var rt = new Sealious.ResourceType({
					name: rt_name,
					fields: [{name: "value", type: "text"}]
				})


				it("should find an existing resource", function(done){

					var create_action = new Sealious.Action(["resources", rt_name], "create");
					create_action.run(new Sealious.Context(), {value: field_value})
					.then(function(created_resource){
						var subject = new SingleResourceSubject(rt, created_resource.id);
						return subject.perform_action(new Sealious.Context(), "show")
						.then(function(retrieved_resource){
							if (retrieved_resource.id == created_resource.id && retrieved_resource.body.value == field_value){
								done();
							} else {
								done(new Error("Retrieved id or field value were incorrect"));
							}
						})
					})
				})

				it("should throw a 'not_found' error if the provided resource id does not exist", function(done){
					var subject = new SingleResourceSubject(rt, "made-up_id");
					var promise = subject.perform_action(new Sealious.Context(), "show");
					assert_error_type(promise, "not_found", done);
				})
			})
		})
	}
}
