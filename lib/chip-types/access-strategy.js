var Sealious = require("../main.js");
var Promise = require("bluebird");
var Chip = require("./chip.js");

function AccessStrategy (declaration) {
	if (typeof declaration.name != "string") {
		throw new Sealious.Errors.DeveloperError("Access strategy declaration has an invalid or missing `name` attribute");
	}
	Chip.call(this, true, "access_strategy", declaration.name);
	this.checker_function = null;
	this.item_sensitive = false;
	if (declaration) this._process_declaration(declaration);
}

AccessStrategy.prototype = new function(){


	/*
	Process declaration of access strategy. Gives new access strategy checker_function and item_sensitive from declaration.
	@param {object} delcaration - is an object with attributes:
	name - string, required. The name of the access strategy - it has to be a string unique amongst any other access strategies in your application.
	checker_function - function, required. It’s a function that takes a context instance as an argument and implements the logic of the access strategy. Its return values can be:
		* boolean - true for granting the access and false for denying.
		* a Promise - that resolves when the access is granted and rejects otherwise. Use promises only when the decision depends on a result of an asynchronous function.
	item_sensitive - boolean, defaults to false. If set to true, the checker_function is provided with a second argument, which contains an object representing the resource being requested.
	*/
	this._process_declaration = function(declaration){
		this.checker_function = declaration.checker_function === undefined ? null : declaration.checker_function;
		if (declaration.item_sensitive !== undefined) {
			this.item_sensitive = declaration.item_sensitive;
		}
	}

	/* 
	Setter of checker function. 
	@param {function} checker_function - function to be set as checker function of this access strategy.
	return void
	*/
	this.set_checker_function = function(checker_function){
		this.checker_function = checker_function;
	}


	/* 
	Calls checker function and returns Promise if checker function resolves or error if it doesn't. 
	@param {object} context - context in which item will be checked
	@param {object} item - item to be checked by checker function
	return Promise
	*/
	this.check = function(context, item){
		var arguments_to_check_function = arguments;
		return this.checker_function.apply(this, arguments_to_check_function)
		.then(function(){
			return Promise.resolve(item);
		}).catch(function(error_message){
			if (typeof error_message == "string") {
				return Promise.reject(new Sealious.Errors.BadContext(error_message));
			} else {
				return Promise.reject(error_message);
			}
		});
	}
}

// odrzucanie i przyjmowanie wartości za pomocą checker_function, która zwraca Promisa
// odrzucanie i przyjmowanie wartości za pomocą checker_function, która zwraca Booleana


AccessStrategy.type_name = "access_strategy";

module.exports = AccessStrategy;