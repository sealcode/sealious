#!/usr/bin/env bash

docker-compose run --rm -u $UID test npm --loglevel warn "$@"
