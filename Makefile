.PHONY: build
build:
	docker build \
		--target=export \
		--progress=plain \
		--output type=local,dest=./ \
		.

TOKEN ?=
.PHONY: release
release:
	docker build --target=release --progress=plain \
		--build-arg REGISTRY='https://registry.npmjs.org/:_authToken=${TOKEN}' \
		.
