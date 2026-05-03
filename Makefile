.PHONY: dev build start clean install

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

clean:
	rm -rf dist
	rm -rf /tmp/smartvex

setup:
	chmod +x setup.sh
	./setup.sh
