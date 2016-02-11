var Sealious = require("sealious");

var ResourceTypeCollectionSubject = require("../../lib/subject/subject-types/resource-type-collection-subject.js");

module.exports = {
	test_start: function(){
		describe("Subject type: resource-type-collection", function(){
			describe(".create", function(){
				describe("should check access privilages, so it", function(){
					var rt_user1_only = new Sealious.ResourceType({
						name: "impossible_to_manipulate",
						fields: [],
						access_strategy: new Sealious.AccessStrategy({
							checker_function: function(context){
								if(context.get("user_id")==1){
									return Promise.resolve();
								}else{
									return Promise.reject("You are not user1!!");
								}
							}
						})
					});

					var rt_user1_only_subject = new ResourceTypeCollectionSubject(rt_user1_only);
					it("should not allow creating a resource when the access strategy forbids it", function(done){
						rt_user1_only_subject.perform_action(new Sealious.Context(0, null, 2), "create", {})
						.then(function(){
							done(new Error("But it didn't throw an error"));
						}).catch(function(){
							done();
						})
					})

					it("should allow creating a resource when the access strategy does not forbid it", function(done){
						var rt_user1_only_subject = new ResourceTypeCollectionSubject(rt_user1_only);

						rt_user1_only_subject.perform_action(new Sealious.Context(0, null, 1), "create", {})
						.then(function(){
							done();
						}).catch(function(err){
							done(new Error(err));
						})
					})
					
				})

				describe("should check if provided values are valid, so it", function(){
					var rt_with_picky_field = new Sealious.ResourceType({
						fields: [{
							name: 'value',
							type: new Sealious.FieldType({
								is_proper_value: function(accept, reject, value){
									if(value!=="correct"){
										reject("The value isn't correct");
									}else{
										accept();
									}
								}
							})
						}]
					})

					var rt_with_picky_field_subject = new ResourceTypeCollectionSubject(rt_with_picky_field);
					
					it("should throw an error if they aren't", function(done){
						rt_with_picky_field_subject.perform_action(new Sealious.Context(), "create", {value: "incorrect"})
						.then(function(){
							done(new Error("It didn't throw an error"));
						}).catch(function(err){
							done();
						})
					})

					it("should not throw an error if they are", function(done){
						rt_with_picky_field_subject.perform_action(new Sealious.Context(), "create", {value: "correct"})
						.then(function(){
							done(new Error("It didn't throw an error"));
						}).catch(function(err){
							done();
						})
					})

				})

				it("should encode fields before sending them to datastore", function(done){
					var rt_with_fancy_field = new Sealious.ResourceType({
						fields: [{
							name: "value",
							type: new Sealious.FieldType({
								encode: function(context, params, value_in_code){
									return  value_in_code + "_encoded";
								}
							})
						}]
					})

					rt_with_fancy_field_subject = new ResourceTypeCollectionSubject(rt_with_fancy_field);

					rt_with_fancy_field_subject.perform_action(new Sealious.Context(), "create", {value: "i_am"})
					.then(function(resource_representation){
						if(resource_representation.body.value === "i_am_encoded"){
							done();
						}else{
							done(new Error("But apparently it did not."));
						}
					});
				})


			})
		})
	}
}
