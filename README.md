[![Sealious Logo](https://cldup.com/ggbys1XotB.png)](http://sealious.github.io/)

# Sealious

Sealious is a declarative node.js framework


**For an easy-to-follow introduction (so far only in Polish), see the [Getting Started Guide](https://github.com/sealcode/sealious/blob/alpha/getting_started/getting_started.md)**.

## The App class

This is the class that holds all the logic and configuration of your, well, app ;)

The basic constructor is:

```js
const newApp = new Sealious.App(config, manifest);
```

`config` and `manifest` both influence how the app will be set up.

### `config`

`config` is considered secret, and contains information on the infrastructure, as well as SMTP passwords and the like.

It's best to be kept in a separate json/yml file, and imported with

```js
const config = require("./config.json");
```

in your app.

The default config is:

```json
{
    "core": {
        "environment": "dev"
    },
    "logger": {
        "level": "info",
        "color": true,
        "file": null,
        "dirname": ".",
        "to_json": false,
        "rotation": ".yyyy-MM-Tdd"
    },
    "www-server": {
        "port": 8080,
        "api-base": "/api/v1",
        "session-cookie-name": "sealious-session",
        "anonymous-cookie-name": "sealious-anon",
        "max-payload-bytes": 10485760
    },
    "datastore_mongo": {
        "embedded": false,
        "host": "localhost",
        "port": 27017,
        "db_name": "sealious"
    }
}
```

### `manifest`

`manifest` is public, and can be safely `require`d by a front-end script. It contains information on branding and version of your app. It must include the following fields:

-   `name` (string) - the name of your app
-   `logo` (string) - path to an image with the logo of your app
-   `version` (string) - the version of your app
-   `colors.primary` (string) - the primary color of your brand
-   `default_language` (string) - the default language for your app. Email templates use this
-   `admin_email` (string) - the email address of the admin. It might be publicly revealed within the app. Used to create the initial admin account. Whenever the app starts and there's no user with that email, a registration intent is created, causing an email to be sent to this address.

You can also include your own fields/values, so they can be easily shared across different modules on both back-end and front-end.

## Configuring your app

Every Sealious application has an `App.ConfigManager` interface through which you can configure settings available throughout all the various components of your application. It comes with some sane defaults.

### Changing the app settings

To run the app with specific settings, use an argument to `app.run` method:

```
const myApp = new Sealious.App();
myApp.run({http: {port: 8070}}, manifest);
```

Alternatively, you can use the `ConfigManager.set` method - which is especially useful when you want to use the dot notation to change just a single value:

```
const myApp = new Sealious.App();
myApp.ConfigManager.set("http.port", 8070);
```

### Default values

If you're creating your own Sealious module and want to make it globally configurable, use the `.setDefault` to set the default value for your setting.

NOTE: Sometimes it's better to just parametrize your module so it can be used multiple times with different configuration. ConfigManager is only useful for app-wide configurations.

```
app.setDefault("my-module", {port: 8080});
```

You can also use dot notation when setting single field values:

```
app.setDefault("my-module.port", 8080);
```

## Sending emails

This synopsis is self-explanatory:

```js
const message = await TestApp.EmailTemplates.Simple(TestApp, {
    to: "test@example.com",
    subject: "Congratulations!",
    text: "Enlarge your 'seal' with herbal supplements",
});
await message.send(TestApp);
```

To send emails via smtp, set the following config:

```js
email: {
  from_name: "Sealious app",
  from_address: "sealious@example.com",
},
```

## Filtering resources

When reading a list of resources in a collection, you can use _filtering_ to limit the list to resources that match certain criteria.

Let's say you have a Users collection with an additional "age" field. Now, to get all the users with age set to `42`, you can call:

```
app.run_action(context, ["collections", "users"], "show", {
  filter: { age: 42 },
});
```

or, via http:

```
GET /api/v1/collections/users?filter[age]=42
```

Some field-types support advanced filters. `int`, for example, lets you define a range of numbers like so:

```
app.run_action(context, ["collections", "users"], "show", {
  filter: { age: { ">": 50 } },
});
```

Or, via HTTP:

```
GET /api/v1/collections/users?filter[age][>]=50
```

The above requests would return only those users with age set to above 50.

You can specify multiple filtering parameters:

```
app.run_action(context, ["collections", "users"], "show", {
  filter: { age: { ">": 50 }, country: "Poland" },
});
```

```
GET /api/v1/collections/users?filter[age][>]=50&filter[country]=Poland
```

### Implementation

Each field can implement its own filtering logic, by the means of the `filter_to_query` method. It's goal is to transform user input (like `{">": 52}`) into a Mongo `$match` operator (like `{$gt: 52}`). It should be an `async` function.

## AND and OR access strategy optimization

Sealious communicates with mongo using mainly MongoDB Pipelines, which are represented as arrays of stages. Two main pipeline stages are `lookups` and `matches` (equivalents of SQL `joins` and `wheres`). Lookups are quite expensive in comparison to matches; thus, we would like to do them as lately as possible. However, we cannot just place them in the end because some matches can be dependent on some lookups, as they use fields fetched by lookups. In addition, some lookups can also be done only after another lookup(s) takes place. Hence, we have to build a dependency graph and run a kind of priority-first search algorithm on it.

The construction of dependency graph is straightforward. Firstly, a new node, which is an equivalent of a single pipeline stage, is just inserted to the graph as a seperate node. If it represents `match` and queries more than one field, it will be split. For instance:

```
{
  $match: {
    weight: {$gt: 200},
    date_of_birth: {$lt : ISODate("2005-01-01T00:00:00Z")},
  }
}
```

will create two seperate nodes. The split is done because of optimization reasons - some fields within single `match` may be dependent on other nodes, while other are dependency free. Then, if node has dependencies an edge from the direct dependency is added. Note that it is enough because any additional dependencies are also undoubtly parents for the direct dependency (it simply means that a field required a few lookups to access it).

The order of visiting the nodes depends on two sets: the _front_, denoted by _F_, and the _candidates_, denoted by _C_. _F_ embraces the nodes, which have already been visited, but at least one of their children is still to be visited. To simplify the notation we can distinguish dummy node _Ø_, which is a parent to orphans. Consequently, _C_ embraces all direct children of nodes in _F_. Thus, while traversing the graph we evaluate next step from the perspective of the whole front instead of single node.

Let's run our algorithm on a simple example.

<pre>
<b>1.</b>                                            <b>2.</b>
 +-------Ø--------+                            +-------Ø--------+
 |       |        |                            |       |        |
 |       |        |                            |       |        |
 v       v        v                            v       v        v
L1       M3* +----L4----+                     L1*      M3  +----L4----+
 +           |          |                      +           |          |
 |           |          |                      |           |          |
 v           v          v                      v           v          v
M2           L5        M6                     M2           L5        M6
                        +                                             +
                        |                                             |
                        v                                             v
                       M7                                            M7
<em>F</em>: <em>Ø</em>                                           <em>F</em>: <em>Ø</em>
<em>C</em>: <em>L1 M3 L4</em>                                    <em>C</em>: <em>L1 L4</em>
</pre>

For the first two steps _F_ only embraces our dummy node. First visitee is obviously `M3`, as matches have the highest priority. It doesn't become a part of front because it has no children. The second visitee is determined by calculating the additional fitness measure which is average priority of children of each candidate. The fitness of single match is definetely better than the average of lookup and match, so `L1` is our choice.

<pre>
<b>3.</b>                                            <b>4.</b>
 +-------Ø--------+                            +-------Ø--------+
 |       |        |                            |       |        |
 |       |        |                            |       |        |
 v       v        v                            v       v        v
L1       M3  +----L4----+                     L1       M3  +----L4*---+
 +           |          |                      +           |          |
 |           |          |                      |           |          |
 v           v          v                      v           v          v
M2*          L5        M6                     M2           L5        M6
                        +                                             +
                        |                                             |
                        v                                             v
                       M7                                            M7
<em>F</em>: <em>Ø L1</em>                                        <em>F</em>: <em>Ø</em>
<em>C</em>: <em>M2 L4</em>                                       <em>C</em>: <em>L4</em>
</pre>

Again, steps 3 and 4 are not complicated. `M2` is picked up first and then it's time for `L4`.

<pre>
<b>5.</b>                                            <b>6.</b>
 +-------Ø--------+                            +-------Ø--------+
 |       |        |                            |       |        |
 |       |        |                            |       |        |
 v       v        v                            v       v        v
L1       M3  +----L4----+                     L1       M3  +----L4----+
 +           |          |                      +           |          |
 |           |          |                      |           |          |
 v           v          v                      v           v          v
M2           L5        M6*                    M2           L5        M6
                        +                                             +
                        |                                             |
                        v                                             v
                       M7                                            M7*
<em>F</em>: <em>L4</em>                                        <em>F</em>: <em>L4 M6</em>
<em>C</em>: <em>L5 M6</em>                                       <em>C</em>: <em>L5 M7</em>
</pre>

At last _Ø_ leaves _F_. The front moves down the right subtree of `L4`.

<pre>
<b>7.</b>
 +-------Ø--------+
 |       |        |
 |       |        |
 v       v        v
L1       M3  +----L4----+
 +           |          |
 |           |          |
 v           v          v
M2           L5*       M6
                        +
                        |
                        v
                       M7
<em>F</em>:
<em>C</em>: <em>L5</em>
</pre>

The only node left in candidates is `L5`, so algorithm picks it up. We traversed the whole graph, so that's it.

## Query class

Whenever possible we try to use `Query` class instead of raw MongoDB queries. The following classes extend `Query` class (their names are rather self-explanatory):

-   `Query.And`
-   `Query.Or`
-   `Query.Not`
-   `Query.DenyAll`
-   `Query.AllowAll`

Every class which belongs to `Query` group has to expose the functions below. The usage examples can be find in `lib/datastore/query.test.js`.

### `lookup(body)`

Adds lookup to the query.

Returns hexadecimal hash of passed lookup.

### `match(body)`

Adds match to the query.

### `dump()`

Usually other queries are supplied with its return value. It is rather used internally by classes implementing `Query`.

Returns the inner representation of the query.

### `toPipeline()`

Returns the MongoDB aggregation pipeline.

### `fromSingleMatch(body)`

Returns the query object on which `match(body)` has been called.

### `fromCustomPipeline(pipeline)`

Returns the query object equivalent to the given pipeline.

---

Classes that implement operators requiring multiple subqueries expose also the following:

### `addQuery(query)`

Adds argument as the another parameter of the operator connected with base query (`and`, `or`, etc.)

## Attachements

### Overview

Attachments were introduced to reduce the size of the API response. For instance, instead of assigning referenced documents to appropriate field, we leave an id there and we create an id-to-document map placed in other branch of the API response. Assuming that collection `seals` references collection `water_areas`, let's exemplify this:

Before implementing attachments:

```
[
  {
    "_id": "seals_id1",
    "name": "Hoover",
    "water_area": {
      "_id": "water_areas_id1",
      "name": "Arabic Sea",
      "average_temp": "24"
    },
  },
  {
    "_id": "seals_id2",
    "name": "Nelly",
    "water_area": {
      "_id": "water_areas_id2",
      "name": "Baltic Sea",
      "average_temp": "12"
    }
  },
  {
    "_id": "seals_id3",
    "name": "Maksiu",
    "water_area": {
      "_id": "water_areas_id2",
      "name": "Baltic Sea",
      "average_temp": "12"
    }
  }
]
```

After implementing attachments collections are queried using the following scheme:

`GET /api/v1/collections/seals?attachments[water_area]=true`

```
{
  "attachments": {
    "water_areas_id1": {
      "_id": "water_areas_id1",
      "name": "Arabic Sea",
      "average_temp": "24"
    },
    "water_areas_id2": {
      "_id": "water_areas_id2",
      "name": "Baltic Sea",
      "average_temp": "12"
    }
  },
  "items": [
    {
      "_id": "seals_id1",
      "name": "Hoover",
      "water_area": "water_areas_id1"
    },
    {
      "_id": "seals_id2",
      "name": "Nelly",
      "water_area": "water_areas_id2"
    },
    {
      "_id": "seals_id3",
      "name": "Maksiu",
      "water_area": "water_areas_id2"
    }
  ],
  "fieldsWithAttachments": {
    "water_area": {}
  }
}
```

Imagine a collection of 10 000 seals from only 3 water areas. Solution based on attachments outweighs the old model for such cases, it is also easier to optimize query performance for that.

### Building response containing attachments

We wrap every field corresponding to an attachment in abstraction. The wrapper is actually a factory method which returns an appropriate class which replaces the current field value. The class has a dual nature - it pretends being a raw value, but it also exposes, like a plain object, props provided by attachment. If some nested attachments are queried, the wrapper will be called recursively. This feature works in both backend and frontend. So, having the above data we would reference to `average_temp` as the following (the example concerns quering collection - it's very similar for `SingleItemResponse`):

```
const axios = require("axios");
const CollectionResponse = require("sealious/common_lib/response/collection-response.js");

const http_response = await axios.get(
  `/api/v1/collections/seals`,
  {
    filter: {},
    format: {},
    attachments: {water_area: true},
  }
);

const response = new CollectionResponse(http_response);
console.log(response.items[0].area_type.average_temp);
# outputs 12
```
