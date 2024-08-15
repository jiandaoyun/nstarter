TOKEN ?=

DOCKER_REGISTRY=

DOCS_IMG=nstarter-docs
DOCS_VERSION=1.0

docker-build:
	docker buildx build \
		--progress=plain \
		--file ci/Dockerfile \
		--target=compile ./

docker-release:
	docker buildx build \
		--file ci/Dockerfile \
		--target=release \
		--build-arg TOKEN="${TOKEN}" ./

docker-build-docs:
	docker buildx build \
		--progress=plain \
		--file ci/docs.Dockerfile \
		-t ${DOCS_IMG}:${DOCS_VERSION} \
		./

docker-push-docs:
	docker tag ${DOCS_IMG}:${DOCS_VERSION} ${DOCKER_REGISTRY}/${DOCS_IMG}:${DOCS_VERSION}
	docker tag ${DOCS_IMG}:${DOCS_VERSION} ${DOCKER_REGISTRY}/${DOCS_IMG}:latest
	docker push ${DOCKER_REGISTRY}/${DOCS_IMG}:${DOCS_VERSION}
	docker push ${DOCKER_REGISTRY}/${DOCS_IMG}:latest > digest.txt

clean:
	npm run clean

.PHONY: clean
