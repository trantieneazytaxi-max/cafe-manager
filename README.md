# ☕ Cà Phê Thông Minh - Smart Coffee Management System

Hệ thống quản lý quán cà phê hiện đại với đầy đủ tính năng: đặt món tại bàn, tùy chọn size/topping, thanh toán QR, quản lý khuyến mãi, quản lý doanh thu thời gian thực và phân quyền 3 cấp (Admin/Staff/Customer).

---

## 📌 Giới thiệu

Cà Phê Thông Minh giải quyết bài toán vận hành quán cà phê bằng cách phân quyền rõ ràng cho 3 đối tượng người dùng:

* **Admin:** Kiểm soát toàn bộ hệ thống — quản lý nhân sự, thực đơn (CRUD), quản lý bàn, mã giảm giá, báo cáo doanh thu, cài đặt hệ thống và phê duyệt yêu cầu đặt lại mật khẩu.
* **Staff:** Tiếp nhận đơn hàng, quản lý tình trạng bàn, tạm dừng món khi hết nguyên liệu và hỗ trợ thanh toán.
* **Customer:** Trải nghiệm đặt món chủ động, tùy chỉnh size/topping, chọn bàn trống, thanh toán không tiền mặt, xem lịch sử đơn hàng và đổi điểm tích lũy lấy ưu đãi.

---

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Frontend** | HTML5, CSS3 (Cyberpunk theme cho Admin), JavaScript ES6, Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | Microsoft SQL Server (MSSQL) |
| **Xác thực** | JWT (JSON Web Token), Bcrypt (mã hóa mật khẩu) |
| **Email** | Nodemailer (OTP xác thực email) |
| **Thanh toán** | VietQR API (Mã QR động) |
| **Bảo mật** | dotenv (.env), Middleware phân quyền (Admin/Staff/Customer) |

---

## 📁 Cấu trúc thư mục

```text
cafe-manager/
├── frontend/
│   ├── admin/                    # Quản trị viên
│   │   ├── auth/                 # Đăng nhập/Đăng ký Admin
│   │   ├── dashboard/            # Trang tổng quan (Sidebar chung, CSS chung)
│   │   ├── staff-management/     # Quản lý nhân viên
│   │   ├── menu/                 # Quản lý thực đơn (CRUD, Size, Topping, Pause)
│   │   ├── tables/               # Quản lý bàn
│   │   ├── reports/              # Báo cáo doanh thu
│   │   ├── discounts/            # Quản lý mã giảm giá
│   │   ├── password-requests/    # Phê duyệt đặt lại mật khẩu
│   │   └── settings/             # Cài đặt hệ thống
│   ├── staff/                    # Nhân viên
│   │   ├── auth/                 # Đăng nhập Staff
│   │   └── dashboard/            # Trang tổng quan
│   │       ├── html/             # Dashboard, Tạm dừng món
│   │       ├── orders/           # Quản lý đơn hàng
│   │       └── tables/           # Quản lý bàn
│   ├── user/                     # Khách hàng
│   │   ├── index/                # Trang chủ (Landing page)
│   │   ├── menu/                 # Thực đơn (Gợi ý, Size, Topping, Hết hàng)
│   │   ├── orders/               # Giỏ hàng
│   │   ├── tables/               # Đặt bàn
│   │   ├── payment/              # Thanh toán (VietQR)
│   │   ├── payment-success/      # Thanh toán thành công
│   │   ├── offers/               # Kho ưu đãi & Đổi điểm
│   │   ├── history/              # Lịch sử đơn hàng & Điểm tích lũy
│   │   ├── profile/              # Thông tin cá nhân
│   │   └── settings/             # Cài đặt người dùng
│   ├── auth/                     # Đăng ký/Đăng nhập chung (Customer)
│   └── shared/                   # CSS/JS/Images dùng chung
├── backend/
│   ├── config/                   # Cấu hình kết nối Database
│   ├── middleware/               # JWT Auth, phân quyền (isAdmin, isStaff)
│   ├── routes/
│   │   ├── adminRoutes.js        # API quản trị
│   │   ├── authRoutes.js         # Đăng nhập/Đăng ký
│   │   ├── menuRoutes.js         # Thực đơn (CRUD, Size, Topping, Pause)
│   │   ├── orderRoutes.js        # Đơn hàng (Customer)
│   │   ├── staffOrderRoutes.js   # Đơn hàng (Staff)
│   │   ├── tableRoutes.js        # Quản lý bàn
│   │   ├── discountRoutes.js     # Mã giảm giá
│   │   ├── customerRoutes.js     # Thông tin khách hàng
│   │   ├── paymentRoutes.js      # Thanh toán VietQR
│   │   ├── forgotPasswordRoutes.js   # Quên mật khẩu
│   │   └── verificationRoutes.js     # Xác thực OTP Email
│   └── server.js                 # Tệp chạy chính
└── database/                     # Script khởi tạo SQL Server
```

---

## ✨ Tính năng chính

### 🛍 Khách hàng (Customer)
- Trang chủ Landing Page với storytelling hấp dẫn
- Thực đơn với **gợi ý món bán chạy** (Best Seller)
- Tùy chọn **Size / Topping** với tính giá tự động
- Hiển thị trạng thái **"Hết hàng"** khi món bị tạm dừng
- Chọn bàn trống theo thời gian thực
- Thanh toán qua **VietQR** (mã QR động)
- Kho ưu đãi & **đổi điểm tích lũy** lấy mã giảm giá
- Lịch sử đơn hàng chi tiết
- Quản lý thông tin cá nhân & cài đặt
- Header thống nhất trên toàn bộ trang (Navbar chung)

### 🧑‍💼 Nhân viên (Staff)
- Dashboard tổng quan: thống kê đơn hàng, doanh thu ca, trạng thái bàn
- Quản lý đơn hàng: xác nhận, xem chi tiết
- Quản lý bàn: cập nhật trạng thái (Trống / Đang dùng / Đã đặt)
- **Tạm dừng món** khi hết nguyên liệu (toggle nhanh)
- Phân ca tự động (Sáng / Chiều / Tối)
- Header thống nhất trên toàn bộ trang Staff

### 👑 Quản trị viên (Admin)
- Dashboard với giao diện **Cyberpunk** cao cấp (Sidebar ẩn/hiện)
- **Quản lý thực đơn nâng cao:** CRUD món ăn, cấu hình Size (giá cộng thêm), Topping (giá cộng thêm), đánh dấu **Best Seller**, tạm dừng món
- Quản lý nhân viên: thêm / sửa / xóa / vô hiệu hóa tài khoản
- Quản lý bàn: thêm / sửa / xóa
- Quản lý mã giảm giá: tạo mã thủ công & mã đổi điểm
- Phê duyệt yêu cầu đặt lại mật khẩu từ nhân viên
- Báo cáo doanh thu (Chart.js)
- Cài đặt hệ thống

---

## 🚀 Cài đặt và Chạy dự án

### 1. Yêu cầu hệ thống
- Node.js v18+
- SQL Server 2019+ (Đã bật TCP/IP)

### 2. Cài đặt Database (1-Click Run)
1. Mở **SQL Server Management Studio (SSMS)**.
2. Mở file `database/CafeManagement_Full_Demo.sql`.
3. Nhấn **Execute (F5)** để tự động tạo database mới hoàn toàn từ A đến Z (bao gồm cả dữ liệu mẫu và các tài khoản `admin@cafe.com`, `staff1@cafe.com`, `khach@cafe.com` với mật khẩu chung là `123456`).

### 3. Cấu hình Backend
```bash
cd backend
npm install
```
Tạo file `.env` dựa trên `.env.example`:
```env
DB_SERVER=localhost\\SQLEXPRESS
DB_PORT=53321
DB_NAME=CafeManagement
DB_USER=sa
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 4. Khởi chạy
```bash
node server.js
```
Truy cập: `http://localhost:5000`

---

## 🔗 Đường dẫn truy cập

| Đối tượng | URL |
|---|---|
| 🏠 Trang chủ (Khách) | `http://localhost:5000` |
| 👤 Khách hàng | `http://localhost:5000/user` |
| 👨‍💼 Admin | `http://localhost:5000/admin` |
| 👨‍🍳 Staff | `http://localhost:5000/staff` |
| 📋 Health Check | `http://localhost:5000/api/health` |

---

## 📝 Lịch sử phát triển

### ✅ Giai đoạn 1: Cơ sở hạ tầng
- [x] Thiết kế Database SQL Server chuẩn hóa
- [x] Kết nối Node.js với MSSQL, cấu hình routing
- [x] Hệ thống xác thực JWT, phân quyền Middleware

### ✅ Giai đoạn 2: Tính năng Khách hàng
- [x] Landing Page với storytelling & hiệu ứng cuộn
- [x] Trang thực đơn: hiển thị sản phẩm, tìm kiếm, lọc theo danh mục
- [x] Hệ thống giỏ hàng & đặt hàng
- [x] Chọn bàn trống thời gian thực
- [x] Tích hợp thanh toán VietQR
- [x] Gửi OTP xác thực email khi đăng ký
- [x] Kho ưu đãi & Đổi điểm tích lũy
- [x] Lịch sử đơn hàng
- [x] Trang thông tin cá nhân & cài đặt

### ✅ Giai đoạn 3: Quản trị & Nhân viên
- [x] Admin Dashboard (Cyberpunk UI, Sidebar chung)
- [x] Quản lý nhân viên CRUD
- [x] Quản lý thực đơn nâng cao (Size, Topping, Best Seller, Tạm dừng)
- [x] Quản lý bàn (Admin + Staff)
- [x] Quản lý mã giảm giá (Thủ công + Loyalty)
- [x] Báo cáo doanh thu (Chart.js)
- [x] Phê duyệt đặt lại mật khẩu
- [x] Staff Dashboard: đơn hàng, bàn, tạm dừng món

### ✅ Giai đoạn 4: Thống nhất UI & Bảo mật
- [x] Header chung cho toàn bộ trang Customer (10 trang)
- [x] Header chung cho toàn bộ trang Staff (4 trang)
- [x] Sidebar chung cho toàn bộ trang Admin
- [x] Phân quyền Middleware: isAdmin, isStaff, optionalToken
- [x] Logout đúng đường dẫn cho Staff (`/staff/auth/html/staff-login.html`)

### 🔮 Dự kiến tiếp theo
- [ ] Responsive hoàn chỉnh cho mobile
- [x] In hóa đơn PDF
- [ ] Thông báo realtime (WebSocket)
- [ ] Tài liệu hướng dẫn sử dụng (User Manual)

---

## 👨‍💻 Tác giả

Dự án được phát triển bởi sinh viên.

---

> ⚠️ **Lưu ý:** Không chia sẻ file `.env` lên GitHub để đảm bảo an toàn thông tin cá nhân.
