#!/bin/sh

# Original nvm_tree_contains_path() and nvm_ls_current() functions are
# available in Node Version Manager's source code at:
# https://github.com/creationix/nvm
# nvm_ls_current() is slightly changed, so it won't bother us about IO JS.

nvm_tree_contains_path() {
  local tree
  tree="$1"
  local node_path
  node_path="$2"

  if [ "@$tree@" = "@@" ] || [ "@$node_path@" = "@@" ]; then
    >&2 echo "both the tree and the node path are required"
    return 2
  fi

  local pathdir
  pathdir=$(dirname "$node_path")
  while [ "$pathdir" != "" ] && [ "$pathdir" != "." ] && [ "$pathdir" != "/" ] && [ "$pathdir" != "$tree" ]; do
    pathdir=$(dirname "$pathdir")
  done
  [ "$pathdir" = "$tree" ]
}

nvm_ls_current() {
  local NVM_LS_CURRENT_NODE_PATH
  NVM_LS_CURRENT_NODE_PATH="$(command which node 2> /dev/null)"
  if [ $? -ne 0 ]; then
    echo 'none'
  elif nvm_tree_contains_path "$NVM_DIR" "$NVM_LS_CURRENT_NODE_PATH"; then
    local VERSION
    VERSION="$(node --version 2>/dev/null)"
    if [ "$VERSION" = "v0.6.21-pre" ]; then
      echo "v0.6.21"
    else
      echo "$VERSION"
    fi
  else
    echo 'system'
  fi
}

case "`nvm_ls_current`" in
"system")
    sudo='sudo'
    ;;
"none")
    echo "Could not find NodeJS. Aborting setup."
    exit
    ;;
esac

(git clone https://github.com/Sealious/sealious.git) &
(git clone https://github.com/Sealious/sealious-www-server.git) &
(git clone https://github.com/Sealious/sealious-channel-rest.git) &

wait

(
    cd sealious
    git checkout next
    npm install
    npm link sealious
    $sudo npm link
    git remote set-url origin ssh://git@github.com/Sealious/sealious

    cd ../sealious-www-server
    npm install
    npm link sealious
    $sudo npm link
    git remote set-url origin ssh://git@github.com/Sealious/sealious-www-server

    cd ../sealious-channel-rest
    npm install
    npm link sealious
    npm link sealious-www-server
    $sudo npm link
    git remote set-url origin ssh://git@github.com/Sealious/sealious-channel-rest
) &
(git clone  https://github.com/Sealious/hello-world.git) &

wait

cd hello-world
npm link sealious
npm link sealious-www-server
npm link sealious-channel-rest
git remote set-url origin ssh://git@github.com/Sealious/hello-world
