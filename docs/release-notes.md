# v0.2.0 — Release candidate AS2 (chưa phát hành production)

- Tách repo AS2, cấu trúc apps/web + apps/api + docs, giữ lịch sử nền AS1.
- Bổ sung hồ sơ yêu cầu, UML source/SVG, ADR, backlog và truy vết.
- Quote server-side; key checkout giữ qua reload; OCC retry có giới hạn và payment row locking.
- Ví/Thẻ mô phỏng; VNPay sandbox ký HMAC-SHA512, kiểm Return/IPN, amount và callback lặp.
- Loyalty ledger, tùy chọn đường/đá; kho nguyên liệu/công thức, reservation/restoration và phiếu nhập idempotent.
- PWA manifest/icons/offline, loading/empty/error/search và xác nhận đơn từ API.
- Unit/UI, PostgreSQL integration, mobile browser E2E; CI quality gate và CD image SHA/smoke.

Giới hạn: chưa có URL production, merchant sandbox và kết quả deploy thật; QR phương thức thủ công chỉ minh họa. Chưa phát hành tag/release để tránh hiểu nhầm bản đã nghiệm thu. Xem deployment.md để cấu hình, smoke và rollback.
