#/bin/bash

if hash mocha 2>/dev/null; then
    echo "mocha installed"
else
	echo "installing mocha"
	npm install --silent -g mocha
fi

if hash should 2>/dev/null; then
    echo "should installed"
else
	echo "installing should"
	npm install --silent -g should
fi

if hash blanket 2>/dev/null; then
    echo "blanket installed"
else
	echo "installing blanket"
	npm install --silent -g blanket
fi

node tests/test.js	