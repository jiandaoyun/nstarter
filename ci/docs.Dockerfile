# syntax=docker/dockerfile:1.7-labs
ARG NODE_IMAGE=node:20.16.0-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

ENV HTTPS_PROXY=socks5://172.24.64.31:1080

COPY ./docs/package.json ./docs/
RUN cd docs && npm install


# 构建
FROM build-env as build

COPY ./docs ./docs
RUN cd docs && \
    npm run build


# 运行时
FROM nginx:1.27.0-alpine
COPY --from=build /var/opt/build/docs/build /usr/share/nginx/html
