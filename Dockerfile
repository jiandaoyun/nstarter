FROM klakegg/hugo:0.93.2-ext-onbuild AS hugo

ENV HUGO_ENV_ARG=production
ENV HUGO_DIR=/src/site


FROM nginx:1.21.6-alpine
COPY --from=hugo /target /usr/share/nginx/html
