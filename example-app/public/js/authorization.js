var Auth = {};

Auth.is_logged_in = function(callback){
	$.get("/api/v1/users/me", function(data){
		if(data["id"]){
			callback(true);
		}else{
			callback(false);
		}
	})
}

Auth.redirect_if_not_logged_in = function(){
	Auth.is_logged_in(function(logged_in){
		if(!logged_in){
			document.location = "/login.html";
		}
	})	
}

Auth.logout = function(){
	$.post("/logout", function(data){
		document.location="/login.html";
	});
}

Auth.get_user_data = function(callback){
	$.get("/api/v1/users/me", function(data){
		callback && callback(data);
	})
}