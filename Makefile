.PHONY: db test test-nginx start test watch build install

db:
	docker-compose up -d db

start: db build test-nginx

stress-test:
	./npm.sh run stress-test

test:
	./npm.sh run test

watch:
	./npm.sh run watch

build:
	./npm.sh run build

install:
	./npm.sh ci
