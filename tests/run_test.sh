#/bin/bash

 if hash jscoverage 2>/dev/null; then
    echo "true"
else
	echo "cloning jscoverage..."
    git clone https://github.com/visionmedia/node-jscoverage.git &> /dev/null
    echo "    done!"
    cd node-jscoverage/ &> /dev/null
    echo "configuring jscoverage..."
    ./configure
    echo "    done!"
    echo "installing jscoverage...."
    make && sudo make install &> /dev/null
    echo "    done!"
fi