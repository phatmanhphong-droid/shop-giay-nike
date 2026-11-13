# SHOP GIÀY NIKE — SNEAKER ATELIER 2026

Dự án website thương mại điện tử giới thiệu 23 mẫu giày Nike cao cấp với hiệu ứng xoay 3D (3D Turntable) và bộ lọc thông minh.

---

## 📁 Cấu Trúc Thư Mục (Chuẩn Frontend Tách Lớp Modular)

```
Shop giày nike/
├── frontend/                     # Toàn bộ mã nguồn giao diện người dùng
│   ├── index.html                # Trang HTML ngữ nghĩa
│   ├── css/
│   │   └── styles.css            # Stylesheet tùy biến (3D Turntable, bóng Studio, Scrollbar)
│   ├── js/
│   │   ├── products.js           # Dữ liệu 23 đôi giày: thông số, giá VNĐ, danh sách phối màu
│   │   ├── turntable.js          # Logic lăn chuột 60fps Lerp Momentum xoay 3D từ trái sang phải
│   │   ├── modal.js              # Popup xem nhanh (Quick View), chọn phối màu và chọn size
│   │   ├── cart.js               # Quản lý giỏ hàng, lưu trữ localStorage, drawer trượt
│   │   └── app.js                # Bộ điều phối chính: lọc danh mục, tìm kiếm trực tiếp, lưới sản phẩm
│   └── assets/
│       ├── logo/
│       │   └── nike.png          # Logo Nike chính hãng
│       └── shoes/                # 27 ảnh PNG thật 100%, tách nền trong suốt cho từng phối màu
│           ├── jordan1-chicago.png
│           ├── jordan1-royal.png
│           ├── jordan1-volt.png
│           ├── airforce1-white.png
│           ├── airforce1-black.png
│           ├── dunk-panda.png
│           ├── airmax90-infrared.png
│           ├── cortez-classic.png
│           ├── pegasus40-blue.png
│           ├── vaporfly-pink.png
│           ├── zoomfly3-lime.png
│           ├── superrep-volt.png
│           ├── alphatr3-black.png
│           ├── adaptbb-grey.png
│           ├── adaptbb-smart.png
│           ├── jordan4-cement.png
│           ├── sbdunk-emerald.png
│           ├── airmax270-green.png
│           ├── airmax720-blue.png
│           ├── lebron21-purple.png
│           ├── kd16-gold.png
│           ├── giannis-red.png
│           ├── airmax-tn.png
│           ├── infinityrun-white.png
│           ├── sneaker-black.png
│           ├── invincible3-racer.png
│           └── airmax-red.png
├── server.js                     # Máy chủ tĩnh Node.js phục vụ thư mục frontend (cổng 8080)
├── MO_SHOP_NIKE.bat              # Trình khởi động 1-click (chạy server & tự mở Chrome)
└── README.md                     # Tài liệu hướng dẫn này
```

---

## 🚀 Cách Chạy Website

### Cách 1: Bấm trực tiếp từ Desktop
- Nhấp đúp chuột vào biểu tượng **`Shop Giày Nike`** trên Desktop (địa chỉ `http://localhost:8080`).

### Cách 2: Khởi động qua file BAT
- Nhấp đúp chuột vào file **`MO_SHOP_NIKE.bat`** trong thư mục `Shop giày nike`.

### Cách 3: Chạy dòng lệnh (CLI)
```bash
node server.js
```
Truy cập trình duyệt: `http://localhost:8080`

