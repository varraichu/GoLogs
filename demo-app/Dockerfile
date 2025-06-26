FROM node:20-alpine

WORKDIR /demo-app/src

COPY package*.json ./

RUN npm install

COPY . .

RUN npx tsc

CMD [ "node", "index.js" ]