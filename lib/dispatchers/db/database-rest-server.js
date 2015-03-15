var Hapi = require('hapi');
var config = require("../../config/config-manager.js").getConfiguration();

var DatabaseAccess = null;//a proper datastore driver will be passed by the dispatcher using pass_datastore_object method

var server = new Hapi.Server();
server.connection({ port: parseInt(config.db_layer_config.port)});

//console.log("I'm in database-rest-server");

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('jestę serwerę 1');
    }
});

server.route({
    method: 'GET',
    path: '/api/rest/v1/{collection_name}/',
    handler: function (request, reply) {
        var collection_name = request.params.collection_name;
        var query = (request.query.query && JSON.parse(request.query.query))||{};
        console.log(request.query);
        for(var i in query){
            //checking for regular expression
            if(query[i]!=null && query[i].toString().slice(0, 3) == "$R("){
                var regex_declaration = query[i].slice(3, -1);
                query[i] = new RegExp(regex_declaration.split("/")[1], regex_declaration.split("/")[2]);
            }
        }
        var options = (request.query.options && JSON.parse(request.query.options)) || {};
        var output_options = JSON.parse(request.query.output_options);
        DatabaseAccess.find(collection_name, query, options, output_options).then(function(data){
            reply(data); // odpowiedz na zapytanie http
        })
    }  
}); 

/* POST NA ZASÓB */
server.route({
    method: 'POST',
    path: '/api/rest/v1/{collection_name}/',
    handler: function (request, reply) {
        var collection_name = request.params.collection_name;
        var options2 = JSON.parse(request.payload.json_encoded_payload);
        var query = options2.query;
        var mode = options2.mode;
        var options = options2.options;
        DatabaseAccess.insert(collection_name, query, options).then(function(data){
            reply(data);
        });
    }  
});

server.route({
    method: 'PUT',
    path: '/api/rest/v1/{collection_name}/',
    handler: function (request, reply) {
        var collection_name = request.params.collection_name;
        var options2 = JSON.parse(request.payload.json_encoded_payload);
        var query = options2.query;
        var mode = options2.mode;
        var options = options2.options;
        DatabaseAccess.update(collection_name, query, options).then(function(data){
            reply(data);
        });
    }  
});

server.route({
    method: 'DELETE',
    path: '/api/rest/v1/{collection_name}/',
    handler: function (request, reply) {
        var collection_name = request.params.collection_name;
        var options2 = JSON.parse(request.payload.json_encoded_payload);
        var query = options2.query;
        var mode = options2.mode;
        var options = options2.options;
        DatabaseAccess.delete(collection_name, query, options).then(function(data){
            console.log("database-rest-server.js", "database response after DELETE statement:", data, ".");
            reply(data);
        });
    }  
});

var db_biz_protocol = {};

db_biz_protocol.server = server;

db_biz_protocol.pass_datastore_object = function(datastore_object){
    DatabaseAccess = datastore_object;
}

module.exports = db_biz_protocol;