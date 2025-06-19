FROM oven/bun:latest
WORKDIR /app
COPY package.json ./
COPY bun.lock ./
RUN bun install
RUN mkdir -p /data
COPY . .
EXPOSE ${PORT:-3000}
CMD ["bun", "main.js"]
