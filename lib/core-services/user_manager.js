var Promise = require("bluebird");
var sha1 = require("sha1");

var session_id_to_user_id = {};
//póki co hashe sesji sa trzymane tylko w RAMie. Być może trzeba będzie je trzymac w pliku (albo w plikach!) na dysku.

function generate_session_id() {
    var seed = Math.random().toString();
    var session_id = sha1(seed);
    return session_id;
}

function new_session(user_id) {
    var session_id = generate_session_id();
    session_id_to_user_id[session_id] = user_id;
    return session_id;
}

function kill_session(session_id) {
    Sealious.Logger.info("Killing session: ", session_id);
    delete session_id_to_user_id[session_id];
}

function get_user_id(session_id) {
    if (session_id_to_user_id[session_id]==undefined) {
        return false;        
    }else{
        return session_id_to_user_id[session_id];
    }
}

module.exports = new function(){
	this.name = "users";

	this.create_user = function(context, username, password){
		var user_data;
		return Sealious.Dispatcher.users.user_exists(username, dispatcher)
		.then(function(user_exists){	
			if (!user_exists){
				Sealious.Logger.info("User " + username +"has been created");
				return Sealious.Dispatcher.resources.create("user", {username: username, password:password});
			}else{
				throw new Sealious.Errors.ValueExists("Username `" + username + "` is already taken.");
			}
		})
	}

	this.user_exists = function(context, username){
		return new Promise(function(resolve, reject){
			Sealious.Dispatcher.resources.find({username: username}, "user")
			.then(function(matched_documents){
				resolve(matched_documents.length===1);
			});			
		})
	}

	this.password_match = function(context, username, password){
		return new Promise(function(resolve, reject){
			if (!username && !password) {
				var err = new Sealious.Errors.InvalidCredentials("Missing username and password!");
				reject(err);
			} else if (!password) {
				var err = new Sealious.Errors.InvalidCredentials("Missing password!");
				reject(err);
			} else if (!username) {
				var err = new Sealious.Errors.InvalidCredentials("Missing username!");
				reject(err);
			} else {
				username = username.toString();
				password = password.toString();
				var query = {type: "user", body: {username: username, password: password}};
				Sealious.Dispatcher.datastore.find("resources", query)
				.then(function(result){
					if(result[0]){
						resolve(result[0].sealious_id);
					}else{
						var err = new Sealious.Errors.InvalidCredentials("Wrong username or password!");
						reject(err);
					}
				})
			}			
		})
	}

	this.get_all_users = function(context){
		return Sealious.Dispatcher.datastore.find("resources", {type: "user"});
	}

	this.get_user_data = function(context, user_resource_id){
		try{
			var ret = Sealious.Dispatcher.resources.get_by_id(context, user_resource_id);
		}catch(err){
			throw err;
		}
		return ret;
	}

	this.update_user_data = function(context, user_id, new_user_data){
		return Sealious.Dispatcher.resources.update_resource(user_id, new_user_data);
	}

	this.delete_user = function(context, user_id){
 		return new Promise(function(resolve, reject){ 			
 			Sealious.Dispatcher.datastore.delete("resources", {sealious_id: user_id})
 			.then(function(data){
				resolve(data);
			}).catch(function(e){
				reject(e);
			});			
		});
	}

	this.login_and_start_session = function(context, login, password){
		var that = this;
		return new Promise(function(resolve, reject){
			that.password_match(context, login, password)
			.then(function(user_id){
				resolve(that.new_session(user_id));
			})			
		})
	}

	this.new_session = new_session;
    this.kill_session = kill_session;
    this.get_user_id = get_user_id;
}
