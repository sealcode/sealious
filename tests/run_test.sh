#/bin/bash

if hash mocha 2>/dev/null; then
    echo "mocha installed"
else
	echo "installing mocha"
	npm install -g mocha
fi

if hash should 2>/dev/null; then
    echo "should installed"
else
	echo "installing should"
	npm install -g should
fi

node tests/test.js	