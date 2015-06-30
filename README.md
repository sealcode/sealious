Sealious 
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
        {name: "last-name", type: "text", required: false}       
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
* the web server will publish a REST-ful API, with access strategies reflecting those described in the `access_strategy` attribute. The REST-ful API is standards-compliant and is 100% automatically generated - there's no developer involvement needed.