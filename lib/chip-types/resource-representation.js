/**
 * Represents a particular resource in database. Constructed by database entry.
 * @class
 * @param {object} database_entry 
 */
function ResourceRepresentation(database_entry){
	this.database_entry = database_entry;
}

ResourceRepresentation.prototype = new function(){
	/**
	 * Returns an object representing the resource, ready to be output for the public, e.g. as JSON
	 * @alias Resource#getData
	 * @return {object}
	 */
	this.getData = function(){
		var data = this.database_entry.body || {};
		data.owner_id = this.database_entry.owner;
		data.id = this.database_entry.sealious_id;
		data.access_mode = this.database_entry.access_mode;
		data.type = this.database_entry.type;
		
		return data;
	}

	/**
	 * Encodes Resource's data into JSON
	 * @alias Resource#toString
	 * @return {string} contains the json-encoded data
	 */
	this.toString = function(){
		return JSON.stringify(this.getData());
	}
	/**
	access_mode are not used in current version of Sealious, this code should be removed
	 */
	this.get_access_mode = function(){
		return this.database_entry.access_mode;
	}
}

module.exports = ResourceRepresentation;
