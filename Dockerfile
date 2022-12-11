FROM node:16-alpine

# WORKDIR /home/scorer-v2

COPY package.json ./

RUN npm i

COPY . .

RUN npm run build