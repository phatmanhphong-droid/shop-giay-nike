# Sử dụng base image Node.js 20 Alpine siêu nhẹ (< 150MB)
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Khai báo biến môi trường
ENV NODE_ENV=production
ENV PORT=8080

# Sao chép cấu hình package
COPY package.json ./

# Sao chép mã nguồn backend và frontend
COPY server.js ./
COPY orders.json ./
COPY frontend/ ./frontend/

# Mở cổng 8080
EXPOSE 8080

# Kiểm tra sức khỏe container định kỳ (Health check)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Khởi chạy server
CMD ["node", "server.js"]
