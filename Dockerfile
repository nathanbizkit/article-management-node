# build stage
FROM node:22-alpine AS builder

WORKDIR /builder

ADD package*.json /builder
RUN npm install

ADD . /builder
RUN npm run build

# final stage
FROM node:22-alpine

ADD package*.json .
RUN npm ci --only=production

COPY --from=builder /builder/dist /dist

EXPOSE 8000
EXPOSE 8443

CMD [ "node", "/dist/app.js" ]