var sha1 = require("sha1");

var session_id_to_user_id = {};
//póki co hashe sesji sa trzymane tylko w RAMie. Być może trzeba będzie je trzymac w pliku (albo w plikach!) na dysku.

function generate_session_id() {
    //var seed = microtime.now().toString() + Math.random().toString();
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
    delete session_id_to_user_id[session_id];
}

function get_user_id(session_id) {
    if (session_id_to_user_id[session_id]) {
        return session_id_to_user_id[session_id];
    }else{
        return false;        
    }
}

module.exports = function(www_server, dispatcher, dependencies){

    var http_channel = dependencies["channel.http"];

    www_server.default_configuration = {
        port: 80
    }

    www_server.server = http_channel.new_server();
    www_server.server.connection({port: www_server.configuration.port,  routes: { cors: true }})
    
    www_server.start = function(){
        www_server.server.start(function(err){
            console.log('HTTP: '+www_server.server.info.uri+'\n================ \n');
        })
    }

    var custom_reply_function = function(original_reply_function, obj){
        var ret;
        if(obj instanceof Error){
            original_reply_function(obj.message);
            console.log(obj.stack);
        }else if(obj && obj.is_error){
            if(obj.is_user_fault){
                ret = original_reply_function(obj.toResponse());
                ret.statusCode = obj.http_code;                
            }else{
                ret = original_reply_function("{\"server_error\":true}");
                console.log(obj.message);
                console.log(obj.stack);
                ret.statusCode = 500;
            }
        }else{
            ret = original_reply_function(obj);
        }
        return ret;
    }

    www_server.route = function(){
        var original_handler = arguments[0].handler;
        if(original_handler && typeof original_handler=="function"){
            arguments[0].handler = function(request, reply){
                var new_reply = custom_reply_function.bind(custom_reply_function, reply);
                original_handler(request, new_reply);
            }
        }
        www_server.server.route.apply(this.server, arguments);
    }


    www_server.static_route = function(path, url) {        
        this.server.route({ 
            method: 'GET',
            path: url + '/{param*}',
            handler: {
                directory: {
                    path: path
                }
            }
        });
    }

    www_server.new_session = new_session;
    www_server.kill_session = kill_session;
    www_server.get_user_id = get_user_id;
}