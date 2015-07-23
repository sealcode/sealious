#Reference 

##Chip Types

###Acess Strategy

Access strategies are functions that take a context as an argument and based on it either allow or deny access to certain resources or operations.

####Simple access strategy example:

```js
var Public = new Sealious.ChipTypes.AccessStrategy({
    name: "public",
    checker_function: function(context){
        return true;
    }
});
```

This access strategy accepts any context.

####Constructor

The `AccessStrategy` constructor takes one argument, which is an object with attributes:
 * `name` - string, **required**. The name of the access strategy - it has to be a string unique amongst any other access strategies in your application.
 * `checker_function` - function, **required**. It's a function that takes a context instance as an argument and implements the logic of the access strategy. Its return values can be:
     - `boolean` - `true` for granting the access and `false` for denying.
     - a `Promise` - that resolves when the access is granted and rejects otherwise. Use promises only when the decision depends on a result of an asynchronous function.
 * `item_sensitive` - boolean, defaults to `false`. If set to `true`, the `checker_function` is provided with a second argument, which contains an object representing the resource being requested.

####A more advanced example

```js
new Sealious.ChipTypes.AccessStrategy({
    name: "id_starts_with_digit",
    checker_function: function(context, item){
        return new Promise(function(resolve, reject){
            if(number_test.test(item.id)){
                resolve("id ok!");              
            }else{
                reject("bad id");
            }
        });
    },
    item_sensitive: true,
});
```

It's a slightly more complex access strategy, that allows access only if given resource's id starts with a digit. Note that it was not necessary to use a Promise in the above `checker_function`, but it was included for example's sake.

TODO: example of a checker_function that uses contexts.
TODO: example of how ResourceTypes use access strategies.

###Channel

A channel's responsibility is to take any input it wants to (keyboard, http request, open socket, anything) and translate it to Sealious resource method calls.

Considering it's structure, it's the most flexible of all chip types.

The only method that Sealious will invoke on a channel is the optional `start` method, called on `Sealious.start()`.

#### Existing channels

Some noteworthy plugins that contain useful channels are:
* [sealious-www-server](https://github.com/Sealious/sealious-www-server) - it can also automatically generate high-quality REST API.

####Constructor

```js
var Sealious = require("sealious");
var CliChannel = new Sealious.ChipTypes.Channel("cli");
```

The constructor takes only one argument, which is a string that represents the channel's name and has to be unique amongst all other channels.

The constructor returns an object (which has a Chip as its prototype). This object can be extended with any desired methods.

####Simple Channel example - command-line-interface

We're going to create a simple channel, that reads from standard input and listens for a simple command: 
* list [resource_type_name] - lists all resources of given type

We'll use `readline` module, which is built-in into node.

Consider following code:

```js
var Sealious = require("sealious");
var readline = require("readline");

var CliChannel = new Sealious.ChipTypes.Channel("cli");

CliChannel.start = function(){
  console.log("Welcome to Sealious CLI Channel. Your wish is my command.")
  console.log("Please enter your wish:");
  var rl = readline.createInterface({
    input: process.stdin,
  });

  function process_line(line){
    var words = line.split(" ");
    switch(words[0]){
      case "list":
        var resource_type_name = words[1];
        var context = new Sealious.Context();
        Sealious.ResourceManager.list_by_type(context, resource_type_name)
        .then(function(list){
          console.log(list);          
        })
        break;
    }
  }

  rl.on("line", process_line);
}
```

The main functionality is achieved by calling:

```js
Sealious.ResourceManager.list_by_type(context, resource_type_name)
```

It's an asynchronous method, that returns a Promise, that resolves to an array of objects representing all of the resources of a given type that are accessible in presence of a given `context`. We're using a simple, empty context, that can be thought of as representing an unauthorized user. You can read more about contexts [here](#context)

### Datastore

Datastores are chips responsible for all the data storage for your application. Currently Sealious supports only one active datastore at a time, but it's subject to change in the near future. 

#### Constructor

```js
var my_datastore = new Sealious.ChipTypes.Datastore("my_datastore");
```

In above code snippet the `my_datastore` variable contains a Datastore object, that needs to be extended with methods which signatures are described below. 

IMPORTANT! All these methods need to return a promise that resolves on success.

* `find` - Retrieves documents from datastore. Its promise has to resolve with an array of documents (objects). A function with signature
  
  ```js
  function(collection_name, query, options, output_options)
  ```

  where:

  * `collection_name` (string) - the name of the desired collection.

  * `query` (object) - an object containing db-query in [MongoDB query syntax](http://docs.mongodb.org/manual/tutorial/query-documents/)

  * `options` - optional argument. In MongoDB datastore it is passed as `projection` argument to `find` method. Currently no core Sealious code uses that parameter

  * `output_options` (object) - allows to further filter or sort the query result. It can contain the following properties:
    * `sort` (object) - uses [MongoDB Sort syntax](http://docs.mongodb.org/manual/reference/method/cursor.sort/). Allows to sort the query results using any amount of attributes (fields);
    * `skip` (number) - how many documents from the beginning to  omit (analogous to the first argument in SQL's "LIMIT" statement)
    * `amount` (number) - how many documents to return at most (analogous to to the second argument in SQL's "LIMIT" statement)

* `insert` - Inserts a document to a datastore. **Resolves with the inserted document.** A function with signature
  
  ```js
  function(collection_name, to_insert, options)
  ```

  where:

  * `collection_name` (string) - the name of the desired collection
  * `to_insert` (object) - an object containing key-value pairs describing what to insert
  * `options` (object) - currently not used

* `update` - Updates a document in datastore. A function with signature

  ```js
  function(collection_name, query, new_value)
  ```

  where:

  * `collection_name` (string) - the name of the desired collection
  * `query` (object) - datastore query, which defines which document to update. Uses [MongoDB find query syntax](http://docs.mongodb.org/manual/reference/method/db.collection.find/)
  * `new_value` (object) - what changes to apply to the document. Uses [MongoDB update syntax](http://docs.mongodb.org/manual/reference/method/db.collection.update/#example-update-specific-fields)

* `remove` - removes a specified document from the datastore. A function with signature

  ```js
  function(collection_name, query, just_one)
  ```

  where:
  * `collection_name` (string) - the name of the desired collection
  * `query` (object) - datastore query, which defines which document to remove. Uses [MongoDB find query syntax](http://docs.mongodb.org/manual/reference/method/db.collection.find/)
  * `just_one` (boolean) - if set to true, datastore has to remove only one element matching the `query`. It might need to be removed in future versions.

#### Multiple Datastores

Because of the fact that Sealious currently supports only one active datastore at a time, you have to sleect which one it is. You can do so by invoking 
```js
Sealious.ConfigManager.set_config("datastore_chip_name", "my_datastore")
```
before calling `Sealious.start()`;

#### Example Datastore

##Plugins

Plugins are npm modules that can be required and used within a Sealious application. Usually a plugin just registers some new chips in Sealious' ChipManager.

###Creating a plugin
In order for Sealious to recognize an npm module as a plugin, the plugin has to contain a `"sealious-plugin"` keyword in it's `package.json`.

Example `package.json` content:

```json
{
  "name": "sealious-cli-channel",
  "version": "0.1.0",
  "description": "",
  "main": "index.js",
  "keywords": [
    "sealious-plugin"
  ],
  /* other usual package.json fields here */
}
```

###Installing an existing plugin
In order for Sealious to detect a plugin, the plugin has to be installed in your application's `node_modules` directory and it has to be present in your application's `package.json`'s `dependencies` attribute. It's usually achievable by running `npm install [plugin-name]` in your application's directory.