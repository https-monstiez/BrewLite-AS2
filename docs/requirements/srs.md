# Task 1.2 — SRS rút gọn

## Quy ước
Must bắt buộc PDF; Should mở rộng ưu tiên; Could mở rộng có điều kiện; Won’t ngoài phạm vi. Tiêu chí dưới đây là cam kết nghiệm thu, trạng thái hiện thực xem ma trận truy vết.

## Yêu cầu chức năng
| ID | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-01 | Xem/tìm menu | Must | GET /products chỉ trả sản phẩm đang bán; UI có loading, empty, error và tìm theo tên. |
| FR-02 | Chi tiết và tùy chọn | Must | GET /products/:id; size S/M/L, topping hợp lệ; hết hàng không thêm được; đường/đá lưu cùng dòng đơn. |
| FR-03 | Giỏ hàng | Must | Thêm/sửa/xóa, số lượng nguyên dương; tùy chọn khác nhau là dòng khác; reload vẫn giữ giỏ. |
| FR-04 | Xác thực và RBAC | Must | Đăng ký email duy nhất; mật khẩu được hash; JWT hết hạn trả 401; CUSTOMER không gọi API quản lý; STAFF không quản trị vai trò. |
| FR-05 | Báo giá và đặt đơn | Must | Server tính lại giá từ DB, validate voucher; transaction tạo đơn/trừ kho; request trùng key cùng payload trả cùng đơn; key khác payload trả 409. |
| FR-06 | Ví/Thẻ mô phỏng | Must | Hai phương thức ghi rõ mô phỏng; thành công chuyển PAID, thất bại PAYMENT_FAILED và hoàn tồn; gửi lặp không phát sinh thanh toán/điểm thứ hai. |
| FR-07 | Lịch sử và theo dõi | Must | Khách chỉ đọc đơn của mình; lịch sử có trạng thái/tổng tiền; trang xác nhận đọc trạng thái thật từ API. |
| FR-08 | Hàng đợi và trạng thái | Must | STAFF/ADMIN xem đơn; chỉ PAID→PREPARING→READY→COMPLETED; chuyển sai trả 409; không dùng API trạng thái để bỏ qua thanh toán. |
| FR-09 | Quản lý thực đơn và tồn | Should | ADMIN thêm/sửa/ẩn món, cập nhật tồn; audit tác nhân; không bán âm hàng khi hai đơn tranh tồn cuối. |
| FR-10 | Khuyến mãi | Should | ADMIN quản lý voucher; server kiểm thời hạn, hạn mức, giá trị tối thiểu; chiết khấu không vượt subtotal. |
| FR-11 | Điểm thành viên | Should | Trừ/nhận/hoàn điểm cùng transaction với đơn; LoyaltyTransaction có reference duy nhất; số dư truy vết được. |
| FR-12 | VNPay sandbox | Should | URL ký HMAC-SHA512; Return/IPN kiểm chữ ký, merchant, amount và reference; callback lặp không cộng điểm hai lần; thiếu cấu hình báo lỗi rõ ràng. |
| FR-13 | Quản trị và audit | Should | ADMIN quản lý khách/vai trò, báo cáo; API không trả passwordHash; STAFF không thể gọi endpoint chỉ ADMIN. |
| FR-14 | Nguyên liệu và công thức | Could | ADMIN nhập kho nguyên liệu, gán định lượng/món; kiểm tra đủ nguyên liệu và ghi biến động khi xác nhận nghiệp vụ. |
| FR-15 | Cổng production chưa merchant/giao hàng | Won’t | Không tự trích tiền qua cổng production khi chưa có merchant, không lưu số thẻ hoặc cung cấp giao hàng; chuyển khoản ngân hàng qua VietQR là phạm vi bổ sung. |

## Yêu cầu phi chức năng
| ID | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-01 | Hiệu năng | Should | Mục tiêu p95 GET /products < 1 giây với 20 người dùng đồng thời, 100 sản phẩm, backend đã warm; đo và lưu log, không tuyên bố đạt khi chưa đo. |
| NFR-02 | Bảo mật | Must | RBAC phía API, JWT, hash bcrypt, validation whitelist; không có secret trong Git/log; production dùng HTTPS và DB chỉ private network. |
| NFR-03 | Khả dụng/PWA | Must | Responsive 360px; manifest/icon cài đặt; service worker offline fallback; không cache API riêng tư; health kiểm DB, lỗi DB trả non-2xx. |
| NFR-04 | Triển khai tái lập | Must | Clone sạch + env mẫu + docker compose up --build chạy web/api/db; migrate deploy không reset dữ liệu; seed chạy tường minh. |
| NFR-05 | Toàn vẹn/đồng thời | Must | Transaction, OCC và idempotency; callback lặp hoặc tranh tồn không trừ hai lần; test bằng PostgreSQL thật. |
| NFR-06 | Chất lượng/CI | Must | PR chạy Install→Lint→Unit Test→Build; branch protection required checks ngăn merge; có log pipeline thành công/thất bại thật. |
| NFR-07 | Delivery/khôi phục | Must | Image tag SHA, deploy bằng secret, smoke health sau deploy, thất bại dừng; runbook rollback không drop DB; URL production thật được ghi khi kiểm chứng. |

## Use-case tổng quát
Nguồn: [use-cases.puml](../diagrams/use-cases.puml); bản xuất: [use-cases.svg](../diagrams/use-cases.svg). UC-01 đặc tả trong checkout-use-case.md.

## FR-16 — Chuyển khoản ngân hàng qua VietQR (Must theo cập nhật nhóm)
Khách tạo đơn/phương thức BANK_TRANSFER rồi nhận QR có tài khoản từ cấu hình, amount từ DB và reference riêng theo payment; API chỉ trả hướng dẫn cho chủ đơn đang PENDING. Trang hiển thị tiền thật/chờ đối soát, không tin status hoặc total từ URL/localStorage. CUSTOMER không tự confirm; STAFF/ADMIN xác nhận sau đối soát, trùng confirm không cộng điểm lại. Cổng MoMo chưa cấu hình phải bị từ chối, không phát sinh giao dịch giả. Thông tin tài khoản không vào Git.
