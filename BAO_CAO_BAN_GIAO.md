# BÁO CÁO NGHIỆM THU DỰ ÁN SHOP GIÀY NIKE (NIKE ATELIER 2026)
## NHẬT KÝ NÂNG CẤP TÍNH NĂNG NGÀY 14/11/2026

> **Dự án**: Website Shop Giày Nike Chính Hãng (Fullstack Node.js + VietQR + Admin Portal + Docker)  
> **Phiên bản**: 5.0 (Cập nhật ngày 14/11/2026)  
> **Địa chỉ Web Khách hàng (Frontend)**: http://localhost:8080  
> **Địa chỉ Cổng Quản Trị (Backend Admin)**: http://localhost:5000/admin  
> **GitHub Repository**: [https://github.com/phatmanhphong-droid/shop-giay-nike.git](https://github.com/phatmanhphong-droid/shop-giay-nike.git) (Nhánh `main`)  
> **Thư mục dự án**: `C:\Users\ASUS\Downloads\Shop giày nike`  
> **Hotline & Zalo Quản Trị**: `0908065297`  
> **Tài khoản thụ hưởng VietQR**: Techcombank `8678686688` (TRAN DUC MANH)

---

## 1. TỔNG HỢP CÁC CHỨC NĂNG ĐÃ THỰC HIỆN HÔM NAY (14/11/2026)

Hôm nay hệ thống đã được nâng cấp vượt bậc với **5 nhóm chức năng trọng yếu** nhằm hoàn thiện toàn diện quy trình bán hàng, khuyến mãi và quản trị tài chính:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             CÁC TÍNH NĂNG HOÀN THÀNH NGÀY 14/11/2026                             │
├─────────────────────────┬────────────────────────────────────────────────────────────────────────┤
│ 1. Tối Ưu Zalo & SMS   │ Thay nút Zalo khách bằng tin nhắn xác nhận chuẩn + Nút chat Zalo Admin │
│ 2. Voucher & Mã SP SKU │ Mã số riêng (NK-01..24), Hạn dùng (từ ngày..đến ngày), Phạm vi áp dụng  │
│ 3. Ruy Băng Đỏ Chéo 45°│ Ruy băng đỏ góc phải "GIẢM 50%", bật/tắt 1-chạm đồng bộ Admin & Web   │
│ 4. Siêu Dashboard 3D   │ Biểu đồ ApexCharts 3D, 3 chế độ xem (Cột/Sóng/Chồng), Thẻ chỉ số tuần  │
│ 5. Phân Hệ Thuế TMĐT   │ Thanh phổ dòng tiền 100%, tính thuế 1.5% TT40, lợi nhuận ròng đút túi │
│ 6. Quản Lý Tồn Kho     │ Thước đo tiến trình (Progress Bar), cảnh báo cháy hàng, nút nhập hàng   │
│ 7. Xuất Báo Cáo Excel  │ Tải file Excel/CSV tiếng Việt UTF-8 BOM cho Doanh Thu và Kho Hàng      │
└─────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG TÍNH NĂNG ĐÃ HOÀN THÀNH

### Nhóm 1: Tối Ưu Quy Trình Chăm Sóc Khách Hàng (Zalo & SMS)
- **Giao diện Khách hàng (Frontend Checkout)**:
  - Gỡ bỏ nút "Nhắn Zalo shop" gây hiểu lầm sau khi đặt hàng.
  - Thay bằng thông báo chuẩn hóa chuyên nghiệp: *"📲 Tin nhắn xác nhận đơn hàng đã gửi tới: ${order.customer.phone}"*.
  - Nút *"Theo Dõi Vận Đơn Ngay"* dẫn thẳng đến dòng thời gian 4 giai đoạn giao hàng.
- **Giao diện Quản trị (Admin Order Table)**:
  - Bổ sung nút **`💬 Zalo Khách`**: Tự động sao chép toàn bộ nội dung đơn hàng (mã đơn, mẫu giày, size, số tiền, địa chỉ) vào bộ nhớ tạm (Clipboard) và mở trực tiếp cuộc trò chuyện `https://zalo.me/[SĐT_Khách]` chỉ với 1 cú click để chủ shop tư vấn và gửi ảnh thật.

---

### Nhóm 2: Hệ Thống Mã Giảm Giá Voucher Đa Năng & Mã Sản Phẩm Riêng (SKU)
- **Mã sản phẩm riêng (Unique Product Code)**:
  - Cấp mã số riêng biệt từ `NK-01` đến `NK-24` cho tất cả các mẫu giày trong danh mục.
  - Hiển thị huy hiệu `NK-01` rõ nét trên thẻ sản phẩm ở Bộ sưu tập, trong popup chi tiết (Quick View), trong giỏ hàng (Cart Drawer) và trong bảng quản trị Admin.
- **Công cụ Voucher Nâng Cao**:
  - **Thời gian áp dụng**: Thêm trường `startDate` và `endDate` (từ ngày bao nhiêu đến hết ngày bao nhiêu). Nếu khách nhập mã trước ngày bắt đầu hoặc sau ngày kết thúc, hệ thống sẽ từ chối và báo rõ ngày hiệu lực.
  - **Phạm vi áp dụng linh hoạt (Scope)**:
    - *Tất cả sản phẩm*: Áp dụng chiết khấu cho mọi đôi giày trong cửa hàng.
    - *Sản phẩm chỉ định*: Chủ shop được tích chọn từng đôi giày theo mã `NK-01`, `NK-02`... Mã giảm giá chỉ có tác dụng khi giỏ hàng có đúng đôi giày đó.

---

### Nhóm 3: Dải Băng Đỏ Giảm Giá Chéo 45° & Đồng Bộ 1-Chạm Giữa Admin và Web
- **Thiết kế ruy băng đỏ góc chéo (Diagonal Red Corner Ribbon)**:
  - Loại bỏ hoàn toàn 2 viên thuốc đỏ xếp chồng lên nhau gây vướng mắt.
  - Thay thế bằng **dải ruy băng đỏ chéo 45 độ** tinh tế ở góc trên bên phải khung sản phẩm (`rotate-45` banner) mang dòng chữ trắng nổi bật: `GIẢM 50%` hoặc `GIẢM 500K`.
  - Giữ nguyên nhãn huy hiệu bên trái: `NK-01 JORDAN • Chính hãng`.
  - Hiển thị giá gốc bị gạch ngang và giá mới giảm đậm màu đỏ.
- **Cơ chế Bật / Tắt 1-chạm đồng bộ tức thì**:
  - Khi Admin chọn `● Đang Bật (Hiện Web)`: Ngoài trang Bộ Sưu Tập lập tức hiện ruy băng đỏ chéo và giá sale.
  - Khi Admin chọn `○ Đã Tắt (Đang Ẩn)`: Ngoài trang Bộ Sưu Tập lập tức giấu ruy băng và đưa giá về giá niêm yết ban đầu.

---

### Nhóm 4: Siêu Dashboard Doanh Thu & Biểu Đồ Cột 3D Đa Sắc (ApexCharts)
- **Đặt làm Màn hình Quản trị Mặc định số 1 (Hero Dashboard)**:
  - Ngay khi truy cập `http://localhost:5000/admin`, hệ thống mở ngay trung tâm Dashboard tổng quan trực quan nhất.
- **4 Thẻ Chỉ Số Tài Chính Cốt Lõi (Super KPI Cards)**:
  1. 💰 **Tổng Doanh Thu**: 80.477.000 ₫ (với nhãn 100% thu thực, 12 đơn thành công).
  2. 🏷️ **Tổng Giá Vốn (COGS)**: 46.250.000 ₫ (chiếm ~57% doanh thu, chi phí xuất kho).
  3. 🏛️ **Thuế TMĐT Ước Tính**: 1.207.155 ₫ (chi tiết 1% VAT + 0.5% TNCN).
  4. 📈 **Lợi Nhuận Ròng Thực Nhận**: 33.019.845 ₫ (tỷ suất sinh lời ròng ~41% sau thuế).
- **Biểu Đồ Cột 3D Gradient Đỉnh Cao (ApexCharts Multi-Column)**:
  - Cột Doanh Thu gradient màu **Tím Indigo sang Xanh Cyan** (`#4F46E5` $\rightarrow$ `#06B6D4`).
  - Cột Lợi Nhuận gradient màu **Xanh Ngọc Emerald sang Bạc Hà Mint** (`#059669` $\rightarrow$ `#34D399`).
  - Hiển thị trực tiếp số tiền trên đầu cột (`18.4M`, `15.9M`, `14.1M`...) kèm bóng đổ đổ mềm 3D.
  - **Bộ chuyển đổi 3 chế độ xem trong 1 (Chart View Switcher)**:
    - 📊 **Cột 3D Gradient**: So sánh cột kép từng ngày.
    - 🌊 **Đường Sóng Mềm (Smooth Area Spline)**: Đường lượn sóng mượt mà phát sáng.
    - 📶 **Cột Chồng (Stacked Flow)**: Xếp chồng Giá vốn + Lợi nhuận = Doanh thu.
- **Huy Hiệu Phân Tích Tuần (Weekly Highlights)**:
  - 🏆 Ngày đỉnh cao kỷ lục: Thứ Tư (18.4M ₫).
  - 📈 Doanh thu bình quân: 11.5M ₫ / ngày.
  - 🎯 Tỷ suất sinh lời bình quân: 42.5% doanh số.
- **Biểu Đồ Tròn Cơ Cấu Doanh Thu Theo Dòng Giày (Donut Chart)**:
  - Phân tích cơ cấu % doanh số đóng góp của từng dòng: Jordan, Running, Air Max, Lifestyle, Basketball.

---

### Nhóm 5: Phân Hệ Thuế TMĐT & Thanh Phổ Dòng Tiền 100% (Cashflow Spectrum)
- **Thanh phổ phân bổ dòng tiền 100% (Visual Cashflow Spectrum Bar)**:
  - Một thanh Progress Bar ngang chia 3 phần rõ rệt:
    - 🟨 **Vốn nhập giày**: 57.5% (Chi phí sản xuất).
    - 🟥 **Thuế TMĐT**: 1.5% (Nghĩa vụ nộp ngân sách nhà nước).
    - 🟩 **Lợi nhuận ròng đút túi**: 41.0% (Tiền sạch thực nhận về tài khoản).
- **Bộ máy tính & Cài đặt Thuế kinh doanh TMĐT**:
  - Hỗ trợ mô hình **Hộ kinh doanh cá thể TMĐT**: Thuế suất 1.5% tính trên Doanh thu (1% VAT + 0.5% TNCN theo Thông tư 40/2021/TT-BTC).
  - Hỗ trợ mô hình **Doanh nghiệp / Công ty**: Thuế GTGT khấu trừ (8-10%) + Thuế TNDN (20% trên lợi nhuận).
  - Cho phép chủ shop tùy chỉnh linh hoạt % thuế suất và lưu lại hệ thống.

---

### Nhóm 6: Phân Hệ Kiểm Soát Kho Hàng & Thước Đo Tồn Kho (Progress Meters)
- **Thước đo tồn kho trực quan (Visual Inventory Progress Bars)**:
  - Mỗi mẫu giày đều có thanh đo tiến trình hiển thị:
    - Số lượng nhập ban đầu.
    - Số lượng đã xuất bán (kèm % bán ra).
    - Số lượng còn lại trong kho (kèm % tồn kho).
- **Hệ thống cảnh báo màu sắc theo thời gian thực**:
  - 🟢 **Thanh xanh lá**: Tồn kho dồi dào ($> 10$ đôi).
  - 🟡 **Thanh vàng**: Cảnh báo sắp hết ($5 - 9$ đôi).
  - 🔴 **Thanh đỏ nhấp nháy**: Báo động đỏ sắp cháy hàng ($< 5$ đôi) kèm huy hiệu `⚠️ SẮP HẾT HÀNG`.
- **Cửa sổ Nhập thêm hàng vào kho (Restock Modal)**:
  - Bấm nút **`➕ Nhập`** cạnh bất kỳ mẫu giày nào để mở modal.
  - Nhập số lượng đôi cần nhập thêm (+10, +20, +50, +100 đôi).
  - Cập nhật giá vốn nhập đợt mới (nếu có biến động giá).
  - Ghi chú thông tin lô hàng xuất xưởng.
  - Tự động lưu lịch sử vào file `backend/restock-history.json`.
- **Trừ kho tự động**:
  - Mỗi khi có đơn hàng mới từ web, hệ thống tự động trừ kho và tăng số lượng đã bán của sản phẩm tương ứng.

---

### Nhóm 7: Xuất File Báo Cáo Excel / CSV Tiếng Việt Chuẩn UTF-8 BOM
- **Xuất Báo Cáo Doanh Thu**: Tải về file `.csv` có mã đơn, ngày đặt, khách hàng, số điện thoại, doanh số, chi phí vốn, tiền thuế và tiền lời ròng mở trực tiếp bằng Microsoft Excel không bị lỗi font chữ tiếng Việt.
- **Xuất Báo Cáo Tồn Kho**: Tải về bảng kiểm kê chi tiết số lượng nhập, xuất, tồn và giá trị lưu kho của từng mẫu giày.

---

## 3. LỊCH SỬ CÁC BẢN COMMIT ĐÃ ĐẨY LÊN GITHUB NGÀY 14/11/2026

Toàn bộ các tính năng đã được kiểm thử và đẩy lên nhánh `main` của kho chứa GitHub:
[https://github.com/phatmanhphong-droid/shop-giay-nike.git](https://github.com/phatmanhphong-droid/shop-giay-nike.git)

| Mã Commit | Thông Điệp Commit (Nội Dung Cập Nhật) |
|:---:|:---|
| `4f98184` | Tối ưu thông báo SMS/Zalo khách hàng và nút chat Zalo trực tiếp trên bảng Admin |
| `fa3dace` | Gán mã định danh riêng cho từng đôi giày (NK-01..24) và hỗ trợ phạm vi voucher theo mã SP |
| `f269e1e` | Hiển thị thông báo voucher giảm giá lên danh mục Bộ sưu tập |
| `2b4ba9c` | Khôi phục voucher mẫu và kích hoạt SALEDONQUA giảm 50% |
| `0ea1bcd` | Tối ưu giao diện sale kèm bộ lọc danh mục động |
| `7a1ecf1` | Bổ sung nút toggle showOnCatalog độc lập |
| `8732aa4` | Đồng bộ 1:1 trạng thái Bật/Tắt voucher giữa Admin và Bộ sưu tập |
| `87c9748` | Thiết kế dải băng đỏ chéo 45 độ `GIẢM 50%` ở góc trên bên phải khung sản phẩm |
| `5423b3e` | Xây dựng phân hệ Doanh thu biểu đồ cột, Thuế TMĐT, Quản lý kho hàng & Xuất báo cáo CSV |
| `4e8ba98` | Nâng cấp Siêu Dashboard trực quan với ApexCharts, dải phổ dòng tiền 100% & thước đo tồn kho |
| `7f53789` | Nâng cấp Biểu đồ cột 3D Gradient đa sắc với 3 chế độ xem (Cột, Sóng, Chồng) & thẻ kỷ lục tuần |

---

## 4. HƯỚNG DẪN TRẢI NGHIỆM VÀ KIỂM TRA HỆ THỐNG

1. **Khởi động hệ thống (nếu chưa chạy)**:
   - Nhấp đúp chuột vào file `C:\Users\ASUS\Downloads\Shop giày nike\MO_SHOP_NIKE.bat`.
2. **Kiểm tra Giao diện Mua Sắm Khách Hàng**:
   - Mở trình duyệt vào: [http://localhost:8080](http://localhost:8080)
   - Xem dải băng đỏ chéo `GIẢM 50%` ở góc các đôi giày đang được áp dụng voucher.
   - Thử thêm giày vào giỏ và xem mã giảm giá tự động tính toán.
3. **Kiểm tra Trung Tâm Quản Trị Siêu Dashboard**:
   - Mở trình duyệt vào: [http://localhost:5000/admin](http://localhost:5000/admin)
   - Xem ngay 4 thẻ chỉ số tài chính, thanh phổ dòng tiền 100%.
   - Trải nghiệm biểu đồ cột 3D và bấm thử 3 nút xem: **Cột 3D Gradient**, **Đường Sóng Mềm**, **Cột Chồng**.
   - Xem thước đo tiến trình tồn kho (Progress Bars) và bấm nút **`➕ Nhập`** để nhập thêm giày vào kho.
   - Bấm nút **`Xuất Excel Báo Cáo`** để tải file đối soát doanh thu.
