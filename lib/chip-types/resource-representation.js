/**
 * Represents a particular resource in database. Constructed by database entry.
 * @class
 * @param {object} database_entry 
 */
function ResourceRepresentation(database_entry){
	this.database_entry = database_entry;
	if(!database_entry.body){
		//console.log("database_entry missing:", database_entry.body);
	}
	//console.log("DATABASE_ENTRY: ", database_entry);
}

ResourceRepresentation.prototype = new function(){
	/**
	 * Returns an object representing the resource, ready to be output for the public, e.g. as JSON
	 * @alias Resource#getData
	 * @return {object}
	 */
	this.getData = function(){
		var data = this.database_entry.body || {};
		//console.log(data===null);
		data.owner_id = this.database_entry.owner;
		data.id = this.database_entry.sealious_id;
		data.access_mode = this.database_entry.access_mode;
		
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

	this.get_access_mode = function(){
		return this.database_entry.access_mode;
	}
}

module.exports = ResourceRepresentation;
