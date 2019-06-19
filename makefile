retract:
	npm unpublish --force

upload:
	npm publish

.PHONY: retract upload
