# Sử dụng Nginx Alpine siêu nhẹ phục vụ giao diện tĩnh Frontend
FROM nginx:alpine

# Sao chép toàn bộ mã nguồn Frontend vào thư mục HTML của Nginx
COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

