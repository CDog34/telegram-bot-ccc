FROM node:13-alpine3.10

# Create app directory
WORKDIR /data/app

COPY . .

RUN npm install && npm run build

CMD [ "node", "./dist/app.js" ]
