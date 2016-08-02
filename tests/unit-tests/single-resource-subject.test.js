"use strict";
var Promise = require("bluebird");
var UUIDGenerator = require("uid");

var assert_error_type = require("../util/assert-error-type.js");
var assert_no_error = require("../util/assert-no-error.js");

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
				});


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
						});
					});
				});

				it("should throw a 'not_found' error if the provided resource id does not exist", function(done){
					var subject = new SingleResourceSubject(rt, "made-up-id");
					var promise = subject.perform_action(new Sealious.Context(), "show");
					assert_error_type(promise, "not_found", done);
				});

				it("should throw an error when asked to show a resource when access strategy rejects the context", function(done){
					var rt = new Sealious.ResourceType({
						name: UUIDGenerator(10),
						fields: [{name: "value", type: "text"}],
						access_strategy: new Sealious.AccessStrategyType({
							checker_function: function(context){
								if (context.user_id === 1){
									return Promise.resolve();
								} else {
									return Promise.reject("Only user #1 can perform any operations on this resource");
								}
							}
						})
					});

					var create_action = new Sealious.Action(["resources", rt.name], "create");
					create_action.run(new Sealious.Context(0, null, 1), {value: UUIDGenerator(10)})
					.then(function(created_resource){
						var subject = new SingleResourceSubject(rt, created_resource.id);
						var promise = subject.perform_action(new Sealious.Context(0, null, 2), "show");
						assert_error_type(promise, "permission", done);
					});
				});

				it("should throw an error when an item-sensitive access strategy rejects the 'show' method", function(done){
					var rt = new Sealious.ResourceType({
						name: UUIDGenerator(10),
						fields: [{name: "value", type: "text"}],
						access_strategy: {
							create: "public",
							retrieve: new Sealious.AccessStrategyType({
								checker_function: function(context, params, item){
									if (item.body.value === "allow"){
										return Promise.resolve();
									} else {
										return Promise.reject("You cannot see this item.");
									}
								}
							})
						}
					});

					var create_action = new Sealious.Action(["resources", rt.name], "create");
					create_action.run(new Sealious.Context(), {value: "disallow"})
					.then(function(created_resource){
						var subject = new SingleResourceSubject(rt, created_resource.id);
						var promise = subject.perform_action(new Sealious.Context(), "show");
						assert_error_type(promise, "permission", done);
					});
				});

				it("should not throw an error when an item-sensitive access strategy allows the 'show' method", function(done){
					var rt = new Sealious.ResourceType({
						name: UUIDGenerator(10),
						fields: [{name: "value", type: "text"}],
						access_strategy: {
							create: "public",
							show: new Sealious.AccessStrategyType({
								checker_function: function(context, params, item){
									if (item.body.value === "allow"){
										return Promise.resolve();
									} else {
										return Promise.reject("You cannot see this item.");
									}
								}
							})
						}
					});

					var create_action = new Sealious.Action(["resources", rt.name], "create");
					create_action.run(new Sealious.Context(), {value: "allow"})
					.then(function(created_resource){
						var subject = new SingleResourceSubject(rt, created_resource.id);
						var result = subject.perform_action(new Sealious.Context(), "show");
						assert_no_error(result, done);
					});
				});
			});
		});
	}
};
