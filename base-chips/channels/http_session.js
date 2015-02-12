var sha1 = require("sha1");

module.exports = function(http_session, dispatcher, dependencies) {
    var www_server = dependencies["channel.www_server"];
    // dla trybu lokalnego	var sessionManager = dependencies["service.session_manager"];

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
