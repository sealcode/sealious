#!/usr/bin/env sh

docker-compose run --rm --service-ports test npm --loglevel warn "$@"
