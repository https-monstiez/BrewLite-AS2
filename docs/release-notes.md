# v0.2.0 — Release candidate AS2 (chưa phát hành production)

- Tách repo AS2, cấu trúc apps/web + apps/api + docs, giữ lịch sử nền AS1.
- Bổ sung hồ sơ yêu cầu, UML source/SVG, ADR, backlog và truy vết.
- Quote server-side; key checkout giữ qua reload; OCC retry có giới hạn và payment row locking.
- Ví/Thẻ mô phỏng; VNPay sandbox ký HMAC-SHA512, kiểm Return/IPN, amount và callback lặp.
- Loyalty ledger, tùy chọn đường/đá; kho nguyên liệu/công thức, reservation/restoration và phiếu nhập idempotent.
- PWA manifest/icons/offline, loading/empty/error/search và xác nhận đơn từ API.
- Unit/UI, PostgreSQL integration, mobile browser E2E; CI quality gate và CD image SHA/smoke.

Giới hạn: chưa có URL production, merchant sandbox và kết quả deploy thật; QR phương thức thủ công chỉ minh họa. Chưa phát hành tag/release để tránh hiểu nhầm bản đã nghiệm thu. Xem deployment.md để cấu hình, smoke và rollback.

## Bổ sung cho đợt nộp 16–18/11/2026
- render.yaml khai báo API/DB Free, DB chỉ nội bộ; Vercel root apps/web.
- Catalog seed chỉ khi trống, không ghi đè giá/tồn; bootstrap quản trị viên từ secret nhập trên hosting, không cấp quyền cho tài khoản khách có sẵn.
- VietQR chuyển khoản ngân hàng thật, reference/amount từ DB, đối soát bởi staff; dữ liệu người nhận không nằm trong repo.
- Ẩn phương thức chưa cấu hình; MoMo chưa merchant không được coi là cổng hoạt động; VNPay hiện sandbox.
