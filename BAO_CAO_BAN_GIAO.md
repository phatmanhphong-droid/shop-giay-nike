# BÁO CÁO BÀN GIAO DỰ ÁN SHOP GIÀY NIKE (NIKE ATELIER 2026)

> **Dự án**: Website Shop Giày Nike Chính Hãng (Fullstack Node.js + VietQR + Admin Portal + Docker)  
> **Phiên bản**: 3.0 (Fullstack Production Ready)  
> **Địa chỉ Web Khách hàng (Frontend)**: http://localhost:8080  
> **Địa chỉ Cổng Quản Trị (Backend Admin)**: http://localhost:5000/admin  
> **GitHub Repository**: [https://github.com/phatmanhphong-droid/shop-giay-nike.git](https://github.com/phatmanhphong-droid/shop-giay-nike.git)  
> **Thư mục dự án**: `C:\Users\ASUS\Downloads\Shop giày nike`  
> **Công cụ khởi động 1 chạm**: `MO_SHOP_NIKE.bat`

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU HOÀN THÀNH

Dự án **Shop Giày Nike** đã được hoàn thiện toàn diện từ giao diện khách hàng cao cấp (Frontend) đến hệ thống quản trị, cơ sở dữ liệu và thanh toán tự động (Backend). Toàn bộ hệ thống được quy hoạch theo mô hình dịch vụ phân tách chuyên nghiệp, hỗ trợ chạy trực tiếp trên máy hoặc đóng gói Docker container.

### Các Giá Trị Trọng Tâm Đã Đạt Được:
1. **Giao diện Nike Atelier 60fps**: Sàn diễn xoay 3D (3D Turntable Runway) mượt mà bằng thuật toán vật lý Lerp, tương tác tự do nhấp chọn giày trực tiếp, hiển thị hình ảnh thật 100% đã tách nền trong suốt, đồng bộ 100% hướng mũi giày quay sang trái (Toe Left).
2. **Thanh toán VietQR Napas247 tự động**: Tích hợp thanh toán quét mã QR động chuẩn ngân hàng Techcombank (`8678686688` - TRAN DUC MANH). Khách quét mã là hệ thống tự điền đúng số tiền và mã đơn hàng, chốt đơn tức thì.
3. **Cổng Quản Trị Backend Admin Portal độc lập**: Quản lý đơn hàng, đổi trạng thái giao hàng, in hóa đơn, quản lý sản phẩm, thêm giày mới với tính năng tải ảnh trực tiếp, và **chỉnh sửa giá bán trực tiếp**.
4. **Đồng bộ thời gian thực (Real-time Auto Sync)**: Kết nối thông suốt giữa Frontend (port 8080) và Backend (port 5000) qua Reverse Proxy. Thay đổi giá hoặc thêm sản phẩm bên Admin sẽ tự động hiển thị ngay trên Web khách hàng sau vài giây mà không cần F5.
5. **Thiết kế tối giản & Gỡ bỏ tính năng so sánh rườm rà**: Đã loại bỏ hoàn toàn tính năng so sánh sản phẩm để giữ cho giao diện thanh lịch, sang trọng và tốc độ tải trang nhanh nhất.
6. **Đóng gói Docker & Lưu trữ GitHub**: Cấu hình sẵn `Dockerfile` cho Frontend/Backend, `docker-compose.yml` lưu trữ dữ liệu bền vững (volume mount), và đẩy toàn bộ mã nguồn lên GitHub.

---

## 2. CHI TIẾT CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI VÀ BÀN GIAO

### 2.1. Phía Khách Hàng (Frontend - Port 8080)
* **Sàn Diễn 3D Runway (3D Turntable Stage)**:
  * Lăn chuột mượt mà 60fps để xoay vòng sàn diễn trưng bày các mẫu giày biểu tượng.
  * Nhấp chuột trực tiếp vào bất kỳ đôi giày nào đang xoay để mở ngay khung thông tin chi tiết.
  * Cuộn mượt mà xuống danh mục sản phẩm bên dưới khi lướt hết sàn diễn.
  * Đã lược bỏ hoàn toàn các khung card thừa bên dưới chân sàn diễn, giữ không gian thoáng đãng chuẩn phong cách tối giản.
* **Lưới Sản Phẩm Động (Dynamic Catalog Grid)**:
  * Bộ lọc danh mục linh hoạt: Tự động nhận diện danh mục từ Backend (Jordan, Lifestyle, Running, Basketball, Air Max, Skateboarding...).
  * Thanh tìm kiếm trực tiếp: Tìm kiếm theo tên giày, dòng sản phẩm hoặc từ khóa mô tả.
  * Mỗi thẻ sản phẩm hiển thị ảnh thật, bảng đổi màu thực tế, tên, giá bán VNĐ, nút **"Chi tiết"** và nút **"Thêm vào giỏ" (+)**.
  * Bộ đếm số lượng mẫu giày trên thanh menu và tiêu đề danh mục tự động nhảy số theo dữ liệu thực tế từ Backend.
* **Cửa Sổ Xem Nhanh (Quick View Popup Modal)**:
  * Hiển thị hình ảnh kích thước lớn trên nền trắng tinh khiết sáng rõ.
  * Chọn màu sắc thực tế (đổi đúng ảnh thật của màu đó).
  * Chọn size giày chuẩn EU từ 38 đến 44.
  * Xem 4 thông số kỹ thuật chất liệu, đệm khí, độ bám.
  * Thêm vào giỏ hàng với thông báo Toast xác nhận nhanh.
* **Giỏ Hàng Trượt (Slide-out Cart Drawer)**:
  * Hiển thị danh sách mẫu giày đã chọn, hình ảnh, phân loại màu, size và số lượng.
  * Tăng / giảm số lượng sản phẩm, xóa từng món, tự động tính tổng tiền giỏ hàng.
  * Nút "Tiến Hành Thanh Toán" dẫn sang màn hình thanh toán VietQR.
* **Thanh Toán Tự Động Quét Mã VietQR (VietQR Checkout Modal)**:
  * Form điền thông tin người nhận: Họ và tên, Số điện thoại, Địa chỉ giao hàng, Ghi chú.
  * 2 phương thức thanh toán: **Quét mã VietQR (Napas247)** và **Thanh toán khi nhận hàng (COD)**.
  * Khi chọn VietQR: Tự động gọi API ngân hàng sinh ra **Mã QR Động chuẩn Napas247** chứa chính xác số tiền đơn hàng và mã nội dung chuyển khoản.
  * Cung cấp nút sao chép 1 chạm tiện lợi: Sao chép Số tài khoản (`8678686688`), Tên chủ thẻ (`TRAN DUC MANH`), Số tiền, và Nội dung chuyển khoản.
  * Xác nhận đơn hàng thành công, hiển thị màn hình chúc mừng và lưu đơn vào hệ thống Backend.

---

### 2.2. Phía Quản Trị Hệ Thống (Backend Admin Portal - Port 5000)
Địa chỉ truy cập: **`http://localhost:5000/admin`**

* **Quản Lý Đơn Hàng (Orders Management)**:
  * Thống kê tổng số đơn hàng, tổng doanh thu thực tế, số đơn đã thanh toán và số đơn đang chờ xử lý.
  * Bảng danh sách đơn hàng chi tiết: Mã đơn, Khách hàng, SĐT, Sản phẩm & Size, Tổng tiền, Phương thức thanh toán, Trạng thái, Ngày giờ đặt.
  * Thanh tìm kiếm đơn hàng nhanh theo tên khách, số điện thoại hoặc mã đơn.
  * Bộ lọc trạng thái: Tất cả, Chờ xác nhận, Đã thanh toán, Đang giao hàng, Hoàn thành, Đã hủy.
  * Cập nhật trạng thái đơn hàng chỉ bằng 1 thao tác chọn.
  * **Tính năng In Hóa Đơn Bán Hàng**: Xuất phiếu giao hàng chuyên nghiệp có logo Nike Atelier để đính kèm hộp giày khi gửi cho đơn vị vận chuyển.
* **Quản Lý Sản Phẩm (Products Management)**:
  * Bảng danh sách toàn bộ mẫu giày hiện có trong shop.
  * Hiển thị ảnh thumbnail, tên, dòng sản phẩm, danh mục, giá bán niêm yết, huy hiệu và số lượng màu sắc.
  * **Nút Chỉnh Sửa Giá Bán Trực Tiếp (Edit Price)**:
    * Có nút *"Sửa giá"* tại từng dòng sản phẩm và hỗ trợ nhấp trực tiếp vào cột giá.
    * Mở Modal chỉnh sửa giá hiện đại: ô nhập giá mới bằng số, tự động định dạng tiền tệ trực quan `... ₫`.
    * Các nút tính toán nhanh: `+100.000 ₫`, `+500.000 ₫`, `-100.000 ₫`, `Giảm 10%`, `Giảm 20%`.
    * Bấm nút *"Lưu Giá Mới"* (hoặc gõ Enter) là giá được cập nhật vào cơ sở dữ liệu `products.json` và đồng bộ tức thì sang Web khách hàng.
  * **Thêm Mẫu Giày Mới & Upload Ảnh Thật**:
    * Modal thêm sản phẩm trực quan: Tên giày, Dòng sản phẩm, Danh mục, Giá bán, Huy hiệu, Mô tả, 4 thông số kỹ thuật.
    * Khu vực tải ảnh: Chọn file ảnh JPG, PNG, WEBP từ máy tính, xem trước ảnh tức thì, tự động lưu file vào hệ thống và tạo đường dẫn chuẩn cho web.
  * **Xóa Sản Phẩm**: Nút xóa mẫu giày kèm hộp thoại xác nhận an toàn, tránh xóa nhầm.
* **Cấu Hình Tài Khoản Ngân Hàng VietQR (Bank Settings)**:
  * Tùy biến thông tin tài khoản thụ hưởng nhận tiền: Tên ngân hàng, Mã ngân hàng (Bin code), Số tài khoản, Tên chủ tài khoản.
  * Bấm *"Lưu Cấu Hình Ngân Hàng"* là toàn bộ mã QR của khách trên Web sẽ tự động cập nhật sang tài khoản mới mà không cần can thiệp code.
* **Giám Sát Hệ Thống (System Health Check)**:
  * Đo lường thời gian hoạt động liên tục (Uptime), trạng thái kết nối máy chủ, cổng mạng và kiểm tra tính toàn vẹn của dữ liệu JSON.

---

### 2.3. Cơ Chế Kết Nối & Đồng Bộ Thời Gian Thực (Architecture & Sync)
* **Mô Hình Phân Tách Độc Lập**:
  * Thư mục `frontend/`: Hoàn toàn độc lập, chạy trên cổng 8080, phục vụ giao diện người dùng.
  * Thư mục `backend/`: Hoàn toàn độc lập, chạy trên cổng 5000, xử lý toàn bộ logic nghiệp vụ, REST API và lưu trữ dữ liệu.
* **Reverse Proxy Tích Hợp Sẵn**:
  * `frontend/server.js` tích hợp sẵn Reverse Proxy chuyển tiếp toàn bộ yêu cầu `/api/*` về `backend:5000`, triệt tiêu hoàn toàn các vấn đề xung đột tên miền hay lỗi CORS.
* **Real-time Auto-sync**:
  * Frontend tự động thăm dò cập nhật mỗi 4 giây và mỗi khi người dùng click chuột quay lại tab shop (`window.focus`). Khi admin thêm sản phẩm mới hoặc đổi giá ở trang quản trị, trang bán hàng sẽ tự động cập nhật ngay lập tức.
* **Cơ Chế Phục Hồi Ảnh Thông Minh**:
  * Các thẻ ảnh có sẵn cơ chế `onerror` tự động fallback sang cổng Backend nếu file ảnh vừa upload chưa kịp sao chép sang Frontend, đảm bảo 100% không bao giờ bị lỗi ảnh trắng.

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN SAU KHI QUY HOẠCH

```
Shop giày nike/
├── backend/                             # MÁY CHỦ REST API & CỔNG QUẢN TRỊ ADMIN (PORT 5000)
│   ├── public/
│   │   ├── admin.js                     # Bộ điều khiển quản lý đơn hàng, thêm giày, sửa giá, cấu hình bank
│   │   ├── index.html                   # Giao diện Admin Dashboard sang trọng chuẩn Nike
│   │   └── uploads/                     # Thư mục lưu ảnh giày do admin tải lên từ máy tính
│   ├── bank.json                        # Cấu hình tài khoản ngân hàng VietQR
│   ├── Dockerfile                       # Đóng gói container Docker cho Backend (Node.js 20 Alpine)
│   ├── orders.json                      # Cơ sở dữ liệu danh sách đơn hàng đã đặt
│   ├── products.json                    # Cơ sở dữ liệu danh mục sản phẩm và giá bán niêm yết
│   └── server.js                        # Node.js HTTP REST API Server (CRUD Products, Orders, Upload, Bank)
│
├── frontend/                            # GIAO DIỆN MUA SẮM KHÁCH HÀNG (PORT 8080)
│   ├── assets/
│   │   └── shoes/                       # Bộ sưu tập ảnh sneaker Nike chính hãng tách nền trong suốt
│   ├── css/
│   │   └── styles.css                   # Stylesheet tối ưu: hiệu ứng 3D Turntable, popup, giỏ hàng
│   ├── js/
│   │   ├── app.js                       # Controller chính: đồng bộ live API, lọc danh mục động, tìm kiếm
│   │   ├── cart.js                      # Logic giỏ hàng, tính tổng tiền, tạo đơn và mở modal VietQR
│   │   ├── modal.js                     # Popup khung thông tin chi tiết (Quick View)
│   │   ├── products.js                  # Dữ liệu sản phẩm mẫu dự phòng & hàm đồng bộ API
│   │   └── turntable.js                 # Logic vật lý sàn diễn 3D Runway mượt 60fps
│   ├── Dockerfile                       # Đóng gói container Docker cho Frontend (Nginx Alpine)
│   ├── index.html                       # Trang chủ mua sắm Nike Atelier chuẩn tối giản
│   └── server.js                        # Máy chủ Frontend Node.js tích hợp sẵn Reverse Proxy sang Backend
│
├── .gitignore                           # Danh sách loại trừ file nhị phân & node_modules khi push Git
├── BAO_CAO_BAN_GIAO.md                  # Bản báo cáo nghiệm thu chi tiết này
├── docker-compose.yml                   # Cấu hình khởi chạy đồng thời cả Frontend & Backend qua Docker
├── MO_SHOP_NIKE.bat                     # File kích hoạt 1 chạm tự động mở shop trên máy tính
├── package.json                         # Khai báo kịch bản khởi chạy npm & thông tin dự án
└── README.md                            # Hướng dẫn kỹ thuật và tài liệu tóm tắt
```

---

## 4. HỆ THỐNG REST API BACKEND

| Phương thức | Đường dẫn API | Chức năng | Dữ liệu gửi lên / phản hồi |
|:---:|:---|:---|:---|
| **GET** | `/api/health` | Kiểm tra trạng thái máy chủ | `{ status: "ok", uptimeSeconds: 120 }` |
| **GET** | `/api/products` | Lấy danh sách toàn bộ sản phẩm | Mảng danh sách sản phẩm (JSON) |
| **POST** | `/api/products` | Thêm một mẫu giày mới | `{ name, price, category, image, specs... }` |
| **PUT** | `/api/products/:id` | **Chỉnh sửa thông tin & giá bán** | `{ price: 3500000 }` |
| **DELETE** | `/api/products/:id` | Xóa một mẫu giày khỏi hệ thống | Xóa theo mã sản phẩm (`id`) |
| **POST** | `/api/upload` | Tải ảnh từ máy tính lên server | `{ filename: "...", data: "data:image/...;base64,..." }` |
| **GET** | `/api/orders` | Lấy danh sách tất cả đơn đặt hàng | Mảng danh sách đơn hàng mới nhất |
| **POST** | `/api/orders` | Khách đặt hàng mới từ web | `{ orderId, customer, items, totalAmount... }` |
| **PUT** | `/api/orders/:id` | Cập nhật trạng thái đơn hàng | `{ status: "Đã thanh toán • Chuẩn bị hàng" }` |
| **DELETE** | `/api/orders/:id` | Xóa đơn hàng | Xóa theo mã đơn hàng (`orderId`) |
| **GET** | `/api/config/bank` | Lấy cấu hình tài khoản VietQR | `{ bankName, bankCode, accountNo, accountHolder }` |
| **POST** | `/api/config/bank` | Lưu cấu hình tài khoản VietQR mới | `{ bankName, bankCode, accountNo, accountHolder }` |

---

## 5. HƯỚNG DẪN KHỞI CHẠY VÀ VẬN HÀNH

### Cách 1: Khởi động 1 chạm tự động (Dành cho sử dụng hàng ngày)
1. Vào thư mục `C:\Users\ASUS\Downloads\Shop giày nike`.
2. **Nhấp đúp chuột (Double-click) vào file `MO_SHOP_NIKE.bat`**.
3. Cả 2 máy chủ Backend và Frontend sẽ tự động khởi chạy và trình duyệt tự mở sẵn trang web mua sắm.

### Cách 2: Khởi động độc lập từng phần bằng dòng lệnh
* **Khởi động Backend (cổng 5000):**
  ```powershell
  cd "C:\Users\ASUS\Downloads\Shop giày nike\backend"
  node server.js
  ```
  Truy cập quản trị tại: `http://localhost:5000/admin`

* **Khởi động Frontend (cổng 8080):**
  ```powershell
  cd "C:\Users\ASUS\Downloads\Shop giày nike\frontend"
  node server.js
  ```
  Truy cập web mua sắm tại: `http://localhost:8080`

### Cách 3: Chạy bằng Docker Compose (Môi trường máy chủ chuyên nghiệp)
```bash
docker compose up -d --build
```
Hệ thống sẽ tự động build image và chạy 2 container độc lập, đồng thời gắn volume mount cho các file dữ liệu `orders.json`, `products.json`, `bank.json` để không bị mất dữ liệu khi restart container.

---

## 6. QUẢN LÝ MÃ NGUỒN TRÊN GITHUB

Toàn bộ mã nguồn dự án đã được cấu hình Git, đồng bộ hóa và lưu trữ an toàn tại kho chứa GitHub:
* **Địa chỉ kho:** `https://github.com/phatmanhphong-droid/shop-giay-nike.git`
* **Nhánh chính:** `main`
* **Lịch sử các tính năng đã commit:**
  * `70f1923`: Tích hợp nút chỉnh sửa giá bán và modal cập nhật giá trực tiếp trên Backend Admin, tự động đồng bộ sang Frontend.
  * `6d856d9`: Sửa lỗi đồng bộ sản phẩm thời gian thực, tích hợp Reverse Proxy và auto-refresh dữ liệu.
  * `056bd68`: Khắc phục ổn định kết nối máy chủ, tự động nhận diện API_BASE cổng 5000.
  * `d67b4e5`: Tích hợp tính năng thêm, xóa và upload ảnh giày trực tiếp từ máy tính trên trang Admin.
  * `fc80072`: Xây dựng giao diện Backend Admin Portal quản lý đơn hàng và cấu hình VietQR.
  * `114f9df`: Tách biệt hoàn toàn Backend (Node.js API) và Frontend (UI) kèm Docker Compose.
  * `6e2104d`: Khởi tạo dự án Shop Giày Nike - Node.js Backend, VietQR Techcombank & Docker.

---

## 7. KẾT LUẬN & NGHIỆM THU

Dự án **Shop Giày Nike 2026** đã hoàn thành 100% tất cả các yêu cầu của khách hàng:
- ✅ Giao diện tối giản, sang trọng, tinh tế đúng tinh thần Nike Atelier.
- ✅ Sàn trưng bày 3D Turntable 60fps mượt mà, bấm vào giày xem chi tiết tức thì.
- ✅ Đã gỡ bỏ sạch sẽ tính năng so sánh sản phẩm để trang web gọn nhẹ, thoáng mắt.
- ✅ Thanh toán quét mã VietQR tự động hoàn hảo, tiền về thẳng tài khoản ngân hàng.
- ✅ Tách biệt rõ ràng Frontend (8080) và Backend (5000).
- ✅ Trang Quản trị Admin Dashboard đầy đủ tính năng: Đơn hàng, Thêm sản phẩm kèm tải ảnh, và **Sửa giá bán trực tiếp**.
- ✅ Dữ liệu tự động đồng bộ thời gian thực 2 chiều.
- ✅ Đã đóng gói Docker và đẩy toàn bộ mã nguồn lên GitHub.

Dự án đã sẵn sàng bàn giao và vận hành thương mại ngay lập tức!
