#!/usr/bin/env bash

docker-compose run --rm -u $UID app npm --loglevel warn "$@"
