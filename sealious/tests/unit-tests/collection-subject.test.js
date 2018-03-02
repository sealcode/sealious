"use strict";
var locreq = require("locreq")(__dirname);

var UUIDGenerator = require("shortid");
var equal = require("deep-equal");
var Promise = require("bluebird");

var assert_no_error = require("../util/assert-no-error.js");
var assert_error_type = require("../util/assert-error-type.js");

var CollectionSubject = locreq("lib/subject/subject-types/collection-subject.js");
var SingleResource = require("../../lib/subject/subject-types/single-resource-subject.js");

module.exports = {
	test_start: function(){
		describe("Subject type: resource-type-collection", function(){

			describe(".create_resource", function(){
				describe("should check access privilages, so it", function(){
					var rt_user1_only = new Sealious.Collection({
						name: "impossible_to_manipulate",
						fields: [],
						access_strategy: new Sealious.AccessStrategyType({
							checker_function: function(context){
								if (context.user_id == 1){
									return Promise.resolve();
								} else {
									return Promise.reject("You are not user1!!");
								}
							}
						})
					});

					var rt_user1_only_subject = new CollectionSubject(rt_user1_only);
					it("should not allow creating a resource when the access strategy forbids it", function(done){
						var result = rt_user1_only_subject.perform_action(new Sealious.Context(0, null, 2), "create", {});
						assert_error_type(result, "permission", done);
					});

					it("should allow creating a resource when the access strategy does not forbid it", function(done){
						var rt_user1_only_subject = new CollectionSubject(rt_user1_only);

						var result = rt_user1_only_subject.perform_action(new Sealious.Context(0, null, 1), "create", {});
						assert_no_error(result, done);
					});

				});

				describe("should check if provided values are valid, so it", function(){
					var rt_with_picky_field = new Sealious.Collection({
						fields: [{
							name: "value",
							type: new Sealious.FieldType({
								is_proper_value: function(accept, reject, context, params, value){
									if (value === "correct"){
										accept();
									} else {
										reject("The value isn't correct");
									}
								}
							})
						}]
					});

					var rt_with_picky_field_subject = new CollectionSubject(rt_with_picky_field);

					it("should throw an error if they aren't", function(done){
						var result = rt_with_picky_field_subject.perform_action(new Sealious.Context(), "create", {value: "incorrect"});
						assert_error_type(result, "validation", done);
					});

					it("should not throw an error if they are", function(done){
						var result = rt_with_picky_field_subject.perform_action(new Sealious.Context(), "create", {value: "correct"});
						assert_no_error(result, done);
					});

				});

				it("should store the resource body", function(done){
					var simple_rt_subject = new CollectionSubject(new Sealious.Collection({
						fields: [
							{name: "value1", type: "text"},
							{name: "value2", type: "int"}
						]
					}));

					var text = "text";
					var int = 3;

					simple_rt_subject.perform_action(new Sealious.Context(), "create", {value1: text, value2: int})
					.then(function(created_resource){
						if (created_resource.body.value1 == text && created_resource.body.value2 == int){
							done();
						} else {
							done(new Error("The saved values don't match"));
						}
					});
				});

				it("should encode fields before sending them to datastore", function(done){
					var rt_with_fancy_field = new Sealious.Collection({
						fields: [{
							name: "value",
							type: new Sealious.FieldType({
								encode: function(context, params, value_in_code){
									return value_in_code + "_encoded";
								}
							})
						}]
					});

					rt_with_fancy_field_subject = new CollectionSubject(rt_with_fancy_field);

					rt_with_fancy_field_subject.perform_action(new Sealious.Context(), "create", {value: "i_am"})
					.then(function(resource_representation){
						if (resource_representation.body.value === "i_am_encoded"){
							done();
						} else {
							done(new Error("But apparently it did not."));
						}
					});
				});

				it("should create metadata for every newly created resource", function(done){

					var context = new Sealious.Context();
					var collection_name = "should create metadata for every newly created resource";

					var simple_rt_subject = new CollectionSubject(new Sealious.Collection({name: collection_name}))
					.perform_action(context, "create", {})
					.then(function(created_resource){
						if (created_resource.id === undefined || created_resource.id === null){
							done(new Error("It didn't create the 'sealious_id' attribute"));
						} else if (created_resource.type_name !== collection_name){
							done(new Error("It didn't properly set the 'type' attribute in db document"));
						} else if (created_resource.created_context.timestamp !== context.timestamp){
							done(new Error("It didn't properly set the 'created_context' attribute"));
						} else if (created_resource.last_modified_context.timestamp !== created_resource.created_context.timestamp){
							done(new Error("It didn't set the last_modified_context to the same value as created_context."));
						} else {
							done();
						}
					});
				});


			});

			describe("._preprocess_resource_filter", function(){

				it("should turn all filter values into {$eq: ...} query statements", function(done){

					var rt = new Sealious.Collection({
						fields: [
							{name: "a", "type": "text"},
							{name: "b", "type": "text"},
							{name: "c", "type": "text"}
						]
					});

					var filter = {
						"a": "d",
						"b": "e",
						"c": "f"
					};

					var expected_result = {
						"a": {$eq: "d"},
						"b": {$eq: "e"},
						"c": {$eq: "f"}
					};

					var subject = new CollectionSubject(rt);
					subject._preprocess_resource_filter(new Sealious.Context(), filter)
					.then(function(result){
						if (equal(result, expected_result, {strict: true})){
							done();
						} else {
							done(new Error("But it returned something else!"));
						}
					});
				});

				it("should skip values that do not correspond to the field names of the resource type and properly encode the others", function(done){
					var rt = new Sealious.Collection({
						fields: [
							{name: "value", type: new Sealious.FieldType({
								encode: function(context, params, value){
									return value + "_encoded";
								}
							})}
						]
					});

					var filter = {
						"value": "foo",
						"non_existing": "bar"
					};

					var expected_result = {
						"value": {$eq: "foo_encoded"}
					};

					var subject = new CollectionSubject(rt);
					subject._preprocess_resource_filter(new Sealious.Context(), filter)
					.then(function(result){
						if (equal(result, expected_result, {strict: true})){
							done();
						} else {
							done(new Error("But it returned something else!"));
						}
					});
				});

			});

			describe(".list_resources", function(){
				it("should throw a proper error when trying to list instances of resource type with a shallow access_strategy that disallows the context", function(done){
					var rt = new Sealious.Collection({
						fields: [{name: "value", type: "text"}],
						access_strategy: new Sealious.AccessStrategyType({
							checker_function: function(context){
								if (context.user_id == 1){
									return Promise.reject("User 1 cannot access this resource");
								}
							}
						})
					});

					var subject = new CollectionSubject(rt);

					var context = new Sealious.Context(0, null, 1);

					var result = subject.perform_action(context, "show");
					assert_error_type(result, "permission", done);
				});

				it("should only show resources that are allowed by the resource-type's deep item-sensitive access strategy", function(done){

					var collection_name = UUIDGenerator(10);

					var rt = new Sealious.Collection({
						name: collection_name,
						fields: [{name: "who_can_access", type: "text"}],
						access_strategy: {
							create: "public",
							default: new Sealious.AccessStrategyType({
								name: "hydra",
								item_sensitive: true,
								checker_function: function(context, params, item){
									if (item.body.who_can_access.toString() === context.user_id.toString()){
										return Promise.resolve();
									} else {
										return Promise.reject(`Only user #${item.body.who_can_access} can access this item.`);
									}
								}
							})
						}
					});


					var subject = new CollectionSubject(rt);

					var accessible_amount = 4;
					var total_amount = 10;
					var promises = [];
					var p;

					for (var i = 1; i <= accessible_amount; i++){
						p = subject.perform_action(new Sealious.Context(), "create", {who_can_access: "1"});
						promises.push(p);
					}

					for (var i = accessible_amount + 1; i <= total_amount; i++){
						p = subject.perform_action(new Sealious.Context(), "create", {who_can_access: i});
						promises.push(p);
					}

					var context = new Sealious.Context(0, null, 1);

					Promise.all(promises).then(function(){
						subject.perform_action(context, "show")
						.then(function(accessible_resources){
							if (accessible_resources.length === accessible_amount){
								done();
							} else {
								done(new Error("It returned too many/didn't return enough resources"));
							}
						}).catch(done);
					}).catch(done);
				});

				it("should only return resources of a given resource-type", function(done){
					var collection_name1 = UUIDGenerator(10);

					var rt1 = new Sealious.Collection({
						name: collection_name1,
						fields: [{name: "value", type: "text"}]
					});

					var subject1 = new CollectionSubject(rt1);

					var collection_name2 = UUIDGenerator(10);

					var rt2 = new Sealious.Collection({
						name: collection_name2,
						fields: [{name: "value", type: "text"}]
					});

					var subject2 = new CollectionSubject(rt2);

					var accessible_amount = 4;
					var total_amount = 10;
					var promises = [];
					var p;

					for (var i = 1; i <= accessible_amount; i++){
						p = subject1.perform_action(new Sealious.Context(), "create", {value: i});
						promises.push(p);
					}

					for (var i = accessible_amount + 1; i <= total_amount; i++){
						p = subject2.perform_action(new Sealious.Context(), "create", {value: i});
						promises.push(p);
					}

					Promise.all(promises)
					.then(function(){
						subject1.perform_action(new Sealious.Context(), "show")
						.then(function(visible_resources){
							if (visible_resources.length === accessible_amount){
								done();
							} else {
								done(new Error("Mismatch between expected visible resource amount and the actual amount"));
							}
						});
					}).catch(done);

				});

				it("should throw an error when non-permission error is caught during filtering", function(done){
					var rt = new Sealious.Collection({
						name: UUIDGenerator(10),
						access_strategy: {
							default: "public",
							retrieve: new Sealious.AccessStrategyType({
								item_sensitive: true,
								checker_function: function(){
									throw new Error("Heil hydra");
								}
							})
						}
					});

					var subject = new CollectionSubject(rt);

					subject.perform_action(new Sealious.Context(), "create", {})
					.then(function(){
						subject.perform_action(new Sealious.Context(), "show")
						.then(function(){
							done(new Error("It didn't throw any error, though..."));
						}).catch(function(err){
							if (err.type !== "validation"){
								done();
							} else {
								done(new Error("But id did in fact return a validation error"));
							}
						});
					});

				});

				it("should filter the results according to the 'filter' parameter", function(done){
					var rt = new Sealious.Collection({
						name: UUIDGenerator(10),
						fields: [{name: "value", type: "text"}]
					});

					var accessible_amount = Math.ceil(Math.random() * 5);
					var total_amount = accessible_amount + Math.ceil(Math.random() * 5);

					var promises = [];
					var p;

					var subject = new CollectionSubject(rt);

					for (var i = 1; i <= accessible_amount; i++){
						p = subject.perform_action(new Sealious.Context(), "create", {value: "1"});
						promises.push(p);
					}

					for (var i = accessible_amount + 1; i <= total_amount; i++){
						p = subject.perform_action(new Sealious.Context(), "create", {value: "2"});
						promises.push(p);
					}

					Promise.all(promises)
					.then(function(){
						return subject.perform_action(new Sealious.Context(), "show", {filter: {value: "1"}});
					}).then(function(filtered_resources){
						if (filtered_resources.length === accessible_amount){
							done();
						} else {
							done(new Error("But it seems it did not."));
						}
					});


				});
			});

			describe(".perform_action", function(){
				it("should throw an error when asked for non-existing action", function(done){
					var rt = new Sealious.Collection({
						name: UUIDGenerator(10)
					});

					var subject = new CollectionSubject(rt);

					try {
						subject.perform_action(new Sealious.Context(), "i_dont_exist");
						done(new Error("But it didn't throw any error at all"));
					} catch (err){
						if (err.type === "dev_error"){
							done();
						} else {
							done(new Error("But it threw a different type of error"));
						}
					}
				});
			});

			describe(".get_child_subject", function(){
				it("should return a SingleResource subject tied to a specific resource type and id", function(done){
					var rt = new Sealious.Collection({});

					var subject = new CollectionSubject(rt);

					var resource_id = "resource_id";

					subject.get_child_subject(resource_id)
					.then(function(child_subject){
						if (!(child_subject instanceof SingleResource)){
							done(new Error("the child context was of wrong type"));
						} else if (child_subject.collection !== rt){
							done(new Error("the child context was tied to a different resource type"));
						} else if (child_subject.resource_id !== resource_id){
							done(new Error("the child context was tied to a different resource_id"));
						} else {
							done();
						}
					});

				});
			});
		});

	}
};
