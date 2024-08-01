.PHONY: build
build:
	docker build \
		--target=report \
		--progress=plain \
		--output type=local,dest=./ \
		.

TOKEN ?=
.PHONY: release
release:
	docker build --target=release --progress=plain \
		--build-arg TOKEN='${TOKEN}' \
		.
