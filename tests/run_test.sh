#/bin/bash

if hash mocha 2>/dev/null; then
    echo "mocha installed"
else
	echo "installing mocha"
	npm install -g mocha
fi

node tests/test.js	