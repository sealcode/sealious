#/bin/bash

 if hash jscoverage 2>/dev/null; then
    echo "true"
else
    git clone https://github.com/visionmedia/node-jscoverage.git
    cd node-jscoverage/
    ./configure
    make && sudo make install
fi