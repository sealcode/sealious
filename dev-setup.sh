#!/bin/sh

(git clone --depth 100 https://github.com/Sealious/Sealious.git) &
(git clone https://github.com/Sealious/sealious-www-server.git) &
(git clone https://github.com/Sealious/sealious-channel-rest.git) &

wait

(
        cd Sealious;
        npm install && npm link;

        cd ../sealious-www-server;

        npm install;
        npm link sealious;
        npm link;

        cd ../sealious-channel-rest;

        npm install;
        npm link sealious;
        npm link sealious-www-server;
        npm link;
) &
(git clone  https://github.com/Sealious/hello-world.git)&


wait;

cd hello-world
npm link sealious;
npm link sealious-www-server;
npm link sealious-channel-rest;

