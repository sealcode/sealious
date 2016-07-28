const assert = require("assert");
const Chip = require("./chip.js");
const Promise = require("bluebird");

const ChipManager = require.main.require("lib/chip-types/chip-manager.js");
const Errors = require.main.require("lib/response/error.js");

/*
	Represents datastore.
	@constructor
	@param {string} name - name of datastore
*/
const Datastore = function(name){
	this.name = name;
	this.longid = `datastore.${name}`;
	this.default_configuration = {};
	ChipManager.add_chip("datastore", this.name, this);
};

Datastore.prototype = new Chip();

/**
 * Defines functions datastore need to implement,
 * then ensures that if one of these function will not be implemented Selious will throw an informative error.
 */
const needs_to_implement = ["find", "insert", "update", "remove"];

Datastore.prototype.return_not_implemented = function(fn_name){
	return function(){
		throw new Errors.DeveloperError("Function ", fn_name, "not implemented in ", this.longid, ", aborting.");
	};
};

for (const i in needs_to_implement){
	const fn_name = needs_to_implement[i];
	Datastore.prototype[fn_name] = Datastore.prototype.return_not_implemented(fn_name);
}

/*
Tests datastore compatibility with Sealious. It is a cascade of Promises, which result will be logged in console.
*/
Datastore.prototype.test_compatibility = function(){
	const self = this;
	this.start();
	const rand = Math.random();

	const test_collection_name = "_test";

	return Promise.resolve()
		.then(function(){
			// .insert method should respond with the created document
			const to_insert = {
				value: 1,
				random: rand
			};
			return self.insert(test_collection_name, to_insert)
				.then(function(response){
					assert.deepEqual(to_insert, response, ".insert method should respond with the created document");
					return Promise.resolve();
				});

		}).then(function(){
			// check if find resolves with an array

			return self.find(test_collection_name, {}, {})
				.then(function(documents){
					assert(documents instanceof Array, `datastore.${self.name}.find should resolve with an array`);
					return Promise.resolve();
				});

		}).then(function(){
			// check if amount of created documents checks out
			const creates = [
				self.insert(test_collection_name, {
					value: 2,
					random: rand
				}),
				self.insert(test_collection_name, {
					value: 3,
					random: rand
				}),
				self.insert(test_collection_name, {
					value: 4,
					random: -rand
				}),
			];

			const created_so_far = 4;
			return Promise.all(creates)
				.then(function(){
					return self.find(test_collection_name, {}, {});
				}).then(function(documents){
					assert(documents.length === created_so_far, `Inserted ${created_so_far} documents so far, but ${documents.length} were returned on .find()`);
					return Promise.resolve(created_so_far);
				});

		}).then(function(created_so_far){
			// check if there is a proper amount of documents with random value set to rand
			const documents_with_rand = created_so_far - 1;
			return self.find(test_collection_name, {
				random: rand
			}, {})
				.then(function(documents){
					assert(documents.length === documents_with_rand, `Inserted ${documents_with_rand} documents with "random" set to "${rand}" so far, but ${documents.length} were returned on .find({random: ${rand}})`);
					return Promise.resolve();
				});

		}).then(function(){
			// Should store a complex object
			const complex_object = {
				id: "aseoifaoeina",
				body: {
					name: "Anna",
					surname: "Fontanna"
				}
			};
			return self.insert(test_collection_name, complex_object)
				.then(function(response){
					assert.deepEqual(complex_object, response, ".insert with complex object should resolve with that complex object.");
					return self.find(test_collection_name, {
						id: complex_object.id
					});
				}).then(function(response){
					assert.deepEqual(complex_object, response[0], ".insert with complex object should store that complex object.");
					return Promise.resolve(complex_object);
				});

		}).then(function(complex_object){
			// Should handle dot-notation nested queries
			return self.find(test_collection_name, {
				"body.name": complex_object.body.name
			})
				.then(function(response){
					assert.deepEqual(complex_object, response[0], ".find method should handle dot notation queries");
					return Promise.resolve(complex_object);
				});

		}).then(function(complex_object){
			return self.find(test_collection_name, {
				body: {
					name: complex_object.body.name
				}
			})
				.then(function(response){
					assert.deepEqual(complex_object, response[0], ".find method should handle nested object queries");
					return Promise.resolve(complex_object);
				});

		}).then(function(complex_object){
			// .update should modify document values with dot notation
			complex_object.body.name = "Hanna";
			return self.update(test_collection_name, {
				id: complex_object.id
			}, {
				"body.name": complex_object.body.name
			})
				.then(function(){
					return self.find(test_collection_name, {
						id: complex_object.id
					});
				}).then(function(results){
					assert.deepEqual(complex_object, results[0], ".update should modify document values with dot notation");
					return Promise.resolve(complex_object);
				});

		}).then(function(complex_object){
			// .update should modify document values using nested object as a query
			complex_object.body.name = "Marzanna";
			return self.update(test_collection_name, {
				id: complex_object.id
			}, {
				body: {
					name: complex_object.body.name
				}
			})
				.then(function(){
					return self.find(test_collection_name, {
						id: complex_object.id
					});
				}).then(function(results){
					assert.deepEqual(complex_object, results[0], ".update should modify document values using nested object as a query ");
					return Promise.resolve(complex_object);
				});

		}).then(function(complex_object){
			// .update should insert new value to a field that previously had no value (undefined)
			complex_object.body.other = "Focca";
			return self.update(test_collection_name, {
				id: complex_object.id
			}, {
				body: {
					other: complex_object.body.other
				}
			})
				.then(function(){
					return self.find(test_collection_name, {
						id: complex_object.id
					});
				}).then(function(results){
					assert.deepEqual(complex_object, results[0], ".update should insert new value to a field that previously had no value (undefined)");
					return Promise.resolve(complex_object);
				});

		}).then(function(complex_object){
			// .remove should remove only one document when "just_one" is set to true
			return Promise.all([
				self.insert(test_collection_name, complex_object),
				self.insert(test_collection_name, complex_object),
				self.insert(test_collection_name, complex_object),
			]).then(function(){
				// all the "complex_object" documents have the same id
				return self.remove(test_collection_name, {
					id: complex_object.id
				}, true);
			}).then(function(){
				return self.find(test_collection_name, {
					id: complex_object.id
				});
			}).then(function(results){
				assert(results.length === 3, ".remove should remove only *one* document when `just_one` argument is set to true");
				return Promise.resolve(complex_object);
			});

		}).then(function(complex_object){
			// .remove should remove all matching documents when "just_one" is falsy
			return Promise.all([
				self.insert(test_collection_name, complex_object),
				self.insert(test_collection_name, complex_object),
				self.insert(test_collection_name, complex_object),
			]).then(function(){
				// all the "complex_object" documents have the same id
				return self.remove(test_collection_name, {
					id: complex_object.id
				}, false);
			}).then(function(){
				return self.find(test_collection_name, {
					id: complex_object.id
				});
			}).then(function(results){
				assert(results.length === 0, ".remove should remove all matching documents when 'just_one' is falsy");
				return Promise.resolve(complex_object);
			});

		}).then(function(){
			self.clear_collection(test_collection_name);
		}).catch(function(){
			self.clear_collection(test_collection_name);
			return Promise.reject("Compatibility test unsuccesfull");
		});
};


module.exports = Datastore;
