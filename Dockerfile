ARG NODE_IMAGE=node:14.18.1-alpine

# 发布
FROM ${NODE_IMAGE} as release
RUN npm publish