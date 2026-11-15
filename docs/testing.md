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

## Lần chạy CD có deploy thật đầu tiên

[Run 43682676783](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43682676783) đã qua quality/image và gọi Render deploy thành công commit `9d858115b8b272b6540047838a19562687b61082`. API health công khai báo đúng SHA lúc khoảng 12:56 ICT. Tuy nhiên job deploy thất bại ở bước smoke menu vì script chờ mảng, trong khi `ProductsService.list` trả `{ items, pagination }`. Chưa chạy tới Vercel hook; không đánh dấu CD hoàn thành.

Đã sửa smoke theo contract phân trang thực tế, cập nhật fixture từ cấu trúc API và thêm test hồi quy từ chối response mảng không đúng contract. Bộ test orchestration hiện có **13 test**, tách riêng với 104 test ứng dụng. Tên giảng viên và mốc nộp/bảo vệ đã được điền từ thông tin nhóm.

## Tài khoản demo online theo lựa chọn của nhóm

Nhóm yêu cầu dùng tài khoản demo trong seed cho bản đồ án online. Startup được sửa để chỉ tạo demo accounts khi `SEED_DEMO_ACCOUNTS=true`, kể cả khi catalog đã tồn tại. Mặc định tắt; không ghi đè mật khẩu/role tài khoản đã có hoặc reset giá/tồn catalog. Test PostgreSQL dùng schema riêng để kiểm tra bật/tắt, login hash và không reset/nâng quyền.

Thông báo 401 khi login được sửa thành lỗi email/mật khẩu; request đã có token vẫn báo phiên hết hạn. Hai test frontend mới kiểm tra hai trường hợp riêng. Trước khi bật opt-in, tài khoản ADMIN mặc định trả 401 trên Render; không suy ra từ đó rằng database hoàn toàn không có ADMIN.

## Rà soát cuối sau khi bật demo — 15/11/2026

- Ba lần POST `/api/auth/login` với tài khoản demo trả HTTP **201**, đúng các role ADMIN, STAFF và CUSTOMER. Token/passwordHash không được in hoặc lưu trong hồ sơ kiểm chứng.
- Playwright trên trang login production xác nhận đăng nhập sai trả 401 và hiển thị “Email hoặc mật khẩu không đúng.”; không còn báo nhầm phiên hết hạn. Kiểm tra browser ban đầu chạy trước hydration bị timeout; chạy lại sau `networkidle` đã quan sát đúng request/response và thông báo.
- API và web đã lên commit `ebff7514ffa1f576889bf7aa61bfa49ec23e3c8d`.
- [Delivery run 43684074987](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43684074987) qua quality/image nhưng job deploy lỗi `Unexpected end of JSON input` sau khi gửi yêu cầu deploy. Chưa đánh dấu Task 5.3 hoàn tất. Render API có phản hồi 202 Queued; script cần chấp nhận body rỗng, tìm deployment mới đúng SHA rồi chờ live thay vì parse JSON vô điều kiện.
- `npm run test:delivery`: **16/16** test local đạt sau bản sửa queued response, gồm loại deployment cũ cùng SHA và không nhận nhầm deployment của SHA khác. Cấu trúc list response được đối chiếu với API/CLI chính thức của Render.
- PR #7 CI đạt: frontend 7 test, PostgreSQL 12 test (thêm seed regression), backend 84 test và browser 4 test. Đây là **107 test ứng dụng**, tách riêng với test orchestration CD.

## CD hoàn chỉnh và video production — 15/11/2026

[Run 43685179367](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367) có quality, image, **deploy** và delivery-status success; deploy-vps skipped đúng target Render. Web `/version` và API health cùng trả `2af63a27619e7062e94bc6163643448e08a1b7f8`, health/menu HTTP 200 và catalog có 5 món. Đây là lần quan sát CI deploy/smoke production đã thành công, thay thế trạng thái pending trong các snapshot lịch sử phía trên.

Bộ kiểm tra hiện có: **84 backend + 7 frontend + 12 PostgreSQL + 4 browser = 107 test ứng dụng**, cộng **16 test CD orchestration**, tổng **123**. CI quality trên run nêu trên đã đạt.

[Video mobile](demo/README.md) ghi checkout trên production bằng Playwright: đăng nhập CUSTOMER, chọn Americano M/đường đá 50%, giỏ giữ qua reload, thanh toán Thẻ mô phỏng 40.000đ và xác nhận PAID từ API. Không mock API/không chuyển tiền thật; video dài khoảng 20,12 giây, 390×844. Đây là ghi hình tự động, không phải Sprint Review hay nghiệm thu của giảng viên.

## Thay đổi quyền push theo yêu cầu chủ repo — 15/11/2026

GitHub đã tắt enforce_admins trên main, không yêu cầu PR review. Admin được push thẳng và có quyền bypass required checks. Required check `Lint, tests and build`/strict vẫn được cấu hình cho đối tượng chịu branch protection; CI trên main và quality gate trước deploy vẫn giữ. Các ghi nhận enforce_admins phía trên là snapshot trước thay đổi này.

## Đổi phạm vi thanh toán khi hợp nhất nhánh — 15/11/2026

Chủ repo chọn gộp update-payment-methods và chỉ giữ BANK_TRANSFER/LOYALTY_POINTS. Bộ integration được đổi sang kiểm tra đối soát ngân hàng đúng một lần, ledger, tranh chấp payment và hoàn tồn khi hủy đơn pending; các phương thức/endpoint đã bỏ được kiểm tra từ chối. Browser checkout dùng API test và tài khoản nhận giả, xác nhận bởi ADMIN test, không gửi tiền thật. Các kết quả mô phỏng/VNPay và video ở phần lịch sử áp dụng cho release trước; không xem là chức năng còn được bật trên main mới.
