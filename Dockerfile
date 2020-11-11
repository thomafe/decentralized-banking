FROM node:12
#Create app directory
WORKDIR /bankingAppDocker
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json /bankingAppDocker/

RUN npm install
RUN npm install typescript -g
# If you are building your code for production
# RUN npm ci --only=production
# Bundle app source
COPY . .

RUN tsc start.ts

EXPOSE 3000
CMD [ "node", "start.js" , "3000"]
