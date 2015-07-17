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

####Constructor

```js
var Sealious = require("sealious");
var CliChannel = new Sealious.ChipTypes.Channel("cli");
```

The constructor takes only one argument, which is a string that represents the channel's name and has to be unique amongst all other channels.

The constructor returns an object (which has a Chip a s its prototype). This object can be extended with any desired methods.

####Simple Channel example - command-line-interface

We're going to create a simple channel, that reads from standard input and listens for simple commands: 
* create [resource_type_name] - creates a resource of given type 
* list [resource_type_name] - lists all resources of given type


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