FROM node:16-alpine3.14 AS appbuild

WORKDIR /app


COPY ./package.json .
COPY ./yarn.lock .

RUN apk add git
RUN apk add yarn --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community

RUN yarn

COPY ./src .
COPY ./tsconfig.json .

CMD yarn start:dev:watch