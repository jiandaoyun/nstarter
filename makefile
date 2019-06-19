retract:
	npm unpublish --force

upload: build
	npm publish

.PHONY: retract upload
