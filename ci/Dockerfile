# syntax=docker/dockerfile:1.7-labs
ARG NODE_IMAGE=node:20.16.0-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

ENV HTTPS_PROXY=socks5://172.24.64.31:1080

COPY .npmrc package.json nx.json ./
COPY --parents packages/*/package.json tools/*/package.json development/*/package.json ci/toolbox/*/package.json */package.json ./
RUN npm install

# 编译
FROM build-env as compile

ENV CI=build
COPY . .

RUN npm install     # 建立 workspace 关系

RUN npm run build && \
    npm run eslint && \
    npm run test

# 发布
FROM compile as release
ARG TOKEN

RUN npm config set registry "https://registry.npmjs.org" && \
    echo //registry.npmjs.org/:_authToken=${TOKEN} >> ./.npmrc && \
    npm whoami && \
    npm run upload \
