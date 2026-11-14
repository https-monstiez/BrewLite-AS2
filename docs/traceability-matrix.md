# Ma trận truy vết AS2

Nguồn thiết kế trong docs/diagrams, mã nguồn trong apps/api và apps/web. Cột trạng thái phân biệt code local với minh chứng bên ngoài; log cuối xem testing.md.

| Mã | Use-case/Story | Thiết kế | Code/API | Test | Trạng thái/giới hạn |
|---|---|---|---|---|---|
| FR-01 | US-01 | activity-checkout, class-domain | products API, web/app/page | products.e2e-spec; menu.test | Hiện thực; kiểm thử local |
| FR-02 | UC-01/US-04 | class-domain | orders DTO/schema; web/menu/[id] | checkout.integration-spec; browser checkout | Size/topping/đường/đá đã nối |
| FR-03 | US-04 | activity-checkout | cart-store, AppContext, cart page | cart.test; browser checkout | Giỏ lưu qua reload |
| FR-04 | US-05 | sequence-checkout | auth, jwt.strategy, RolesGuard | jwt.strategy.spec; api.e2e-spec; integration | RBAC phía API |
| FR-05 | UC-01 | sequence-checkout | orders/quote, OrdersService.create | orders.service.spec; integration quote/dedup/oversell | Transaction/OCC/retry |
| FR-06 | UC-01 | sequence-checkout | payments create/simulate, VnpayService.settle | integration simulation/races/failure; browser checkout | Ví/Thẻ mô phỏng |
| FR-07 | US-06 | activity-checkout | orders/me, orders/:id, confirmation | integration ownership; browser checkout | Xác nhận đọc API |
| FR-08 | US-06 | activity-checkout | orders management/status; web/admin/orders | integration transitions; api.e2e-spec | Chặn bỏ qua thanh toán |
| FR-09 | US-07 | class-domain | products management, product.version | products.e2e-spec; integration oversell | Kho thành phẩm |
| FR-10 | US-07 | class-domain | promotions; quote/order discount | orders.service.spec | Voucher phía server |
| FR-11 | US-07 | class-domain | LoyaltyTransaction; payment/refund | payments.service.spec; integration ledger | Ledger nguyên tử |
| FR-12 | UC-01 | sequence-checkout | VnpayService, public Return/IPN | integration valid/invalid signature, amount, duplicate | Logic kiểm thử bằng callback ký tại local; chưa merchant live |
| FR-13 | US-07 | use-cases | admin, audit modules | admin.e2e-spec | Manager dùng ADMIN |
| FR-14 | US-09 | class-domain | inventory module, reservations, ingredients page | integration stock/receipts/roles | Nguyên liệu + công thức |
| FR-15 | Ngoài phạm vi | context-and-scope | Không cung cấp thanh toán thật/giao hàng | Kiểm tra phạm vi | Won’t |
| NFR-01 | Menu | overview | products API | integration performance 100 sản phẩm/20 clients | Đo local; không suy ra SLA cloud |
| NFR-02 | Auth/checkout | ADR-002/003 | JWT/RBAC/DTO/security headers | authorization, JWT, integration tampering | HTTPS/private DB cần xác minh cloud |
| NFR-03 | PWA | ADR-005 | manifest/icons/sw/offline, health | UI states; browser; health.e2e-spec | Chưa kiểm install trên thiết bị vật lý |
| NFR-04 | US-02 | deployment | Dockerfile/compose/migrations/seed | Compose smoke và migrations | Compose build/up/health/seed local đã đạt |
| NFR-05 | UC-01 | ADR-002 | transaction/unique/OCC/row claims | PostgreSQL concurrent integration | Đã có test tranh chấp |
| NFR-06 | US-02 | ADR-001 | ci.yml | GitHub PR workflow runs | Cần minh chứng CI và branch protection thật |
| NFR-07 | US-08 | deployment/ADR-004 | cd.yml, deploy.mjs | Production smoke/version | Chưa có cloud/URL; chưa hoàn thành |
