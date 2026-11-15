# BrewLite AS2 — Production deployment record

Deployment được kiểm tra công khai ngày 15/11/2026, SHA `ab5af1728c75be75c6b5c7d150fcd6ed6028d409`:
- Web: https://brew-lite-as-2.vercel.app/
- API health: https://brewlite-as2-api.onrender.com/api/health (`status: ok`)
- API menu: https://brewlite-as2-api.onrender.com/api/products (5 sản phẩm)

GitHub Release `v0.2.0`: https://github.com/https-monstiez/BrewLite-AS2/releases/tag/v0.2.0 (tag trên commit production). Đây là ghi nhận deploy/smoke, không phải xác nhận đã thực hiện demo hoặc buổi review/retro.

- Tách repo AS2, cấu trúc apps/web + apps/api + docs, giữ lịch sử nền AS1.
- Bổ sung hồ sơ yêu cầu, UML source/SVG, ADR, backlog và truy vết.
- Quote server-side; key checkout giữ qua reload; OCC retry có giới hạn và payment row locking.
- Ví/Thẻ mô phỏng; VNPay sandbox ký HMAC-SHA512, kiểm Return/IPN, amount và callback lặp.
- Loyalty ledger, tùy chọn đường/đá; kho nguyên liệu/công thức, reservation/restoration và phiếu nhập idempotent.
- PWA manifest/icons/offline, loading/empty/error/search và xác nhận đơn từ API.
- Unit/UI, PostgreSQL integration, mobile browser E2E; CI quality gate và CD image SHA/smoke.

Giới hạn: VNPay sandbox chỉ hoạt động khi có merchant; QR chuyển khoản dùng đối soát bởi nhân viên; không tuyên bố đã xác minh giao dịch ngân hàng thật. Xem deployment.md để biết smoke, rollback và giới hạn bằng chứng.

## Bổ sung cho đợt nộp 16–18/11/2026
- render.yaml khai báo API/DB Free, DB chỉ nội bộ; Vercel root apps/web.
- Catalog seed chỉ khi trống, không ghi đè giá/tồn; bootstrap quản trị viên từ secret nhập trên hosting, không cấp quyền cho tài khoản khách có sẵn.
- VietQR chuyển khoản ngân hàng thật, reference/amount từ DB, đối soát bởi staff; dữ liệu người nhận không nằm trong repo.
- Ẩn phương thức chưa cấu hình; MoMo chưa merchant không được coi là cổng hoạt động; VNPay hiện sandbox.

## Bổ sung kiểm chứng cuối — 15/11/2026

- [CI deploy/smoke production thành công](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367) trên `2af63a27619e7062e94bc6163643448e08a1b7f8`, web/API cùng SHA; Git-backed Render nhận commitId, hỗ trợ response 202 Queued.
- Nhóm chọn bật demo accounts tường minh; không reset credential/role hay catalog hiện có. Ba role đã đăng nhập online thành công.
- Lỗi login 401 hiển thị email/mật khẩu không đúng thay cho phiên hết hạn.
- [Video demo checkout mobile](demo/README.md) trên API thật, thanh toán mô phỏng.
- 107 test ứng dụng và 16 test orchestration CD; biên bản Review/Retrospective vẫn cần nhóm thực hiện.
