# Task 1.1 — Bối cảnh và phạm vi

Nguồn yêu cầu: Assignment2-BrewLite.pdf, phiên bản 1.0; mô tả bổ sung của nhóm ngày 15/11/2026. PDF quy định tiêu chí nghiệm thu; mô tả bổ sung xác định hướng mở rộng. Đây là kế hoạch và đặc tả, không phải bằng chứng đã triển khai production.

## Bài toán
Khách cần chọn đồ uống, tùy biến, đặt và thanh toán trước; nhân viên cần hàng đợi có trạng thái rõ ràng; quản lý cần dữ liệu bán hàng và kiểm soát thực đơn. Ghi nhận bằng tay dễ mất đơn, sai tổng tiền, xác nhận trùng và bán vượt tồn kho.

## Stakeholder
| Stakeholder | Mục tiêu/kỳ vọng | Tiêu chí xác nhận |
|---|---|---|
| Khách hàng | Chọn món trên điện thoại, biết giá và trạng thái | Luồng menu → xác nhận, lịch sử chỉ của mình |
| Nhân viên quầy/barista | Chỉ pha đơn đã thanh toán, không bỏ sót đơn | PAID → PREPARING → READY → COMPLETED |
| Quản lý cửa hàng | Quản lý menu, voucher, kho và tài khoản | Phân quyền ADMIN; thay đổi có audit |
| Giảng viên/khách hàng nghiệm thu | Truy vết đủ Task 1–5, chạy lại độc lập | Tài liệu, tests, CI, URL và demo thực tế |
| Nhóm phát triển | Build lặp lại, thay đổi có kiểm soát | PR, CI, migration và rollback |
| Đơn vị thanh toán | Giao dịch hợp lệ, không xác nhận trùng | HMAC, amount check, callback idempotent |

## In-scope
MVP: Next.js mobile-first/PWA; NestJS REST API; PostgreSQL/Prisma; menu, chi tiết size/topping, giỏ hàng bền qua reload, đăng ký/đăng nhập JWT, đặt đơn transaction, Ví/Thẻ mô phỏng, lịch sử và trạng thái, ba vai trò, migration/seed, Docker Compose, tests, CI/CD, tài liệu và hướng dẫn bàn giao.

Mở rộng theo yêu cầu nhóm: quote server-side, voucher, điểm và sổ giao dịch LoyaltyTransaction, VNPay sandbox có Return/IPN, optimistic locking tồn kho, tùy chọn đường/đá, quản lý định lượng nguyên liệu. ADMIN tương ứng vai trò Manager trong nghiệp vụ; STAFF tương ứng Barista. Không tạo vai trò MANAGER thứ tư.

## Out-of-scope
Tự trích tiền/thanh toán cổng production khi chưa có merchant, lưu thông tin thẻ, tích hợp MoMo production, giao hàng/định tuyến, multi-store, hoàn tiền ngân hàng tự động, SLA thương mại. VNPay là sandbox; hoàn tiền bên ngoài cần đối soát, không được hiển thị đã hoàn khi mới yêu cầu.

## Giả định, ràng buộc, rủi ro
- Giữ Next.js/NestJS/PostgreSQL bắt buộc; monorepo apps/web, apps/api, docs.
- Nhóm cung cấp tài khoản cloud, merchant sandbox, secret và tên miền; không ghi secret vào Git.
- Khách cần Internet để đặt/thanh toán; PWA không tự gửi lại POST lúc offline.
- Tiền lưu số nguyên VND; size S/M/L phụ thu 0/5.000/10.000; topping 7.000/loại.
- 1 điểm được dùng cho 500 VND; mỗi 10.000 VND chi tiêu nhận 1 điểm (xem hằng số code làm nguồn kiểm chứng).
- Rủi ro: callback lặp, request đồng thời, hết hàng, mất mạng, cloud free tier ngủ, hết quota CI.
- Giảm thiểu: idempotency, transaction/OCC, unique constraint, health check, test đồng thời, retry có giới hạn và rollback.
- Không thể tạo lại lịch sử Sprint/PR đã xảy ra trước đây. Minh chứng quy trình phải lấy từ hoạt động thật sau thời điểm khởi tạo AS2.

## Cập nhật phạm vi 15/11/2026 — website đồ án có liên kết thực tế
Theo yêu cầu nhóm: thêm chuyển khoản ngân hàng thật bằng VietQR, số tiền/nội dung lấy từ payment server; staff đối chiếu tiền về rồi xác nhận. Quét/mở QR không phải xác thực đã thanh toán. Thông tin người nhận chỉ nằm trong env riêng. VNPay giữ sandbox; MoMo không được hiển thị như cổng hoạt động khi chưa có merchant. Không tự chuyển/trích tiền trong kiểm thử.
