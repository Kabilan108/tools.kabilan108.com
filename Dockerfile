FROM oven/bun:latest
WORKDIR /app
COPY package.json ./
COPY bun.lockb ./
RUN bun install
RUN mkdir -p /data
COPY . .
EXPOSE ${PORT:-3000}
CMD ["bun", "main.js"]
