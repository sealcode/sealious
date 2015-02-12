var mongo_access =  require("./mongo-access.js");

var DatabaseDirectAccess = new function(){
	this.init = function(){
		//być może tutaj trzeba bedzie inicjalizować mongo
	}

	this.query = function(collection, mode, query, options, output_options){
		//console.log("datbase.js: ", collection, mode, query, options, output_options)
		return mongo_access.query(collection, mode, query, options, output_options);
	}
}

module.exports = DatabaseDirectAccess;