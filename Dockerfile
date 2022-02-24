ARG NODE_IMAGE=node:14.18.1-alpine

# 基础构建环境
FROM ${NODE_IMAGE} as build-env
WORKDIR /var/opt/build

COPY . .
RUN npm install

# 编译
FROM build-env as compile
RUN npm run build

# 单元测试
FROM compile as test
RUN npm run eslint:html \
    && npm run test

# 输出报告
FROM scratch as test-report
COPY --from=test /var/opt/build/lint/ /lint
COPY --from=test /var/opt/build/coverage/ /coverage

# 发布
FROM compile as release
RUN npm publish