var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;
var assert = require("assert");
var deepEqual = require("deep-equal");

module.exports = {
    test_init: function() {
        // Creating resource always fails

        var listable = new Sealious.ChipTypes.ResourceType({
            name: "listable"
        })

        var always_fails = new Sealious.ChipTypes.FieldType({
            name: "always_fails",
            is_proper_value: function(accept, reject, context, value_in_code) {
                reject();
            }
        })

        var one_field_always_fails = new Sealious.ChipTypes.ResourceType({
            name: "one_field_always_fails",
            fields: [{
                name: "#fail",
                type: "always_fails"
            }]
        });


        //Creating resource never fails
        var never_fails = new Sealious.ChipTypes.FieldType({
            name: "never_fails",
            is_proper_value: function(accept, reject, context, value_in_code) {
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
            is_proper_value: function(accept, reject, context, params, new_value, old_value) {
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
            is_proper_value: function(accept, reject, context, params, new_value, old_value) {
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
            is_proper_value: function(accept, reject, context, params, new_value, old_value) {
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
        });

        var nobody_can_create_me_resource = new Sealious.ChipTypes.ResourceType({
            name: "nobody_can_create_me",
            access_strategy: "noone"
        });

        var nobody_can_update_me_resource = new Sealious.ChipTypes.ResourceType({
            name: "nobody_can_update_me",
            fields: [{
                name: "value",
                type: "text"
            }],
            access_strategy: {
                update: "noone"
            }
        });

        var nobody_can_delete_me_resource = new Sealious.ChipTypes.ResourceType({
            name: "nobody_can_delete_me",
            fields: [{
                name: "value",
                type: "text"
            }],
            access_strategy: {
                delete: "noone"
            }
        });
        var nobody_can_list_me_resource = new Sealious.ChipTypes.ResourceType({
            name: "nobody_can_list_me",
            fields: [{
                name: "value",
                type: "text"
            }],
            access_strategy: {
                retrieve: "noone"
            }
        });
        var item_sensitive_access_strategy = new Sealious.ChipTypes.AccessStrategy({
            name: "item_sensitive",
            checker_function: function(context, item) {
                if (item !== undefined) {
                    return Promise.resolve();
                } else {
                    return Promise.reject(new Sealious.Errors.BadContext("No item provided"));
                }
            },
            item_sensitive: true
        })

        var item_sensitive_access_strategy_second = new Sealious.ChipTypes.AccessStrategy({
            name: "item_sensitive_second",
            checker_function: function(context, item) {
                return Promise.reject(new Sealious.Errors.BadContext("No item provided"));
                
            },
            item_sensitive: true
        })

        var item_sensitive_resource = new Sealious.ChipTypes.ResourceType({
            name: "item_sensitive",
            fields: [{
                name: "value",
                type: "text"
            }],
            access_strategy: "item_sensitive"

        })

        var item_sensitive_resource_second = new Sealious.ChipTypes.ResourceType({
            name: "item_sensitive_second",
            fields: [{
                name: "value",
                type: "text"
            }],
            access_strategy: "item_sensitive_second"

        })

        var has_required_field = new Sealious.ChipTypes.ResourceType({
            name: "has_required_field",
            fields: [
                {name: "required", type: "int", required: true}
            ]
        })

    },

    test_start: function() {

        describe("ResourceManager", function() {
            var context = new Sealious.Context();

            it('should store creation and modification context', function(done) {
                var creation_context = new Sealious.Context();

                ResourceManager.create(creation_context, "never_fails_resource", { "#success": "yes" })
                .then(function(created_resource) {
                    assert.deepEqual(created_resource.created_context, creation_context.toObject(), "Context info stored in resource's `created_context` attribute should reflect the actual context of creating this resource");
                    return Promise.resolve(created_resource.id);
                })
                .then(function(created_resource_id) {
                    var modification_context = new Sealious.Context();
                   return ResourceManager.patch_resource(modification_context, "never_fails_resource", created_resource_id, { "#success": "yiss" })
                        .then(function(patched_resource) {
                            assert.deepEqual(patched_resource.last_modified_context, modification_context.toObject(), "Context info stored in resource's `last_modified` attribute should reflect the actual context of last modification to this resource after performing `patch` on it.")
                            return Promise.resolve(created_resource_id);
                        });
                })
                .then(function(created_resource_id) {
                    var update_context = new Sealious.Context();
                    ResourceManager.update_resource(update_context, "never_fails_resource", created_resource_id, { "#success": "yiss plis" })
                        .then(function(patched_resource) {
                            assert.deepEqual(patched_resource.last_modified_context, update_context.toObject(), "Context info stored in resource's `last_modified` attribute should reflect the actual context of last modification to this resource after performing `update` on it.")
                        });
                    done();
                })
            });

            describe(".create", function() {
                it("should create resource", function(done) {
                    var context = new Sealious.Context();
                    ResourceManager.create(context, "never_fails_resource", {
                            "#success": "specific_value"
                        })
                        .then(function(created_resource) {
                            return ResourceManager.get_by_id(new Sealious.Context(), created_resource.id)
                        })
                        .then(function(gotten_resource) {
                            if (gotten_resource.body["#success"] == "specific_value" && deepEqual(context.toObject(), gotten_resource.created_context)) {
                                done();
                            } else {
                                done(new Error("Created resource differs from what was intended to create."))
                            }
                        }).catch(function(error) {
                            done(error)
                        })
                })
                it("should resolve with created resource", function(done) {
                    var context = new Sealious.Context();
                    ResourceManager.create(context, "never_fails_resource", {
                            "#success": "specific_value"
                        })
                        .then(function(created_resource) {
                            if (created_resource.body["#success"] == "specific_value" && deepEqual(context.toObject(), created_resource.created_context)) {
                                done();
                            } else {
                                done(new Error(".create resolves with something else than created resource."))
                            }
                        }).catch(function(error) {
                            done(error)
                        })
                })
                it("should throw proper error, if given resouce-type name is non-existent", function(done) {
                    ResourceManager.create(new Sealious.Context(), "non_existent_resource_type", {})
                        .then(function() {
                            done(new Error("But it succedded instad of failing"));
                        }).catch(function(error) {
                            if (error.data.short_message = "chip_not_found") {
                                done();
                            } else {
                                done(new Error("But threw an error that is not an instance of ValidationError"));
                            }
                        })
                })
                it("should provide resource_type.validate_field_values method with the previous field values, if it is needed", function(done) {
                    ResourceManager.create(new Sealious.Context(), "old_value_sensitive", {
                            value: "any"
                        })
                        .then(function(created_resource) {
                            done();
                        }).catch(function() {
                            done(new Error("But it didn't"));
                        })
                });
                it("should NOT provide resource_type.validate_field_values method with the previous field value if it's not needed", function(done) {
                    ResourceManager.create(new Sealious.Context(), "old_value_insensitive", {
                            value: "any"
                        })
                        .then(function() {
                            done();
                        }).catch(function() {
                            done(new Error("But it didn't"));
                        })
                });
                it("doesn't create resource, when access_strategy doesn't allow it", function(done) {
                    ResourceManager.create(new Sealious.Context(), "nobody_can_create_me", {})
                        .then(function() {
                            done(new Error("It succedded instead of failing"))
                        }).catch(function(error) {
                            if (error.type == "permission") {
                                done()
                            } else {
                                done(new Error("It didn't throw proper error."))
                            }
                        })
                })
                it("should provide access_strategy.check with null if the access_strategy is item_sensitive", function(done) {
                    ResourceManager.create(new Sealious.Context(), "item_sensitive", { value: "any" })
                        .then(function(created_resource) {
                            done();
                        }).catch(function(error) {
                            if (error.type == "permission") {
                                done(new Error("But it didn't"));
                            } else {
                                done(error);
                            }
                        })
                });

                it('should not create a new resource', function(done) {
                    ResourceManager.create(new Sealious.Context(), "one_field_always_fails", { "#fail": "tak" })
                    .then(function() {
                        done(new Error("It didn't throw an error!"));
                    }).catch(function(error) {
                        if (error.type == "validation"){
                            done();
                        } else {
                            done(new Error("It did throw an error, but not THE error"));
                        }
                    });
                });
            });

            describe(".delete", function() {
                it("should throw proper error, if given resouce-type name is non-existent", function(done) {
                    ResourceManager.delete(new Sealious.Context(), "non_existent_resource_type", "id", {})
                        .then(function() {
                            done(new Error("But it succedded instad of failing"));
                        }).catch(function(error) {
                            if (error.type == "validation") {
                                done();
                            } else {
                                done(new Error("But threw an error that is not an instance of ValidationError"));
                            }
                        });
                });
                it('should delete the resource', function(done) {
                    var created_resource_id;
                    ResourceManager.create(context, "never_fails_resource", {
                            "#success": "tak"
                        })
                        .then(function(created_resource) {
                            created_resource_id = created_resource.id;
                            return ResourceManager.delete(context, "never_fails_resource", created_resource_id);
                        })
                        .then(function() {
                            return ResourceManager.get_by_id(new Sealious.Context, created_resource_id);
                        })
                        .then(function(result) {
                            done(new Error("But it didn't"));
                        })
                        .catch(function(error) {
                            if (error.type == "not_found") {
                                done();
                            } else {
                                done(error);
                            }
                        })
                });
            });

            describe(".get_by_id", function() {
                it("should find resource of given id", function(done) {
                    ResourceManager.create(new Sealious.Context(), "never_fails_resource", {
                            "#success": "specific_value"
                        })
                        .then(function(created_resource) {
                            return ResourceManager.get_by_id(new Sealious.Context(), created_resource.id)
                        })
                        .then(function(gotten_resource) {
                            if (gotten_resource.body["#success"] == "specific_value") {
                                done();
                            } else {
                                done(new Error("It didn't get proper resource."))
                            }
                        }).catch(function(error) {
                            done(error)
                        })
                })
                it("should return proper error, if provided id is incorrect", function(done) {
                    ResourceManager.get_by_id(new Sealious.Context(), "incorrect_resource_id*!@#R%^&*()")
                        .then(function() {
                            done(new Error("But it succeded instead of failing"))
                        }).catch(function(error) {
                            if (error.type = "not_found") {
                                done();
                            } else {
                                done(new Error("But threw an error that is not an instance of NotFoundError"));
                            }
                        })
                });
                it("doesn't get resource, when access_strategy doesn't allow it", function(done) {
                    ResourceManager.create(new Sealious.Context(), "nobody_can_list_me", {})
                        .then(function(created_resource) {
                            return ResourceManager.get_by_id(new Sealious.Context(), created_resource.id)
                        })
                        .then(function() {
                            done(new Error("It succedded instead of failing"))
                        }).catch(function(error) {
                            if (error.type == "permission") {
                                done()
                            } else {
                                done(new Error("It didn't throw proper error."))
                            }
                        })
                })
            });

            describe(".list_by_type", function() {
                it("uses a resource with item_sensitive access strategy", function(done) {
                    ResourceManager.list_by_type(new Sealious.Context(),"item_sensitive")
                        .then(function(){
                            done();
                        })
                        .catch(function(error) {
                            done(error);
                        });
                });
                it("uses a resource with item_sensitive access strategy and should throw an error", function(done) {
                    ResourceManager.create(new Sealious.Context(), "item_sensitive_second", { value: "any" })
                        .then(function(created_resource) {
                        }).catch(function(error) {
                            
                        })


                    ResourceManager.list_by_type(new Sealious.Context(),"item_sensitive_second")
                        .then(function(ok){
                            done();
                        })
                        .catch(function(error) {
                            done(error);
                        });
                });

                it("throws proper error, if given resouce-type name is non-existent", function(done) {
                    ResourceManager.list_by_type(new Sealious.Context(), "non_existent_resource_type")
                        .then(function() {
                            done(new Error("It succedded instead of failing"));
                        })
                        .catch(function(error) {
                            if (error.type = "validation") {
                                done();
                            } else {
                                done(new Error("It threw an error that is not an instance of ValidationError"));
                            }
                        });
                })
                it("lists resources of given type", function(done) {
                    var promises = [];
                    var resource_ids;
                    for (var i = 1; i <= 3; i++) {
                        var promise = ResourceManager.create(new Sealious.Context(), "listable", {});
                        promises.push(promise);
                    }
                    Promise.all(promises)
                        .then(function(created_resources) {
                            resource_ids = created_resources.map(function(resource) {
                                return resource.id;
                            })
                            return ResourceManager.list_by_type(new Sealious.Context(), "listable")
                        })
                        .then(function(listed_resources) {
                            var listed_resources_ids = listed_resources.map(function(resource) {
                                return resource.id;
                            })
                            listed_resources_ids.sort();
                            resource_ids.sort();
                            if (deepEqual(listed_resources_ids, resource_ids)) {
                                done()
                            } else if (listed_resources_ids.length != resource_ids.length) {
                                done(new Error("It listed wrong amount of resources"))
                            } else {
                                done(new Error("It didn't return proper resources"))
                            }
                        })

                })
            });

            describe(".find", function() {
                it('should find all resources', function(done){
                    ResourceManager.find(context)
                    .then(function(found_resource){
                        if (found_resource[0] !== undefined){
                            done();
                        } else {
                            done(new Error ("It didn't find any resources"));
                        }
                    })
                    .catch(function(error){
                        done(error);
                    })
                });
                it('should create a new resource and find it', function(done){
                    ResourceManager.create(context, "never_fails_resource", { "#success": "absolutely" })
                    .then(function(created_resource){
                        ResourceManager.find(context, {"#success": created_resource.body["#success"]}, "never_fails_resource")
                        .then(function(found_resource){
                            if (found_resource[0]["#success"] == "absolutely"){
                                done();
                            } else if (found_resource[1] !== undefined) {
                                done(new Error("Found more resources than should have"))
                            } else {
                                done(new Error("It didn't find the resource"));
                            }
                        })
                        .catch(function(error){
                            done(error);
                        })
                    })
                });
                it('should create a new resource and find it with without specifing the type', function(done){
                    ResourceManager.create(context, "never_fails_resource", { "#success": "absolutely" })
                    .then(function(created_resource){
                        ResourceManager.find(context, {"#success": created_resource.body["#success"]})
                        .then(function(found_resource){
                            if (found_resource[0]["#success"] == "absolutely"){
                                done();
                            } else if (found_resource[1] !== undefined) {
                                done(new Error("Found more resourced than should have"))
                            } else {
                                done(new Error("It didn't find the resource"));
                            }
                        })
                        .catch(function(error){
                            done(error);
                        })
                    })
                });
                it('should not find a resource', function(done){
                    ResourceManager.find(context, {"#troll_field": "troll_value"}, "troll_resource_type")
                    .then(function(found_resource){
                        if (found_resource[0] === undefined){
                            done();
                        } else {
                            done(new Error("It found a resource"));
                        }
                    })
                    .catch(function(error){
                        done(error);
                    })
                });
                it('should create a new resource it, find it, then delete it and not find it', function(done){
                    ResourceManager.create(context, "never_fails_resource", { "#success": "yep" })
                    .then(function(created_resource){
                        ResourceManager.find(context, {"#success": created_resource.body["#success"]}, "never_fails_resource")
                        .then(function(found_resource){
                            if (found_resource[0]["#success"] == "yep"){
                                ResourceManager.delete(context, "never_fails_resource", found_resource[0]["id"])
                                .then(function(success){
                                    ResourceManager.find(context, {"#success": "yep"}, "never_fails_resource")
                                    .then(function(found_resource){
                                        if (found_resource[0] === undefined){
                                            done();
                                        } else {
                                            done(new Error("It found the resource which should be deleted"));
                                        }
                                    })
                                    .catch(function(error){
                                        done(error);
                                    })
                                })
                                .catch(function(error){book.com/
                                    done(error);
                                })
                            } else {
                                done(new Error("It didn't find the resource after creating it"))
                            }
                        })
                        .catch(function(error){
                            done(error);
                        })
                    })
                });
            });

            describe(".patch_resource", function() {
                it("should throw proper error, if given resource-type name is non-existent", function(done) {
                    ResourceManager.patch_resource(new Sealious.Context(), "non_existent_resource_type", "id", {})
                        .then(function() {
                            done(new Error("But it succedded instead of failing"));
                        }).catch(function(error) {
                            if (error.type = "validation") {
                                done();
                            } else {
                                done(new Error("But threw an error that is not an instance of ValidationError"));
                            }
                        })
                })
                it("should provide resource_type.validate_field_values method with the previous field value if it is needed", function(done) {
                    ResourceManager.create(new Sealious.Context(), "old_value_sensitive", { value: "any" })
                        .then(function(created_resource) {
                            return ResourceManager.patch_resource(new Sealious.Context(), "old_value_sensitive", created_resource.id, { value: "any2" })
                        }).then(function() {
                            done();
                        }).catch(function() {
                            done(new Error("But it didn't."));
                        })
                });
                describe("should provide real old value, if old_value is needed", function() {
                    it("always_the_same_resource can be patched with the same value it was created", function(done) {
                        ResourceManager.create(new Sealious.Context(), "always_the_same", {
                                value: 33
                            })
                            .then(function(created_resource) {
                                return ResourceManager.patch_resource(new Sealious.Context(), "always_the_same", created_resource.id, {
                                    value: 33
                                })
                            }).then(function() {
                                done();
                            }).catch(function() {
                                done(new Error("But it didn't."));
                            })
                    });
                    it("always_the_same_resource can't be patched with other value than the one it was created with", function(done) {
                        ResourceManager.create(new Sealious.Context(), "always_the_same", { value: 33 })
                            .then(function(created_resource) {
                                return ResourceManager.patch_resource(new Sealious.Context(), "always_the_same", created_resource.id, { value: 42 })
                            }).then(function() {
                                done(new Error("But it was."));
                            }).catch(function() {
                                done();
                            })
                    });
                })
                it("should NOT provide resource_type.validate_field_values method with the previous field value if it's not needed", function(done) {
                    ResourceManager.create(new Sealious.Context(), "has_required_field", {required: 1})
                    .then(function(created_resource){
                        return ResourceManager.patch_resource(new Sealious.Context(), "has_required_field", created_resource.id, {})
                    }).then(function(){
                        done();
                    }).catch(function(error){
                        done(error)
                    })
                });
            });

            describe(".update_resource", function() {
                it('should update the resource', function(done) {
                    ResourceManager.create(context, "never_fails_resource", {
                        "#success": "tak"
                    })
                    .then(function(result) {
                        ResourceManager.update_resource(context, "never_fails_resource", result.id, {
                                "#success": "tak2"
                            })
                            .then(function(updated_resource) {
                                return ResourceManager.get_by_id(context, updated_resource.id);
                            })
                            .then(function(gotten_resource) {
                                if (gotten_resource.body["#success"] == "tak2" && deepEqual(context.toObject(), gotten_resource.created_context)) {
                                    done();
                                } else {
                                    done(new Error("Updated resource differs from what was intended to update."))
                                }
                            })
                            .catch(function(error) {
                                done(new Error(error));
                            })
                    }).catch(function(error) {
                        done(error);
                    });
                });
                it("should throw proper error, if given resouce-type name is non-existent", function(done) {
                    ResourceManager.update_resource(new Sealious.Context(), "non_existent_resource_type", "id", {})
                        .then(function() {
                            done(new Error("But it succedded instead of failing"));
                        }).catch(function(error) {
                            if (error.type == "validation") {
                                done();
                            } else {
                                done(new Error("But threw an error that is not an instance of ValidationError"));
                            }
                        })
                })
                it("should remove a value if it's not provided", function(done) {
                    ResourceManager.create(new Sealious.Context(), "multifield", {
                        value1: "1",
                        value2: "2"
                    }).then(function(created_resource) {
                        return ResourceManager.update_resource(new Sealious.Context(), "multifield", created_resource.id, {
                            value1: "3"
                        })
                    }).then(function(updated_resource) {
                        if (updated_resource.body.value2 === null) {
                            done();
                        } else {
                            done(new Error("But it didn't"));
                        }
                    })
                });
                it("should not result in calling 'is_proper_value' for fields with no value (issue #235)", function(done){
                    ResourceManager.create(new Sealious.Context(), "one_field_always_fails", {})
                    .then(function(created_resource){
                        return ResourceManager.update_resource(new Sealious.Context(), "one_field_always_fails", created_resource.id, {})
                    }).then(function(){
                        //if the field's 'is_proper_value' method wasn't called, it shouldn't throw an error
                        done();
                    }).catch(function(error){
                        done(error);
                    })
                })
            });


            
        })

        //should test if ResourceManager properly asks AccessStrategy.

    }
}