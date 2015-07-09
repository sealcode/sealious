#!/bin/bash

mkdir Sealious
git clone https://github.com/Sealious/Sealious.git
git clone https://github.com/Sealious/sealious-www-server
git clone https://github.com/Sealious/sealious-example-app
cd sealious-www-server
npm install
npm link .
cd ../sealious
npm install 
npm link .
cd ../sealious-example-app
npm link sealious
npm link sealious-www-server
npm install