var Promise = require("bluebird");
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var Server = mongodb.Server;

module.exports = function(datastore_mongo){

	console.log("datastore constructor function", datastore_mongo.longid);

	var db = null;
	var mongo_client = null;

	datastore_mongo.default_configuration = {
		embedded: false,
		host: 'localhost',
		port: 27017
	}


	datastore_mongo.start = function(){
		var config = datastore_mongo.configuration;
		var mongo_client = new MongoClient(new Server(config.host, config.port));
		return new Promise(function(resolve, reject){
			mongo_client.open(function(err, mongoClient){
				db = mongoClient.db("myproject");
				resolve();
			})			
		})
		db = connected_mongo_client.db("myproject");
	}

	function process_query(query){
		if(!query){
			return {};
		}
		for(var attribute_name in query){
			if(attribute_name=="prometheus_id"){
				query[attribute_name] = parseInt(query[attribute_name]);
			}
		}
		return query;
	}

	datastore_mongo.find = function(collection_name, query, options, output_options){
		query = process_query(query);
		options = options || {};
		output_options = output_options || {};
		return new Promise(function(resolve, reject){
			var cursor = db.collection(collection_name).find(query, options);

			if (output_options.sort) {
			    cursor.sort(output_options.sort);
			}
			if (output_options.skip) {
			    cursor.skip(output_options.skip);
			}
			if (output_options.amount) {
			    cursor.limit(output_options.amount);
			}
			cursor.toArray(function(err, val) {
			    if (err) {
			        reject(err)
			    } else {
			        resolve(val);
			    }
			})
		})
	}

	datastore_mongo.insert = function(collection_name, to_insert, options){
		return new Promise(function(resolve, reject){
			db.collection(collection_name).insert(to_insert, options, function(err, inserted){
			    if (err) {
			        reject(err);
			    } else {
			        resolve(inserted);
			    }
			})
		})
	}

	datastore_mongo.update = function(collection_name, query, new_value){
		query = process_query(query);
		return new Promise(function(resolve, reject){
			db.collection(collection_name).update(query, new_value, function(err, inserted) {
			    if (err) {
			        reject(err);
			    } else {
			        resolve(inserted);
			    }
			})
		})
	}
	
	datastore_mongo.delete = function(collection_name, query, justOne){
		query = process_query(query);
		return new Promise(function(resolve, reject){
			if(justOne===undefined){
				justOne=0;
			}
			justOne = justOne? 1 : 0;
			db.collection(collection_name).remove(query, justOne, function(err, delete_response) {
			    if (err) {
			        reject(err);
			    } else {
			        resolve(delete_response);
			    }
			})			
		})
	}
}