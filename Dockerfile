FROM node:16-alpine3.14 AS builder

WORKDIR /app

COPY ./package.json .
COPY ./yarn.lock .
COPY tsconfig*.json ./
# needed for direct git+ deps in package.json
RUN apk add git
RUN apk add yarn --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community

RUN yarn
COPY src src
RUN yarn build

# Final stage
FROM node:16-alpine3.14

# APP 
RUN apk add git
RUN apk add yarn --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community
RUN apt add dumb-init


WORKDIR /app

COPY --from=builder /app/build build
COPY ./package.json .
COPY ./yarn.lock .

RUN yarn --production

CMD ["dumb-init", "node", "build/index.js"]
