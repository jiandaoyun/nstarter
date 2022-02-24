ARG NODE_IMAGE=node:14.18.1-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

COPY . .
RUN npm install

# 编译
FROM build-env as compile

RUN npm run eslint:html \
    && npm run build

# 输出报告
FROM scratch as test-report
COPY --from=compile /var/opt/build/lint/ /lint

# 发布
FROM compile as release
RUN npm publish