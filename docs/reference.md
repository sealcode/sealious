# Reference 

## Chip Types

### Access Strategy

Access strategies are functions that take a context as an argument and based on it either allow or deny access to certain resources or operations.

#### Simple access strategy example:

```js
var Public = new Sealious.ChipTypes.AccessStrategy({
    name: "public",
    checker_function: function(context){
        return true;
    }
});
```

This access strategy accepts any context.

#### AccessStrategy: Constructor

The `AccessStrategy` constructor takes one argument, which is an object with attributes:

 * `name` - string, **required**. The name of the access strategy - it has to be a string unique amongst any other access strategies in your application.
 * `checker_function` - function, **required**. It's a function that takes a context instance as an argument and implements the logic of the access strategy. Its return values can be:
     - `boolean` - `true` for granting the access and `false` for denying.
     - a `Promise` - that resolves when the access is granted and rejects otherwise. Use promises only when the decision depends on a result of an asynchronous function.
 * `item_sensitive` - boolean, defaults to `false`. If set to `true`, the `checker_function` is provided with a second argument, which contains an object representing the resource being requested.

#### A more advanced example

```js
var _is_number = /^[0-9]/;

new Sealious.ChipTypes.AccessStrategy({
    name: "id_starts_with_digit",
    checker_function: function(context, item){
        return new Promise(function(resolve, reject){
            if(_is_number.test(item.id)){
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

### Channel

A channel's responsibility is to take any input it wants to (keyboard, http request, open socket, anything) and translate it to Sealious resource method calls.

Considering it's structure, it's the most flexible of all chip types. 

You don't need a channel to create an application in Sealious, as Sealious gives you a programmatic API for CRUD operations on all of the resources (see ResourceManager), though channels are good for abstracting out the workings of an external API (such as REST, SMTP, XMPP etc.) and turning it into a reusable plugin.

The only method that Sealious will invoke on a channel is the optional `start` method, called on `Sealious.start()`.

#### Existing channels

Some noteworthy plugins that contain useful channels are:

* [sealious-www-server](https://github.com/Sealious/sealious-www-server) - it can also automatically generate high-quality REST API.

#### Channel: Constructor

```js
var Sealious = require("sealious");
var CliChannel = new Sealious.ChipTypes.Channel("cli");
```

The constructor takes only one argument, which is a string that represents the channel's name and has to be unique amongst all other channels. 

The constructor returns an object (which has a Chip as its prototype). This object can be extended with any desired methods.

#### Simple Channel example: command-line-interface

We're going to create a simple channel, that reads from standard input and listens for a simple command: 

> `list [resource_type_name]` - lists all resources of given type

We'll be using the `readline` module, which is built-in into node. 

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

The main functionality of the channel is contained within the line:

```js
Sealious.ResourceManager.list_by_type(context, resource_type_name)
```

`ResourceManager.list_by_type` is an asynchronous method that returns a Promise that resolves to an array of objects representing all of the resources of a given type that are accessible in presence of a given `context`. We're using a simple, empty context, that can be thought of as representing an unauthorized user. You can read more about contexts [here](# context)

### Datastore

Datastores are chips responsible for all the data storage for your application. Currently Sealious supports only one active datastore at a time, but it's subject to change in future versions. 

#### Datastore: Constructor

```
var my_datastore = new Sealious.ChipTypes.Datastore("my_datastore");
```

In above code snippet the `my_datastore` variable contains a Datastore object, that needs to be extended with methods which signatures are described below. 

IMPORTANT! All these methods need to return a promise that resolves on success.

* `find` - Retrieves documents from datastore. Its promise has to resolve with an array of documents (objects). A function with signature
  
  ```
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
  
  ```
  function(collection_name, to_insert, options)
  ```

  where:

  * `collection_name` (string) - the name of the desired collection
  * `to_insert` (object) - an object containing key-value pairs describing what to insert
  * `options` (object) - currently not used

* `update` - Updates a document in datastore. A function with signature

  ```
  function(collection_name, query, new_value)
  ```

  where:

  * `collection_name` (string) - the name of the desired collection
  * `query` (object) - datastore query, which defines which document to update. Uses [MongoDB find query syntax](http://docs.mongodb.org/manual/reference/method/db.collection.find/)
  * `new_value` (object) - what changes to apply to the document. Uses [MongoDB update syntax](http://docs.mongodb.org/manual/reference/method/db.collection.update/# example-update-specific-fields)

* `remove` - removes a specified document from the datastore. A function with signature

  ```
  function(collection_name, query, just_one)
  ```

  where:
  * `collection_name` (string) - the name of the desired collection
  * `query` (object) - datastore query, which defines which document to remove. Uses [MongoDB find query syntax](http://docs.mongodb.org/manual/reference/method/db.collection.find/)
  * `just_one` (boolean) - if set to true, datastore has to remove only one element matching the `query`. It might need to be removed in future versions.

#### Built-in datastore methods

As all [chips](https://github.com/Sealious/Sealious#structure), initiated datastores have two default methods:

  * `start` - takes no arguments and is meant to be called automatically by Sealious. Usually of no concern for a developer.
  * `test` - perfoms unit tests on the datastore.

#### Multiple Datastores

Because of the fact that Sealious currently supports only one active datastore at a time, you have the ability to manually select which one it is. You can do so by invoking 
```js
Sealious.ConfigManager.set_config("datastore_chip_name", "my_datastore")
```
before calling `Sealious.start()`;

There's no need to specify which datastore to use if there's only one datastore available.

#### Example Datastore

We've created a simple file-based datastore for demonstratory purposes:

> [Sealious-datastore-file](https://github.com/Sealious/sealious-datastore-file)

It's not the most efficient one (for any real-life applications the currently default datastore-mongo is recommended), but it highlights all the necessary inner workings of a Datastore, so it makes a good starting point if you want to create your own Datastore.

### Field-type

Each "field" in a [ResourceType](#resource-type) must be assigned a field-*type*. 
Field-types describe which values can and which cannot be assigned to a field.
Field-type's behaviour can be adjusted using field-type parameters.

A field-type can accept or reject a value, with appropriate error message.

It's a field-type's responsibility to describe how to store it's values in a datatore.

Some field-types that come bundled with Sealious:
  * text - for storing strings of chars.
  * email - like text, but accepts only valid email addresses as values
  * int - for storing integer numbers
  * float - for storing real numbers
  * file - for storing managed user-submitted files
  * reference - for storing a reference to a resource. This field-type can be adjusted to only accept references to certain resource types.

You can find out more about built-in field-types and other chips in the "Chips that come bundled with Sealious" section.

#### Creating a field-type

Field types are a little bit different from other chips, as they are to be instantiated multiple times for different fields in multiple resource types. This means that:
  * field-types are never *started* - they just contain some logic that Sealious uses when validating user input and encoding/decoding data to/from datastores.
  * methods of a field-type reside in its *prototype* (as technically speaking field-types are constructor functions), as you can see in the example below

##### A simple Field-Type example

Let's review a simple code sample: 

```js
var Sealious = require("sealious");
var Promise = require("bluebird");
var Color = require("color");

var field_type_color = new Sealious.ChipTypes.FieldType("color");

field_type_color.prototype.isProperValue = function(context, new_value){
  try{
    Color(value_in_code.toLowerCase());
  } catch(e){
    return Promise.reject("Value `" + value_in_code + "` could not be parsed as a color.");
  }
  return true;
}

field_type_color.prototype.encode = function(context, new_value){
  var color = Color(value_in_code);
  return Promise.resolve(color.hexString())
}
```

This is a simple field-type that accepts color values in various notations (html color names, hex, rgba, hsl...). It will reject any value that does not name a color. 

This field-type uses the very useful [color package](https://www.npmjs.com/package/color).

What's important to note here is the `encode` method - it takes any value already validated by `isProperValue` and converts it to hex - that way all the color values in the database are uniform and easily searchable. 

#### Field-type methods and attributes

##### The constructor
To create a field-type, call the FieldType constructor function:
   
```js
var my_field_type = new Sealious.ChipTypes.FieldType("my_field_type");
```
the return value of the constructor function is itself a function, whose `prototype` we're interested in extending.

##### isProperValue

```
my_field_type.prototype.isProperValue: 
  (context: Context, new_value : any, old_value: any) => Promise|Boolean
```

This method should either return a boolean value (`true` for valid values and `false` for invalid), or a [Promise](#accessstrategy-constructor) that `resolve`s for correct values and `reject`s for incorrect ones.

Simply returning `false` is discouraged. It's better to `Promise.reject` with an error message (a string). The error message is then supposed to be shown to user as a part of the validation error message. Example:

```js
my_field_type.isProperValue = function(context, new_value){
  if(new_value=="good"){
    return true;
  }else{
    return Promise.reject("I will only accept `good` as value for this field.");
  }
}
```

Specifying this method is **optional**. If this method is not defined in a field-type, a default one is used - one that accepts any value.

It takes the following arguments: 
 * `context` - a Context object representing the context in which the value was submitted. The field-type may or may not take context into consideration.
 * `new_value` - can be of any type. Represents the value to be checked. Usually directly represents user input.
 * `old_value` - represents the value previously residing in in a field that this field-type is assigned to. This argument can be used e. g. for creating a field type that accepts only values that are higher than the current value.
   **Important!** For performance reasons, this argument is automatically set to `undefined`, unless Sealious is specifically instructed to provide this field-type with previous values. See `old_value_sensitive` section below for more details

##### encode

```
my_field_type.prototype.encode: 
  (context: Context, new_value: Any, old_value: Any) => Promise<Any>|Any
```

This method takes a field value (usually coming from user input) and encodes it in something that the datastore can understand. There's no set restrictions on how the encoding process works. What this method returns will be stored in the datastore and passed on to `decode` when reading the resource's contents.

Specifying this method is **optional**. If this method is not defined in a field-type, a default one is used - one that returns `new_value` unchanged.

It takes the following arguments: 
 * `context` - a Context object representing the context in which the value was submitted. The field-type may or may not take context into consideration.
 * `new_value` - can be of any type. Represents the value to be encoded. Usually directly represents user input.
 * `old_value` - represents the value previously residing in in a field that this field-type is assigned to.
   **Important!** For performance reasons, this argument is automatically set to `undefined`, unless Sealious is specifically instructed to provide this field-type with previous values. See `old_value_sensitive` section below for more details

##### decode

```
my_field_type.prototype.decode:
  (context: Context, value_in_datastore: Any) => Promise<Any>|Any
```

This method is used to transform a value stored in a datastore(encoded by calling the `encode` method of the field-type) into something more readable or user-friendly. It's return value is usually what the users of the API will see. It can be thought of as the reverse of `encode` function, but that doesn't have to be the case.

In most cases the return value of this method should be the same as the value passed to the `encode` method for that particular field/value combination.

Specifying this method is **optional**. If this method is not defined in a field-type, a default one is used - one that returns `value_in_datstore` unchanged.

It takes the following arguments:
  * `context` - a `Context` object representing the context in which the value is read. The field-type may or may not take context into consideration.
  * `value_in_datastore` - a raw value that the datastore returned. Encoded by calling the field-type's `encode` method. 

##### old_value_sensitive

```
my_field_type.prototype.old_value_sensitive: bool
```

Set to `false` for each field-type by default, for performance reasons. 

When it's set to true, Sealious will provide the `isProperValue` and `encode` methods with the current value of the requested/modified field by passing it as `old_value` argument.

#### Field-type parameters

Each field has to have a field-type assigned. 
Optionally, a field declaration can contain parameters that will be accessible from within the fiel-type methods.
These parameters can affect which values for the field are considered correct, how the values are encoded, etc.

##### Passing parameters to field-type instance

Parameters are passed from the field declaration, like so:
```js
//a single field declaration in ResourceType constructor:
{
  name: "article_content",
  type: "text",
  params: {
    strip_html: true
  }
}
```

Note the `params` attribute. 

Text entered in the field described by the above snippet will have any html tags stripped on user submission.

##### Accessing field-type parameters

Parameters are accessible as `this.params` in every field-type method, like so:

```js
my_field_type.isProperValue = function(context, new_value){
  if(this.params.max_length){
    if(new_value.length>this.params.max_length){
      return false;
    }
  }else{
    return true;
  }
}
```

### Resource-type

Every time a user interacts with a Sealious application, they interact with resources. A Resource in Sealious can be thought of as an equivalent of a row in a SQL database table. A Resource-type would be the columns for said table - a list of fields, each with its name and type.

A Resource-type is construted based on a Resource-type description.

#### Creating a resource-type

Creating a resource-type is very straightforward - you only have to provide the constructor with a proper resource-type description.

##### A simple resource-type example

```js
var Sealious = require("sealious");

new Sealious.ChipTypes.ResourceType({
  name: "person",
  fields: [
    {name: "first-name", type: "text", required: true},
    {name: "age", type: "int"}
  ]
})
```

There's not much to analyze here, except for the syntax of the resource-type description, which is discussed below.

#### Resource-type description syntax

Every resource type is described by a hashmap: 

```js
{
  name: String,
  fields: Array<FieldDescription>,
  access_strategy?: AccessStrategyDescription
}
```

* `name`, **required** - the name of the resource-type. It becomes the name of the [chip](https://github.com/Sealious/Sealious/blob/dev/README.md#structure) representing the resource type, as well. It has to be unique amongst all other resource-types.
* `fields`, **required** - an array of field descriptions. You can read about field description syntax below.
* `access_strategy`, optional. A hashmap or string compatible with access strategy description syntax, described below. **Defaults to `public`**.

#### Field description syntax

A field-type description is a hashmap, as well. It looks like this:

```js
{
  name: String,
  type: FieldTypeName,
  human_readable_name?: String,
  params?: Object
}
```

* `name`, **required** - a string representing the machine-readable name for the field. Should be short. No spaces allowed. All lower-case letters, the `_` and `-` symbols are allowed.
* `human_readable_name`, optional - a string representing a human-readable version of the field's name. No restrictions on what is and what is not allowed here. **When not specified, the value of 'name' attribute is used instead**.
* `type`, **required** - a string representing a resource-type name that is already registred in your Sealious application.
* `params`, optional - a hashmap of parameters that will be passed to the field-type. These parameters are also a part of the field's signature. **Defaults to `{}`.**

#### Resource-type methods and attributes

##### The constructor

## Plugins

Plugins are npm modules that can be required and used within a Sealious application. Usually a plugin just registers some new [chips](https://github.com/Sealious/Sealious/blob/dev/README.md#structure) in Sealious' ChipManager.

### Creating a plugin
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

### Installing an existing plugin
In order for Sealious to detect a plugin, the plugin has to be installed in your application's `node_modules` directory and it has to be present in your application's `package.json`'s `dependencies` attribute. It's usually achievable by running `npm install [plugin-name]` in your application's directory.

## Chips that come bundled with Sealious
