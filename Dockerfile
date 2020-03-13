FROM hub.tuku.tech/node-pptr:85389ff

# Create app directory
WORKDIR /data/app

COPY . .

RUN npm install && npm run build

CMD [ "node", "./dist/app.js" ]
