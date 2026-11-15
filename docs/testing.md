# Kiểm chứng AS2 — 15/11/2026

Kết quả local đã quan sát trong repo AS2, database test tách biệt. Không dùng kết quả này thay cho production hoặc CI GitHub.

| Kiểm tra | Kết quả |
|---|---|
| ESLint API và web | Pass |
| TypeScript/NestJS build | Pass |
| Next.js production build | Pass, 20 routes |
| Backend Jest unit/HTTP authorization | 84/84 pass (8 suites) |
| Frontend Vitest UI/cart | 5/5 pass (2 files) |
| PostgreSQL integration | 11/11 pass, migration đầy đủ trên DB sạch |
| Playwright Chromium mobile | 4/4 pass: checkout, PWA offline, chuyển khoản và quản trị |
| Docker Compose sạch | Web/API/DB up --build --wait đạt; seed 5 món |
| Container smoke | Web, /api/health, /api/products, manifest, service worker trả 200 |
| UML | 7 sơ đồ có nguồn PlantUML và SVG |
| VPS DB roles local | Migrator/app không superuser; migrate bằng migrator, app SELECT được và CREATE TABLE bị từ chối |

Tổng cộng 104 test local: 84 backend + 5 frontend + 11 integration + 4 browser. Unit/API authorization dùng mocks không được coi là PostgreSQL integration; suite checkout.integration-spec dùng PostgreSQL thật và browser không mock API.

## Các tình huống đã kiểm chứng
- JWT/RBAC, owner-only order, client không tự gửi total.
- Hai create cùng key trả cùng ID; thay đường/payload cùng key bị từ chối.
- Hai payment key cho một đơn chỉ tạo một giao dịch pending.
- Thanh toán mô phỏng lặp chỉ cộng một ledger entry.
- VNPay callback sai chữ ký/amount bị từ chối; Return/IPN song song chỉ settle một lần.
- Từ chối thanh toán trả tồn thành phẩm/nguyên liệu đúng một lần.
- Nhập kho cùng mã phiếu không cộng trùng; CUSTOMER không quản trị kho.
- Không chuyển PENDING→PAID bằng API trạng thái, không nhảy PAID→COMPLETED.
- Hai đơn tranh tồn cuối chỉ có một đơn thành công.
- Browser: menu→chi tiết/tùy chọn→giỏ/reload→đăng ký→thẻ mô phỏng→xác nhận đã đọc API.
- Browser production PWA: đăng ký service worker, mất mạng phục vụ trang offline.

## Đo hiệu năng local
100 GET /products, 20 requests đồng thời, DB có thêm 100 sản phẩm, backend warm: p95 **59,4 ms** trong lần đo đã ghi. Đây là số đo một máy/local, không phải SLA hay số liệu production; CI có thể khác. Mỗi lần integration test in MENU_PERFORMANCE để lưu số đo thực tế.

## Tái lập
Xem README và apps/api/test/checkout.integration-spec.ts; dùng TEST_DATABASE_URL trỏ DB riêng, chạy migrate deploy trước test. Test browser tạo tài khoản/đơn demo trong DB test dùng một lần. Docker local smoke dùng project riêng brewlite-as2-smoke, cổng 3200/3201.

## Minh chứng GitHub và giới hạn production
PR thực tế: [AS2 #1](https://github.com/https-monstiez/BrewLite-AS2/pull/1). Lần CI đầu [43630037027](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43630037027) phát hiện lỗi quoting health command PostgreSQL ở bước khởi tạo container (chưa chạy lint/test); sửa bằng health command một từ và chạy lại. Không coi log lỗi khởi tạo là test nghiệp vụ đã chạy. Ngày 15/11/2026, website Vercel và API Render production trả lời công khai; GET menu trả 5 sản phẩm, health `status: ok`, `/version` và health cùng SHA `ab5af1728c75be75c6b5c7d150fcd6ed6028d409`. Render dashboard xác nhận service/database Free và PostgreSQL inbound rules trống; `DATABASE_URL` có trong Environment nhưng giá trị không được xem/chia sẻ. GitHub Release [v0.2.0](https://github.com/https-monstiez/BrewLite-AS2/releases/tag/v0.2.0) đã tạo trên commit production. Chưa xác minh Vercel settings, billing chi tiết, merchant Sandbox, giao dịch thật hoặc video/demo có người nghiệm thu.


## CI và bảo vệ nhánh đã kiểm chứng
- PR: https://github.com/https-monstiez/BrewLite-AS2/pull/1
- CI đạt đầy đủ trên GitHub: https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43630218891 (commit 2dcdc0f; gồm browser E2E).
- CI phát hiện lỗi cấu hình trước khi sửa: https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43630037027. Lỗi ở PostgreSQL service health quoting, không phải test nghiệp vụ thất bại.
- Repo AS2 đã chuyển public theo xác nhận của chủ tài khoản; main có required check `Lint, tests and build`, strict/up-to-date và enforce_admins.
- Caddy production config đã validate bằng image caddy:2-alpine; DB init VPS đã thử trong container, migrator/app không superuser và app role bị từ chối CREATE TABLE.
- VPS không phải phương án hosting production được chọn; production hiện dùng Vercel/Render như nêu trên. Chưa có merchant VNPay production hoặc giao dịch tiền thật; không thay thế các mục này bằng kết quả Sandbox/local/CI.

## Kiểm chứng bổ sung cho deploy Free và VietQR
- Render Blueprint đạt JSON Schema chính thức; đúng 1 Web Service Free + 1 Postgres Free, ipAllowList rỗng.
- Chạy seed trên DB test trống: có 5 sản phẩm; lần sau giữ nguyên giá/tồn đã sửa và không tạo tài khoản mặc định.
- PostgreSQL integration mở rộng: bootstrap quản trị không reset password/nâng quyền khách; hướng dẫn VietQR chỉ chủ đơn PENDING được đọc; total/reference do server quyết định; quét QR không đổi trạng thái; CUSTOMER không confirm, STAFF confirm một lần.
- Thông tin tài khoản nhận của nhóm chỉ được lưu trong env riêng. Dữ liệu CI/browser dùng tài khoản giả và không chuyển tiền thật.

Kết quả local bổ sung đã đạt: 84 backend unit/HTTP + 5 frontend + 11 PostgreSQL integration + 4 browser = **104 test**. Browser gồm chuyển khoản chờ đối soát và đăng nhập/refresh trang quản trị. Các lần CI trước vẫn là minh chứng của bản nền; bản bổ sung được kiểm tra qua PR triển khai Free/VietQR.

## Kiểm tra sau cập nhật hồ sơ và CD — 15/11/2026

- Public smoke lúc khoảng 12:34 ICT: web `/version` trả `e9b394940009688ac0ec8e46a30ed3c5f018f1a6`, API health trả `ab5af1728c75be75c6b5c7d150fcd6ed6028d409` và `status: ok`. Hai bản chưa cùng SHA; kết quả kiểm tra trước đó là ảnh chụp lịch sử.
- [Delivery run 43644852017](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43644852017): quality/image thành công; deploy và deploy-vps bị skipped. Task 5.3 chưa được nghiệm thu.
- Đã kiểm tra danh sách tên cấu hình GitHub: repository chưa có Actions secrets hoặc variables. Không đọc giá trị secret.
- `npm run test:delivery`: 12/12 test orchestration đạt ở local; mô phỏng HTTP, không phải bằng chứng deploy production. Bao gồm Git commit pinning, cold start, lỗi Render/Vercel, SHA không khớp và che secret khi lỗi mạng. Các test này tách riêng với 104 test ứng dụng đã ghi nhận trước đó.
