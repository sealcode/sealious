#/bin/bash

if hash mocha 2>/dev/null; then
    echo "mocha installed"
else
	echo "installing mocha"
	sudo npm install -g mocha
fi

nodejs tests.js