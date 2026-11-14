# Kiểm chứng AS2 — 15/11/2026

Kết quả local đã quan sát trong repo AS2, database test tách biệt. Không dùng kết quả này thay cho production hoặc CI GitHub.

| Kiểm tra | Kết quả |
|---|---|
| ESLint API và web | Pass |
| TypeScript/NestJS build | Pass |
| Next.js production build | Pass, 20 routes |
| Backend Jest unit/HTTP authorization | 84/84 pass (8 suites) |
| Frontend Vitest UI/cart | 5/5 pass (2 files) |
| PostgreSQL integration | 9/9 pass, migration đầy đủ trên DB sạch |
| Playwright Chromium mobile | 2/2 pass: checkout thực + PWA offline |
| Docker Compose sạch | Web/API/DB up --build --wait đạt; seed 5 món |
| Container smoke | Web, /api/health, /api/products, manifest, service worker trả 200 |
| UML | 7 sơ đồ có nguồn PlantUML và SVG |

Tổng cộng 100 test local: 84 backend + 5 frontend + 9 integration + 2 browser. Unit/API authorization dùng mocks không được coi là PostgreSQL integration; suite checkout.integration-spec dùng PostgreSQL thật và browser không mock API.

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

## Chưa có minh chứng bên ngoài
Chờ link PR/CI GitHub và required checks. VPS/Vercel/Render, HTTPS thật, merchant sandbox, release production và demo có người nghiệm thu chưa được cấu hình hoặc xác minh. Log cục bộ không chứng minh các mục này đã hoàn thành.
