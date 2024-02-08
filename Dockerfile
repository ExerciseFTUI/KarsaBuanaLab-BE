FROM node:alpine

RUN mkdir -p /home/node/app/node_modules && \
    chown -R node:node /home/node/app && \
    mkdir /home/node/app/uploads && \
    chown -R node:node /home/node/app/uploads

WORKDIR /home/node/app
USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .

EXPOSE 5000
CMD [ "node", "index.js" ]
