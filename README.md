# SHOP GIÀY NIKE CHÍNH HÃNG 2026 (ATELIER EDITION)

Website thương mại điện tử chuyên nghiệp trưng bày và bán 23 mẫu giày Nike chính hãng, tích hợp sàn xoay 3D tương tác 60fps, thanh toán quét mã VietQR tự động qua Techcombank và kiến trúc tách biệt hoàn toàn giữa **Frontend** và **Backend (REST API)**.

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
Shop giày nike/
├── backend/                      # MÃ NGUỒN BACKEND REST API (Node.js)
│   ├── server.js                 # API Server xử lý đơn hàng, healthcheck (Cổng 5000)
│   ├── orders.json               # Cơ sở dữ liệu lưu trữ đơn hàng
│   ├── package.json              # Quản lý script backend
│   ├── Dockerfile                # Dockerfile Node 20 Alpine cho Backend
│   └── .dockerignore             # File loại trừ Docker backend
│
├── frontend/                     # MÃ NGUỒN GIAO DIỆN KHÁCH HÀNG (UI)
│   ├── index.html                # Giao diện chính (Tailwind CSS, Không viền xám, 3D Hero)
│   ├── server.js                 # Máy chủ phục vụ file tĩnh UI (Cổng 8080)
│   ├── css/                      # Stylesheet tùy biến
│   ├── js/                       # Modular JavaScript (turntable, cart, modal, products, app)
│   ├── assets/shoes/             # 23 hình ảnh giày tách nền chuẩn 100% mũi hướng trái
│   ├── Dockerfile                # Dockerfile Nginx Alpine phục vụ Frontend
│   └── .dockerignore             # File loại trừ Docker frontend
│
├── docker-compose.yml            # Điều phối đồng thời cả Frontend và Backend qua Docker
├── MO_SHOP_NIKE.bat              # Script 1-click khởi chạy đồng thời cả 2 dịch vụ trên Windows
├── package.json                  # Root package quản trị chung
├── .gitignore                    # Cấu hình bỏ qua file rác khi đẩy lên Git
└── BAO_CAO_BAN_GIAO.md           # Báo cáo kỹ thuật chi tiết
```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Cách 1: Khởi động 1-Click trên Windows (Khuyên dùng)
* Nhấp đúp chuột vào file: **`MO_SHOP_NIKE.bat`**
* Hệ thống sẽ tự động:
  1. Khởi chạy **Backend API** tại: `http://localhost:5000`
  2. Khởi chạy **Frontend UI** tại: `http://localhost:8080`
  3. Tự động mở trình duyệt web lên trang mua sắm.

### Cách 2: Khởi động bằng Docker Compose
Khi bạn đã mở Docker Desktop, mở terminal tại thư mục gốc và chạy:
```bash
docker compose up -d --build
```
* **Frontend:** Truy cập tại `http://localhost:8080`
* **Backend API:** Truy cập tại `http://localhost:5000/api/health`
* **Dữ liệu đơn hàng:** Được gắn kết (volume mount) ra file `backend/orders.json` trên máy thật nên không bao giờ bị mất khi khởi động lại container.

---

## 💳 TÍCH HỢP THANH TOÁN VIETQR TECHCOMBANK
* **Ngân hàng:** Techcombank (TCB)
* **Số tài khoản:** `8678686688`
* **Chủ tài khoản:** TRAN DUC MANH
* **Cơ chế:** Khi khách bấm đặt hàng, hệ thống tự động vẽ mã VietQR Napas247 tương ứng với số tiền chính xác và mã đơn hàng duy nhất, hỗ trợ sao chép nhanh STK và in hóa đơn giao hàng.
