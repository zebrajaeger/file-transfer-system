FROM node:18-alpine
WORKDIR /app
RUN npm i -g pnpm
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install
RUN mkdir -p /app/src
COPY ./src/ /app/src/
EXPOSE 3000
CMD ["node", "./src/server.js"]
