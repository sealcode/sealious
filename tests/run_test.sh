#/bin/bash

 if hash jscoverage 2>/dev/null; then
    echo "true"
else
	echo "cloning jscoverage..."
    git clone https://github.com/visionmedia/node-jscoverage.git -q 	>&-
    echo "    done!"
    cd node-jscoverage/ >&-
    echo "configuring jscoverage..."
    ./configure >&-
    echo "    done!"
    echo "installing jscoverage...."
    ls -al
    make 
    sudo make install
    echo "    done!"
fi