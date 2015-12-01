#!/bin/sh

(git clone https://github.com/Sealious/sealious.git) &
(git clone https://github.com/Sealious/sealious-www-server.git) &
(git clone https://github.com/Sealious/sealious-channel-rest.git) &

wait

(
        cd sealious;
        git checkout next;
        npm install && sudo npm link &&

        cd ../sealious-www-server;

        npm install;
        npm link sealious;
        sudo npm link;

        cd ../sealious-channel-rest;

        npm install;
        npm link sealious;
        npm link sealious-www-server;
        sudo npm link;
) &
(git clone  https://github.com/Sealious/hello-world.git)&


wait;

cd hello-world
npm link sealious;
npm link sealious-www-server;
npm link sealious-channel-rest;

