"use strict";

module.exports = function(app, context, reply){
	const config = 	app.ConfigManager.get_config()["www-server"];
	return function(response){
		let rep = null;
		if(response instanceof app.Sealious.File){
			rep = reply.file(response.path_on_hdd, {confine: false}).type(response.mime).header("Cache-Control", "max-age=6000, must-revalidate");
		}else if(response instanceof app.Sealious.Responses.NewSession){
			rep = reply(response).state(config["session-cookie-name"], response.metadata.session_id);
		}else if(response instanceof app.Sealious.Responses.ResourceCreated){
			rep = reply(response).code(201);
		} else if (response instanceof app.Sealious.VirtualFile){
			rep = reply(response.content).type(response.mime);
		} else {
			rep = reply(response);
		}
		//if(context.anon_session_is_new || context.anonymous_session_id != ){
		//commented out so the anonymous_session_id is reset on logout
			rep.state(config["anonymous-cookie-name"], context.anonymous_session_id);
		//}
	};
};
