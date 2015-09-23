var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;
var assert = require("assert");

module.exports = {
	test_init: function(){
		// Creating resource always fails

		var always_fails = new Sealious.ChipTypes.FieldType({
			name: "always_fails",
			is_proper_value: function(accept, reject, context, value_in_code){
				reject();
			}
		})

		var always_fails_resource = new Sealious.ChipTypes.ResourceType({
			name: "always_fails_resource",
			fields: [{
				name: "#fail",
				type: "always_fails"
			}]
		});


		//Creating resource never fails
		var never_fails = new Sealious.ChipTypes.FieldType({
			name: "never_fails",
			is_proper_value: function(accept, reject, context, value_in_code){
				accept();
			}
		})

		var never_fails_resource = new Sealious.ChipTypes.ResourceType({
			name: "never_fails_resource",
			fields: [{
				name: "#success",
				type: "never_fails"
			}, ]
		});

		var requires_old_value = new Sealious.ChipTypes.FieldType({
			name: "requires_old_value",
			is_proper_value: function(accept, reject, context, params, new_value, old_value){
				if (old_value === undefined) {
					reject("No old value provided!");
				} else {
					accept();
				}
			},
			old_value_sensitive_methods: {
				is_proper_value: true
			}
		})

		var rejects_with_old_value = new Sealious.ChipTypes.FieldType({
			name: "rejects_with_old_value",
			is_proper_value: function(accept, reject, context, params, new_value, old_value){
				if (old_value === undefined) {
					accept();
				} else {
					reject("Old value provided");
				}
			},
			old_value_sensitive_methods: {
				is_proper_value: false
			}
		})

		var always_the_same = new Sealious.ChipTypes.FieldType({
			name: "always_the_same",
			is_proper_value: function(accept, reject, context, params, new_value, old_value){
				if (old_value === null) {
					accept();
				} else if (new_value == old_value) {
					accept();
				} else {
					reject();
				}
			},
			old_value_sensitive_methods: {
				is_proper_value: true
			}
		})

		var old_value_sensitive_resource = new Sealious.ChipTypes.ResourceType({
			name: "old_value_sensitive",
			fields: [{
				name: "value",
				type: "requires_old_value"
			}, ]
		})

		var old_value_insensitive_resource = new Sealious.ChipTypes.ResourceType({
			name: "old_value_insensitive",
			fields: [{
				name: "value",
				type: "rejects_with_old_value"
			}, ]
		})

		var always_the_same_resource = new Sealious.ChipTypes.ResourceType({
			name: "always_the_same",
			fields: [{
				name: "value",
				type: "always_the_same"
			}, ]
		})

		var multifield_resource = new Sealious.ChipTypes.ResourceType({
			name: "multifield",
			fields: [{
				name: "value1",
				type: "text"
			}, {
				name: "value2",
				type: "text"
			}]
		})
	},

	test_start: function(){

		describe("ResourceManager", function(){
			var context = Sealious.Context();

			describe(".create", function(){
				it("should provide resource_type.validate_field_values method with the previous field values, if it is needed", function(done){
					ResourceManager.create(new Sealious.Context(), "old_value_sensitive", {
							value: "any"
						})
						.then(function(created_resource){
							done();
						}).catch(function(){
							done(new Error("But it didn't"));
						})
				});
				it("should NOT provide resource_type.validate_field_values method with the previous field value if it's not needed", function(done){
					ResourceManager.create(new Sealious.Context(), "old_value_insensitive", {
							value: "any"
						})
						.then(function(){
							done();
						}).catch(function(){
							done(new Error("But it didn't"));
						})
				});
			});

			describe(".update", function(){
				it("should remove a value if it's not provided", function(done){
					ResourceManager.create(new Sealious.Context(), "multifield", {
						value1: "1",
						value2: "2"
					}).then(function(created_resource){
						return ResourceManager.update_resource(new Sealious.Context(), "multifield", created_resource.id, {
							value1: "3"
						})
					}).then(function(updated_resource){
						if (updated_resource.body.value2 === null) {
							done();
						} else {
							done(new Error("But it didn't"));
						}
					})
				});
			});

			describe(".patch", function(){
				it("should provide resource_type.validate_field_values method with the previous field value if it is needed", function(done){
					ResourceManager.create(new Sealious.Context(), "old_value_sensitive", {
							value: "any"
						})
						.then(function(created_resource){
							return ResourceManager.patch_resource(new Sealious.Context(), "old_value_sensitive", created_resource.id, {
								value: "any2"
							})
						}).then(function(){
							done();
						}).catch(function(){
							done(new Error("But it didn't."));
						})
				});
				describe("should provide real old value, if old_value is needed", function(){
					it("always_the_same_resource can be patched with the same value it was created", function(done){
						ResourceManager.create(new Sealious.Context(), "always_the_same", {
								value: 33
							})
							.then(function(created_resource){
								return ResourceManager.patch_resource(new Sealious.Context(), "always_the_same", created_resource.id, {
									value: 33
								})
							}).then(function(){
								done();
							}).catch(function(){
								done(new Error("But it didn't."));
							})
					});
					it("always_the_same_resource can't be patched with other value than the one it was created with", function(done){
						ResourceManager.create(new Sealious.Context(), "always_the_same", {
								value: 33
						})
						.then(function(created_resource){
							return ResourceManager.patch_resource(new Sealious.Context(), "always_the_same", created_resource.id, {
								value: 42
							})
						}).then(function(){
							done(new Error("But it was."));
						}).catch(function(){
							done();
						})
					});
				})
				it("should NOT provide resource_type.validate_field_values method with the previous field value if it's not needed", function(done){
					ResourceManager.create(new Sealious.Context(), "old_value_insensitive", {
							value: "any"
						})
						.then(function(created_resource){
							return ResourceManager.patch_resource(new Sealious.Context(), "old_value_insensitive", created_resource.id, {
									value: "any2"
							})
							.then(function(){
								done();
							}).catch(function(){
								done(new Error("But it didn't"));
							})
						})
				});
			});

			it('should not create a new resource', function(done){
				ResourceManager.create(context, "always_fails_resource", {
						"#fail": "tak"
					})
					.then(function(){
						done(new Error("It didn't throw an error!"));
					}).catch(function(error){
						done();
					});
			});
			it('should create a new resource', function(done){
				ResourceManager.create(context, "never_fails_resource", {
						"#success": "tak"
					})
					.then(function(result){
						done();
					}).catch(function(error){
						done(error);
					});
			});
			it('should get data about the resource', function(done){
				ResourceManager.create(context, "never_fails_resource", {
						"#success": "tak"
					})
					.then(function(result){
						return ResourceManager.get_by_id(context, result.id)
							.then(function(resource){
								done();
							})
					}).catch(function(error){
						done(error);
					});
			});
			it('should delete the resource', function(done){
				ResourceManager.create(context, "never_fails_resource", {
						"#success": "tak"
					})
					.then(function(result){
						ResourceManager.delete(context, "never_fails_resource", result.id)
							.then(function(resource){
								done();
							}).catch(function(error){
								done(new Error(error));
							})
					}).catch(function(error){
						done(new Error("It threw an error!"));
					});
			});

			it('should update the resource', function(done){
				ResourceManager.create(context, "never_fails_resource", {
						"#success": "tak"
					})
					.then(function(result){
						ResourceManager.update_resource(context, "never_fails_resource", result.id, {
								"#success": "tak2"
							})
							.then(function(resource){
								done();
							}).catch(function(error){
								done(new Error(error));
							})
					}).catch(function(error){
						done(error);
					});
			});
			it('should list resources by type', function(done){
				ResourceManager.list_by_type(context, "never_fails_resource")
					.then(function(result){
						done();
					}).catch(function(error){
						done(new Error("It threw an error!"));
					});
			});
			it('should get resource type signature (schema)', function(done){
				ResourceManager.get_resource_type_signature(context, "never_fails_resource")
					.then(function(result){
						done();
					}).catch(function(error){
						done(new Error("It threw an error!"));
					});
			});



			it('should store creation and modification context', function(done){
				var creation_context = new Sealious.Context();

				ResourceManager.create(creation_context, "never_fails_resource", {
						"#success": "yes"
					})
					.then(function(created_resource){
						assert.deepEqual(created_resource.created_context, creation_context.toObject(), "Context info stored in resource's `created_context` attribute should reflect the actual context of creating this resource");
						return Promise.resolve(created_resource.id);
					}).then(function(created_resource_id){
						var modification_context = new Sealious.Context();
						return ResourceManager.patch_resource(modification_context, "never_fails_resource", created_resource_id, {
								"#success": "yiss"
							})
							.then(function(patched_resource){
								assert.deepEqual(patched_resource.last_modified_context, modification_context.toObject(), "Context info stored in resource's `last_modified` attribute should reflect the actual context of last modification to this resource after performing `patch` on it.")
								return Promise.resolve(created_resource_id);
							});
					}).then(function(created_resource_id){
						var update_context = new Sealious.Context();
						ResourceManager.update_resource(update_context, "never_fails_resource", created_resource_id, {
								"#success": "yiss plis"
							})
							.then(function(patched_resource){
								assert.deepEqual(patched_resource.last_modified_context, update_context.toObject(), "Context info stored in resource's `last_modified` attribute should reflect the actual context of last modification to this resource after performing `update` on it.")
							});
						done();
					})
			});

			run(); //!!important	
		})

	}
}