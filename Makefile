install:
	npm prune
	npm install

build: install
	npm run build

lint: 
	npm run lint

test: build
	npm run test

upload: 
	npm publish

clean:
	rm -rf node_modules dist coverage

.PHONY: install build test lint upload clean
