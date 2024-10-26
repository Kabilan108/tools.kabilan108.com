FROM oven/bun:latest
WORKDIR /app
COPY package.json ./
COPY bun.lockb ./
RUN bun install
COPY . .
EXPOSE ${PORT:-3000}
CMD ["bun", "server.js"]
