# Task 1.3 — UC-01 Đặt và thanh toán đơn

Liên kết FR-02–FR-08, FR-10–FR-12; NFR-02, NFR-05.

Actor chính: Customer. Actor hỗ trợ: Payment Service, Barista khi xử lý đơn đã thanh toán. Trigger: khách bấm thanh toán giỏ hàng.

Tiền điều kiện: menu và DB sẵn sàng; giỏ không rỗng; khách đăng nhập trước khi tạo đơn; tùy chọn hợp lệ. VNPay chỉ dùng khi có cấu hình merchant sandbox.

Hậu điều kiện thành công: một Order có tổng tiền server xác định; tồn kho đã giữ/trừ một lần; một giao dịch thành công; trạng thái PAID; điểm/sổ giao dịch cập nhật đúng một lần; hiển thị xác nhận từ API.

Hậu điều kiện thất bại: không ghi một phần transaction; thanh toán thất bại có trạng thái PAYMENT_FAILED; tồn được trả đúng một lần; người dùng thấy lỗi, không tự coi đã trả tiền.

## Luồng chính
1. Khách xem menu, mở chi tiết, chọn size/topping/đường/đá và số lượng.
2. UI lưu giỏ, khách kiểm tra và đăng nhập.
3. UI gọi quote; API validate JWT/dữ liệu, đọc giá/tồn/voucher, trả subtotal/discount/total.
4. UI gửi POST /orders với Idempotency-Key bền cho cùng lần đặt. API kiểm payload cũ, transaction giữ tồn bằng version và tạo đơn PENDING.
5. UI gửi POST /payments với key riêng bền cho giao dịch và phương thức.
6. Payment Service xử lý Ví/Thẻ mô phỏng hoặc redirect VNPay sandbox.
7. API transaction kiểm xác thực kết quả, claim đơn PENDING→PAID, cập nhật payment và điểm/ledger.
8. UI lấy trạng thái đơn thật, hiển thị mã đơn/tổng tiền; khách xem lịch sử. Staff nhận đơn PAID để pha.

## Luồng thay thế
A1 — Chưa đăng nhập ở bước 2: chuyển đăng nhập, giữ giỏ, quay lại checkout.
A2 — Thanh toán bằng điểm: server kiểm và trừ điểm có điều kiện; không redirect, trả kết quả ngay.
A3 — Return và IPN cùng tới: một transaction claim thành công, lần còn lại trả already-confirmed; không cộng điểm lại.
A4 — Response tạo đơn bị mất: gửi lại cùng key + payload, trả cùng ID, không trừ kho thêm.
A5 — Nhân viên xác nhận chuyển khoản thủ công: chỉ áp dụng phương thức thủ công, không thay callback VNPay.

## Ngoại lệ
E1 — Hết hàng/xung đột tồn: transaction rollback; retry OCC có giới hạn; UI yêu cầu sửa giỏ khi không đủ.
E2 — Voucher sai/hết hạn/hết lượt: từ chối quote/đặt, khách bỏ mã hoặc đổi giỏ.
E3 — Thiếu điểm: từ chối transaction, số dư không thay đổi.
E4 — Key được dùng với payload/phương thức khác: 409, không tạo thêm.
E5 — Callback sai chữ ký/amount/merchant: từ chối, không đổi đơn.
E6 — Cổng từ chối/hủy: FAILED/PAYMENT_FAILED; hoàn tồn một lần; có thể tạo đơn mới.
E7 — Mất mạng: hiển thị offline, không tự retry POST với key mới; trạng thái cuối đọc lại từ server.

Sơ đồ phạm vi UC: [checkout-use-case.puml](../diagrams/checkout-use-case.puml) và bản SVG tương ứng.
