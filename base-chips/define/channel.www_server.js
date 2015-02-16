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
    }
    return false;
}

module.exports = function(www_server, dispatcher, dependencies){

    var http_channel = dependencies["channel.http"];

    www_server.default_configuration = {
        port: 80
    }

    www_server.server = http_channel.new_server("www", www_server.configuration.port, {cors:true});
    
    www_server.start = function(){
        this.server.start(function(err){
            console.log('HTTP: '+www_server.server.info.uri+'\n================ \n');
        })
    }

    www_server.route = function(){
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

    www_server.route({
        method: "POST",
        path: "/login",
        handler: function(request, reply) {
            dispatcher.users_password_match(request.payload.username, request.payload.password).then(function(user_id) {
                if (user_id) {
                    var sessionId = www_server.new_session(user_id);
                    reply("http_session: Logged in!").state('PrometheusSession', sessionId).redirect('/');
                } else {
                    reply("Password incorrect.")
                }
            });
        }
    });
    www_server.route({
        method: "POST",
        path: "/logout",
        handler: function(request, reply) {
            www_server.kill_session(request.state.PrometheusSession);
            reply().redirect("/login.html");
        }
    });
    www_server.route({
        method: "GET",
        path: "/api/v1/make_coffee",
        handler: function(request, reply) {
            reply().code(418);
        }
    });
}