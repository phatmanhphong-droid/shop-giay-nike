# Sử dụng Node.js Alpine siêu nhẹ (< 150MB)
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package config
COPY package.json ./

# Copy mã nguồn backend
COPY server.js orders.json ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
