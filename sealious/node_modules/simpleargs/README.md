# SimpleArgs

Simple Command Line Arguments process, for Node.js.

## Installation

Via npm on Node:

```
npm install simpleargs
```

Reference in your program:

```js
var simpleargs = require('simpleargs');
```

## Usage


```js
var argv = simpleargs(process.argv.slice(2));
console.dir(argv);
```

Invoking the above example
```
node example.js -p 3000 -host localhost
{ p: 3000, host: 'localhost' }
```

Any additional argument without associated option goes to the `_` array property:
```
node example.js -p 3000 -host localhost hello world
{ p: 3000, host: 'localhost', _: ['hello', 'world'] }
```

You can define options with short name, name, default value and description
```js
simpleargs.define('p','port',3000,'Port number')
    .define('h','host','localhost', 'Host name/address')

// if you call the program
// node hello.js Hello world -p 4000 --host 'mydomain'        
var options = simpleargs(process.argv.slice(2));
// then options is { _: ['Hello', 'world'], port: 4000, host: 'mydomain' }
```

## Development

```
git clone git://github.com/ajlopez/SimpleArgs.git
cd SimpleArgs
npm install
npm test
```

## Samples

TBD

## To do

- Invalid parameters
- Show usage

## Versions

- 0.0.1: Published
- 0.0.2: Published. Inspired by [minimist](https://github.com/substack/minimist).

## Contribution

Feel free to [file issues](https://github.com/ajlopez/SimpleArgs) and submit
[pull requests](https://github.com/ajlopez/SimpleArgs/pulls) — contributions are
welcome.

If you submit a pull request, please be sure to add or update corresponding
test cases, and ensure that `npm test` continues to pass.

(Thanks to [JSON5](https://github.com/aseemk/json5) by [aseemk](https://github.com/aseemk). 
This file is based on that project README.md).