Sealious [![Build Status](https://travis-ci.org/Sealious/Sealious.svg?branch=dev)](https://travis-ci.org/Sealious/Sealious)
==========
Warning! Sealious is still in very early stages of development. You are welcome to look around (even more so to contact us via [issue tracker](https://github.com/Sealious/Sealious/issues)!)

What is it?
----------
Sealious is an application-development framework. It can be used to create a web application (with the help of [sealious-www-server module](https://github.com/Sealious/sealious-www-server)), as well as a desktop app (in conjunction with NW.js or Electron).

Advantages
----------
Sealious proposes an application architecture that enables creating applications in a highly declarative way. A simple app that would keep information about emplyees needs not much more code than: 

```js
new Sealious.ChipTypes.ResourceType("employee", {
	fields: [
		{name: "first-name", type: "text", required: true},
		{name: "last-name", type: "text", required: false}, 
		{name: "photo", type: "file", required: true},
		{name: "is-friends-with", type: "reference", allowed_types:["employee"]}
	],
	access_strategy: {
		create: "only-admin",
		retrieve: "public"
	}
});
```

Inserting the above code in a Sealious application will cause it to:
* create the neccessary database schema (we currently support MongoDB, but MySQL (and other db drivers) support is on its way)
* publish a JavaScript API for CRUD operations on `employee` resource type. The api is context-sensitive, that is it will always require information about the user that makes the request to it in order to perform any operation, and based on that context decides whether the operation is permitted for that user, or not.

If `sealious-www-server` plugin is installed:
* the web server will publish a REST-ful API, with access strategies reflecting those described in the `access_strategy` attribute (only admins can create new entries, but anyone can view the entries). The REST-ful API is standards-compliant and is 100% automatically generated - there's no developer involvement needed.

Quite a lot for such a small amount of code, huh? :)


Structure
---------

Sealious is not strictly MVC, MVCC, MVW or anything along those lines. It's coded with a slightly different paradigm in mind. Let us explain.

Every Sealious application consists of *chips*. Chips are small pieces of functionality, coded in JavaScript (you can think of them as of *tiny classes*, if you **really** have to). Each chip has its name, and `type`. Available *chip types* are predefined and determine when the functionality of a chip is used and what methods should that chip implement.

Currently there are **5** chip types in Sealious:
  * `access_strategy` - it consumes a [context](#todo_context) and decides whether an arbitraty action can be performed on an arbitrary resource. **Example**: `public` - accepts any context.
  * `channel` - takes any input it wants to (keyboard, http request, open socket, anything) and is tasked with translating it to Sealious resource method calls. It's responsibility is to deduce which user is responsible for each input and provide Sealious with a context, so `access_strategy` can make a good use of it. **Example**: `rest` - translates HTTP requests to CRUD operations.
  * `datastore` - it's responsibility is, you guessed it, data storage. When bootstrapping, Sealious will tell the datastore what is the schema of the application. The datastore has to translate that information into a *database* schema. Sealious comes with a mongoDB datastore, but there's no stopping you from creating a datastore for any other driver (MySQL is on it's way) :) **Example**: `mongodb` - translates Sealious schema into mongodb collections.
  * `resource_type` - is a description of a part of the application's schema. It contains *fields*. Every such field is of a certain *`field_type`* (described below). Resource type uses access strategies to describe who and in what circumstances, can perform CRUD operations on a given resource instance. **Example**: `shopping_cart_entry` - contains fields such as `product_id` (of field_type "reference"), or `product_name` (of field_type "text"). Also, it uses access_strategy `public` so each entry is visible only by the user who created it.
  * `field-type` - it's something big, responsible for something very small. As it's name suggests, it describes a *type* of a *field*. Many *fields* can be of the same *field type* (although they might use different field type parameters - see docs). It seems minor, but does quite a bit of heavy lifting, namely it:
	- decides whether a value provided by the user is a valid value (by implementing `is_proper_value` method)
	- is responsible for *encoding* a value before storing it in database. For example, a "color" field type might receive a value "red" (which is accepted by `is_proper_value`), but store it in database as `#ff0000`.
	- is responsible for *decoding* the value - a process opposite to the one decribed above.

    **Example**: "Color" field type. It only accepts strings that represent colors (in hex, hsl, rgb, or html name), but stores the colors in hex, so the database entries are uniform.

Plugins
-------

Sealious' functionality can be extended with plugins. Plugins can register new [chips](#todo-docs) with arbitrary functionality.

Existing Sealious plugins:
* [sealious-www-server](https://github.com/Sealious/sealious-www-server) - for serving static files and providing a REST-ful API.
