# ☕ Cà Phê Thông Minh - Smart Coffee Management System

Hệ thống quản lý quán cà phê hiện đại hỗ trợ đặt món tại bàn, thanh toán QR và quản lý doanh thu thời gian thực.

---

## 📌 Giới thiệu
Cà Phê Thông Minh giải quyết bài toán vận hành quán cà phê bằng cách phân quyền rõ ràng cho 3 đối tượng người dùng:
* **Admin:** Kiểm soát toàn bộ hệ thống, nhân sự và dòng tiền.
* **Staff:** Tiếp nhận đơn hàng, quản lý tình trạng bàn và hỗ trợ thanh toán.
* **Customer:** Trải nghiệm đặt món chủ động, tùy chỉnh món ăn và thanh toán không tiền mặt.

---

## 🛠 Công nghệ sử dụng
* **Frontend:** HTML5, CSS3, JavaScript (ES6), Chart.js.
* **Backend:** Node.js, Express.js.
* **Database:** Microsoft SQL Server (MSSQL).
* **Xác thực:** JWT (JSON Web Token), Bcrypt (mã hóa mật khẩu).
* **Tiện ích:** Nodemailer (OTP Email), VietQR API (Thanh toán), .env (Bảo mật cấu hình).

---

## 📁 Cấu trúc thư mục
```text
cafe-manager/
├── frontend/             # Giao diện người dùng
│   ├── admin/            # Quản trị viên (Nhân sự, báo cáo, mật khẩu)
│   ├── staff/            # Nhân viên (Bàn, đơn hàng)
│   ├── user/             # Khách hàng (Menu, giỏ hàng, thanh toán)
│   ├── auth/             # Đăng ký/Đăng nhập chung cho khách
│   ├── shared/           # CSS/JS/Images dùng chung
│   ├── index.html        # Trang chủ dành cho khách hàng
│   └── main.html         # Trang điều hướng nội bộ (Admin/Staff)
├── backend/              # Mã nguồn xử lý máy chủ
│   ├── config/           # Cấu hình kết nối DB
│   ├── controllers/      # Logic xử lý API
│   ├── routes/           # Định nghĩa các đường dẫn API
│   ├── middleware/       # Kiểm tra quyền truy cập (JWT)
│   └── server.js         # Tệp chạy chính
└── database/             # Kịch bản khởi tạo dữ liệu SQL
```

---

## 🚀 Cài đặt và Chạy dự án

### 1. Yêu cầu hệ thống
* Node.js v18+
* SQL Server 2019+ (Đã bật TCP/IP tại Port 1433)

### 2. Cài đặt Database
1. Mở **SSMS**, chạy file `CafeManagement.sql` để tạo cấu trúc.
2. Chạy tiếp các file còn lại trong thư mục `database/` để nạp dữ liệu mẫu và các tùy chọn món ăn.

### 3. Cấu hình Backend
1. Di chuyển vào thư mục backend: `cd backend`
2. Cài đặt thư viện: `npm install`
3. Tạo file `.env` và nhập thông tin (dựa trên file .env.example).

### 4. Khởi chạy
* Chạy server: `node server.js`
* Truy cập: `http://localhost:5000`

---

## 📝 Danh sách nhiệm vụ (To-Do List)

### ✅ Giai đoạn 1: Cơ sở hạ tầng (Hoàn thành)
* [x] Thiết kế Database SQL Server chuẩn hóa.
* [x] Xây dựng cấu hình kết nối Node.js với MSSQL.
* [x] Thiết lập định tuyến (Routing) cơ bản cho Server.

### ⏳ Giai đoạn 2: Tính năng Khách hàng (Đang thực hiện)
* [ ] Hoàn thiện giao diện Menu (hiển thị Size S/M/L và Nhiệt độ).
* [ ] Tích hợp API VietQR để tạo mã thanh toán động.
* [ ] Hệ thống gửi OTP qua Email khi đăng ký tài khoản.
* [ ] Chức năng chọn bàn trống thời gian thực.

### 🛠 Giai đoạn 3: Quản trị & Nhân viên
* [ ] Xây dựng biểu đồ doanh thu bằng Chart.js cho Admin.
* [ ] Chức năng phê duyệt yêu cầu đặt lại mật khẩu cho nhân viên.
* [ ] Trang quản lý bàn (Đổi màu theo trạng thái: Trống/Có khách/Đã đặt).
* [ ] In hóa đơn (PDF Generator).

### 🔒 Giai đoạn 4: Bảo mật & Tối ưu
* [ ] Phân quyền Middleware (Admin mới được vào trang Staff-management).
* [ ] Validate dữ liệu đầu vào (không cho phép đặt số lượng âm).
* [ ] Viết tài liệu hướng dẫn sử dụng (User Manual).

---

## 🔗 Liên kết
* **Trang khách hàng:** `http://localhost:5000`
* **Trang nội bộ:** `http://localhost:5000/main.html`

---
*Lưu ý: Không chia sẻ file .env lên GitHub để đảm bảo an toàn thông tin cá nhân.*
