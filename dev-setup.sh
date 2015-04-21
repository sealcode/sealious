#!/bin/bash
mkdir Sealious-dev
cd Sealious-dev
git clone https://github.com/Sealious/Sealious.git
git clone https://github.com/Sealious/sealious-base-chips
git clone https://github.com/Sealious/sealious-example-app
cd sealious-base-chips
git checkout dev
npm install .
npm link .
cd ../Sealious
git checkout dev
npm link sealious-base-chips
npm install .
npm link .
cd ../sealious-example-app
npm link sealious
npm install
