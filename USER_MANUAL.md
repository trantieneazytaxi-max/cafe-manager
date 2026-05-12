# 📖 Hướng Dẫn Sử Dụng - Cà Phê Thông Minh

Chào mừng bạn đến với hệ thống quản lý **Cà Phê Thông Minh**. Tài liệu này hướng dẫn chi tiết cách sử dụng các tính năng dành cho 3 đối tượng người dùng: **Khách hàng**, **Nhân viên**, và **Quản trị viên**.

---

## 🛍 1. Dành Cho Khách Hàng (Customer)

### 🔹 Đăng ký & Đăng nhập
- Truy cập trang chủ, nhấn vào biểu tượng người dùng ở góc phải để đăng nhập hoặc đăng ký.
- Khi đăng ký, một mã **OTP** sẽ được gửi đến email của bạn để xác thực.

### 🔹 Đặt món (Menu)
- Truy cập mục **Thực đơn**.
- Nhấn vào món ăn để chọn **Size** hoặc **Topping** (nếu có).
- Nhấn **Thêm vào giỏ hàng**.
- Vào **Giỏ hàng** để kiểm tra, nhập mã giảm giá và chọn phương thức thanh toán.

### 🔹 Đặt bàn (Tables)
- Truy cập mục **Đặt bàn**.
- Chọn bàn còn trống (màu xanh). Bàn đang dùng sẽ có màu đỏ.
- Điền thông tin người đặt và xác nhận.

### 🔹 Thanh toán (VietQR)
- Khi thanh toán online, hệ thống sẽ tạo mã **QR động**.
- Sử dụng ứng dụng ngân hàng để quét mã. Sau khi thanh toán thành công, đơn hàng sẽ tự động cập nhật trạng thái.

### 🔹 Điểm tích lũy & Ưu đãi
- Mỗi đơn hàng thành công sẽ giúp bạn tích điểm (10,000₫ = 1 điểm).
- Vào mục **Ưu đãi** để đổi điểm lấy các mã giảm giá hấp dẫn.

---

## 👨‍🍳 2. Dành Cho Nhân Viên (Staff)

### 🔹 Dashboard Nhân viên
- Xem thống kê nhanh về doanh thu ca làm việc và số đơn hàng.
- Thực hiện **Check-in/Check-out** để chấm công theo ca.

### 🔹 Quản lý Đơn hàng
- Nhận thông báo **Realtime** (chuông báo và thông báo nổi) khi có khách đặt món mới.
- Nhấn vào đơn hàng để xem chi tiết và xác nhận thanh toán (đối với đơn tiền mặt).

### 🔹 Quản lý Bàn
- Cập nhật trạng thái bàn thủ công nếu khách vào trực tiếp không qua app.

### 🔹 Tạm dừng món
- Nếu nguyên liệu hết, nhân viên có thể vào mục **Tạm dừng món** để ẩn món đó khỏi Menu của khách ngay lập tức.

---

## 👑 3. Dành Cho Quản Trị Viên (Admin)

### 🔹 Quản lý Thực đơn (Menu CRUD)
- Thêm món mới, tải ảnh lên, thiết lập giá và các tùy chọn (Size/Topping).
- Đánh dấu món là **Best Seller** để được ưu tiên hiển thị.

### 🔹 Quản lý Nhân sự
- Thêm mới tài khoản nhân viên.
- Theo dõi lịch sử chấm công và doanh thu của từng nhân viên.

### 🔹 Báo cáo doanh thu
- Xem biểu đồ doanh thu theo Ngày/Tuần/Tháng/Năm.
- Phân tích món nào bán chạy nhất để tối ưu kho hàng.

### 🔹 Cài đặt hệ thống
- Thay đổi tên quán, địa chỉ, hotline hiển thị trên toàn bộ Website.
- Cập nhật Mapbox API Key để bản đồ hoạt động chính xác.

---

## 🛠 Hướng Dẫn Kỹ Thuật (Cho Developer)

### 🔹 Công nghệ
- **Backend**: Node.js, Express, Socket.io (Realtime).
- **Frontend**: HTML/CSS/JS thuần, Chart.js.
- **Database**: MSSQL Server.

### 🔹 Cấu trúc MVC
- `backend/controllers`: Xử lý logic nghiệp vụ.
- `backend/routes`: Định nghĩa các API endpoints.
- `backend/models`: Thao tác với cơ sở dữ liệu.

---
*Chúc bạn có trải nghiệm tuyệt vời cùng Cà Phê Thông Minh!*
