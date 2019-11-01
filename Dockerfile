FROM node:latest AS build
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN npm install && npm install -g gulp && ./node_modules/.bin/gulp


FROM nginx:latest
LABEL maintainer="Zyven Zhao"
WORKDIR /usr/share/nginx/html
COPY --from=build /app/* .