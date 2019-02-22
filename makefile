build:
	npm run tslint
	npm run prestart

retract:
	npm unpublish --force

upload: build
	npm publish

.PHONY: retract upload
