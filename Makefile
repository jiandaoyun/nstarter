VERSION=1.0
DOCKER_IMG=nstarter-docs
DOCKER_REGISTRY=

preview:
	hugo server --minify --theme hugo-book --source ./site

docker-build:
	docker build ./ -t ${DOCKER_IMG}:${VERSION}

docker-push:
	docker tag ${DOCKER_IMG}:${VERSION} ${DOCKER_REGISTRY}/${DOCKER_IMG}:${VERSION}
	docker tag ${DOCKER_IMG}:${VERSION} ${DOCKER_REGISTRY}/${DOCKER_IMG}:latest
	docker push ${DOCKER_REGISTRY}/${DOCKER_IMG}:${VERSION}
	docker push ${DOCKER_REGISTRY}/${DOCKER_IMG}:latest
