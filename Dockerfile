FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN apk add --no-cache  chromium --repository=http://dl-cdn.alpinelinux.org/alpine/v3.10/main

RUN apk update && \
    apk upgrade

RUN apk add chromium && \
    apk add --no-cache bash

RUN chmod +x wait-for-it.sh

CMD ["npm", "run", "dev"]