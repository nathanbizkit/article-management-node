# build stage
FROM node:22-alpine AS builder

WORKDIR /builder

COPY package*.json ./
RUN npm ci

COPY . /builder/
RUN npm run build

# final stage
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /builder/dist .

RUN ls -la

EXPOSE 8000
EXPOSE 8443

CMD [ "node", "app.js" ]