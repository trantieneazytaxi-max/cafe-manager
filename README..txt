# ☕ Cà Phê Thông Minh - Hệ thống quản lý quán cà phê thông minh

## 📌 Giới thiệu

**Cà Phê Thông Minh** là một hệ thống quản lý quán cà phê toàn diện, được xây dựng với 3 vai trò riêng biệt:

| Vai trò | Chức năng |
|---------|-----------|
| **👑 Admin** | Quản lý nhân viên, xem báo cáo doanh thu, thống kê biểu đồ, quản lý bàn |
| **👤 Staff** | Quản lý bàn, xem đơn hàng, xác nhận thanh toán, quản lý ca làm |
| **🧑‍💼 Customer** | Đăng ký/đăng nhập (OTP email), xem thực đơn (size S/M/L, nhiệt độ), đặt món, giỏ hàng, thanh toán (tiền mặt/chuyển khoản QR), chọn bàn |

---

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6), Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | Microsoft SQL Server |
| **Xác thực** | JWT (JSON Web Token), bcrypt |
| **Email** | Nodemailer (Gmail SMTP) |
| **QR Code** | VietQR API |
| **Biểu đồ** | Chart.js |

---

## 📁 Cấu trúc thư mục
cafe-manager/
├── frontend/
│ ├── admin/ # Giao diện quản trị viên
│ │ ├── auth/ # Đăng nhập/đăng ký admin
│ │ ├── dashboard/ # Dashboard (biểu đồ, thống kê)
│ │ ├── staff-management/# Quản lý nhân viên
│ │ └── password-requests/# Yêu cầu đặt lại mật khẩu
│ ├── staff/ # Giao diện nhân viên
│ │ ├── auth/ # Đăng nhập staff
│ │ ├── dashboard/ # Dashboard staff
│ │ ├── tables/ # Quản lý bàn
│ │ └── orders/ # Quản lý đơn hàng
│ ├── user/ # Giao diện khách hàng
│ │ ├── index/ # Trang chủ
│ │ ├── menu/ # Thực đơn (size, nhiệt độ)
│ │ ├── orders/ # Giỏ hàng
│ │ ├── payment/ # Thanh toán (QR code)
│ │ ├── tables/ # Chọn bàn
│ │ ├── profile/ # Thông tin cá nhân
│ │ └── settings/ # Cài đặt
│ ├── auth/ # Đăng nhập/đăng ký khách hàng
│ ├── shared/ # CSS/JS dùng chung
│ ├── index.html # Trang chọn vai trò (Admin/Staff/Customer)
│ └── main.html # Trang chọn vai trò nội bộ
├── backend/
│ ├── config/
│ │ └── js/db.js # Kết nối database
│ ├── controllers/ # Xử lý logic
│ ├── routes/ # API routes
│ ├── middleware/ # Xác thực JWT, phân quyền
│ ├── utils/ # Email, SMS, PDF generator
│ ├── .env # Cấu hình môi trường
│ └── server.js # Khởi tạo server
└── database/
├── CafeManagement.sql # Tạo database và bảng
├── Demo-Data.sql # Dữ liệu mẫu
├── menu-options.sql # Bảng size, nhiệt độ
├── staff-profile.sql # Bảng thông tin nhân viên
├── password-resets.sql # Bảng yêu cầu đặt lại mật khẩu
└── queries/ # Các câu lệnh SQL hỗ trợ


---

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống

- Node.js (v18 trở lên)
- Microsoft SQL Server (2019 trở lên)
- SQL Server Management Studio (SSMS)
- VS Code (khuyến nghị)

---

### Bước 1: Clone dự án

git clone https://github.com/your-repo/cafe-manager.git
cd cafe-manager

### Bước 2: Cài đặt database

- Mở SSMS, chạy lần lượt các file trong thư mục database/:
- CafeManagement.sql (tạo database và bảng)
- Demo-Data.sql (dữ liệu mẫu)
- menu-options.sql (bảng size, nhiệt độ)
- staff-profile.sql (bảng thông tin nhân viên)
- password-resets.sql (bảng yêu cầu đặt lại mật khẩu)