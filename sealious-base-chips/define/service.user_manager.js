var Promise = require("bluebird");


module.exports = function(user_manager, dispatcher){

	user_manager.create_user = function(dispatcher, username, password){
		var user_data;
		return dispatcher.services.user_manager.user_exists(username, dispatcher)
			.then(function(user_exists){	
				if (!user_exists){
					console.log("user ", username, "does not exists, creating it");
					return dispatcher.resources.create("user", {username: username, password:password});
				}else{
					throw new Sealious.Errors.ValueExists("Username `" + username + "` is already taken.");
				}
			})
	}

	user_manager.user_exists = function(dispatcher, username){
		return new Promise(function(resolve, reject){
			dispatcher.resources.find({username: username}, "user")
			.then(function(matched_documents){
				console.log("user-manager.js", "matched_documents", matched_documents);
				console.log("user-manager.js user_exists resolving with", matched_documents.length===1)
				resolve(matched_documents.length===1);
			});			
		})
	}

	user_manager.password_match = function(dispatcher, username, password){
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
					var err = new Sealious.Errors.InvalidCredentials("wrong username or password");
					reject(err);
				}
			})			
		})
	}

	user_manager.get_all_users = function(dispatcher){
		return dispatcher.datastore.find("resources", {type: "user"});
	}

	user_manager.get_user_data = function(dispatcher, user_resource_id){
		var user_resource_id = parseInt(user_resource_id);
		try{
			var ret = dispatcher.resources.get_by_id(user_resource_id);						
		}catch(err){
			throw err;
		}
		return ret;
	}

	user_manager.update_user_data = function(dispatcher, user_id, new_user_data){
		return dispatcher.datastore.find("users", {user_id: user_id})
		.then(function(user_document){
			console.log("user-manager.js user_document", user_document);
			userdata_id = user_document[0].userdata_id;
			return dispatcher.resources.update(userdata_id, new_user_data);
		})
	}

	user_manager.delete_user = function(dispatcher, username){
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
