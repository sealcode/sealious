//przekopiowane ze stackoverflow

var mongo = require('mongodb');

// a mongo connection cache
// pass in host & port
// it returns a function accepting dbName, collectionName & callback
var mongoCache = function(host, port){

  // keep our open connections
  var mongoDatabases = {};

  var ensureDatabase = function(dbName, readyCallback){
    // check if we already have this db connection open
    if(mongoDatabases[dbName]){
      readyCallback(null, mongoDatabases[dbName]);
      return;
    }

    // get the connection
    var server = new mongo.Server(host, port/*, {auto_reconnect: true, w:1, journal:true, safe: true}*/);

    // get a handle on the database
    var db = new mongo.Db(dbName, server, {w:1});
    db.open(function(error, databaseConnection){
      if(error) throw error;

      // add the database to the cache
      mongoDatabases[dbName] = databaseConnection;

      // remove the database from the cache if it closes
      databaseConnection.on('close', function(){
        delete(mongoDatabases[dbName]);
      })

      // return the database connection
      readyCallback(error, databaseConnection);
    })
  }

  var ensureCollection = function(dbName, collectionName, readyCallback){

    ensureDatabase(dbName, function(error, databaseConnection){
      if(error) throw error;

      databaseConnection.createCollection(collectionName, function(error, collection) {
        if(error) throw error;

        // return the collection finally
        readyCallback(error, collection);
      })

    })
  }

  return ensureCollection;
}

module.exports = mongoCache;