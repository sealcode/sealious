mkdir Sealious
git clone https://github.com/Sealious/Sealious.git
git clone https://github.com/Sealious/sealious-base-chips
git clone https://github.com/Sealious/sealious-example-app
npm install sealious-base-chips
cd sealious-base-chips
npm link .
cd ../Sealious
npm link sealious-base-chips
npm install .
npm link .
cd ../sealious-example-app
npm link sealious
npm install
