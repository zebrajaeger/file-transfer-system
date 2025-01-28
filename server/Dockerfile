FROM node:18-alpine
WORKDIR /app
RUN npm i -g pnpm
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install
COPY *.js ./
EXPOSE 3000
CMD ["node", "index.js"]
