FROM node:12

# Create app directory
RUN mkdir -p /usr/src
WORKDIR /usr/src

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

ENV PATH /usr/src/node_modules/.bin:$PATH

# Bundle app source
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . ./

EXPOSE 8080

ENTRYPOINT [ "npm" , "run" ]

CMD [ "prod" ]