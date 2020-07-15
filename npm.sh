#!/usr/bin/env sh

docker-compose run --rm --service-ports  -u $UID test npm --loglevel warn "$@"
