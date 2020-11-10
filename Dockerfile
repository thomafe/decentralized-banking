FROM node:12
#Create app directory
WORKDIR /tmp/test/decentralized-banking-master
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN npm install express
CMD ["tsc"]
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "start.js 3000" ]
