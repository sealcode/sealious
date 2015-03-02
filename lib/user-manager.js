var Promise = require("bluebird");

var SealiousErrors = require("./response/error.js");

var UserManager = new function(){
var that = this;

	this.create_user = function(username, password, dispatcher){
		var user_data;
		return dispatcher.users_user_exists(username, dispatcher)
			.then(function(user_exists){	
				if (!user_exists){
					console.log("user ", username, "does not exists, creating it");
					return dispatcher.resources_create("user", {username: username, password:password});
				}else{
					throw new SealiousErrors.ValueExists("Username `" + username + "` is already taken.");
				}
			})
	}

	this.user_exists = function(username, dispatcher){
		return new Promise(function(resolve, reject){
			dispatcher.resources_find({username: username}, "user")
			.then(function(matched_documents){
				console.log("user-manager.js", "matched_documents", matched_documents);
				console.log("user-manager.js user_exists resolving with", matched_documents.length===1)
				resolve(matched_documents.length===1);
			});			
		})
	}

	this.password_match = function(username, password, dispatcher){
		username = username.toString();
		password = password.toString();
		console.log("searching forr "+username+":"+password);
		return new Promise(function(resolve, reject){
			var query = {type: "user", body: {username: username, password: password}};
			console.log("search query: ", query);
			dispatcher.datastore.find("resources", query)
			.then(function(result){
				console.log("result:", result);
				if(result[0]){
					console.log("found");
					resolve(result[0].prometheus_id);
				}else{
					var err = new SealiousErrors.InvalidCredentials("wrong username or password");
					reject(err);
				}
			})			
		})
	}

	this.get_all_users = function(dispatcher){
		return dispatcher.datastore.find("resources", {type: "user"});
	}

	this.get_user_data = function(user_resource_id, dispatcher){
		var user_resource_id = parseInt(user_resource_id);
		try{
			var ret = dispatcher.resources_get_by_id(user_resource_id);						
		}catch(err){
			throw err;
		}
		return ret;
	}

	this.update_user_data = function(user_id, new_user_data, dispatcher){
		return dispatcher.datastore.find("users", {user_id: user_id})
		.then(function(user_document){
			console.log("user-manager.js user_document", user_document);
			userdata_id = user_document[0].userdata_id;
			return dispatcher.resources_update(userdata_id, new_user_data);
		})
	}

	this.delete_user = function(username, dispatcher){
 		return new Promise(function(resolve, reject){ 			
 			dispatcher.datastore.delete("users", {username: username})
 			.then(function(data){
				resolve(data);
			}).catch(function(e){
	 			reject(e);
	 		});			
 		});
 	}



}

module.exports = UserManager;