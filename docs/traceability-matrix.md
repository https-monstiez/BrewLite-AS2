# Ma trận truy vết AS2

Nguồn thiết kế trong docs/diagrams, mã nguồn trong apps/api và apps/web. Cột trạng thái phân biệt code local với minh chứng bên ngoài; log cuối xem testing.md.

| Mã | Use-case/Story | Thiết kế | Code/API | Test | Trạng thái/giới hạn |
|---|---|---|---|---|---|
| FR-01 | US-01 | activity-checkout, class-domain | products API, web/app/page | products.e2e-spec; menu.test | Hiện thực; kiểm thử local |
| FR-02 | UC-01/US-04 | class-domain | orders DTO/schema; web/menu/[id] | checkout.integration-spec; browser checkout | Size/topping/đường/đá đã nối |
| FR-03 | US-04 | activity-checkout | cart-store, AppContext, cart page | cart.test; browser checkout | Giỏ lưu qua reload |
| FR-04 | US-05 | sequence-checkout | auth, jwt.strategy, RolesGuard | jwt.strategy.spec; api.e2e-spec; integration | RBAC phía API |
| FR-05 | UC-01 | sequence-checkout | orders/quote, OrdersService.create | orders.service.spec; integration quote/dedup/oversell | Transaction/OCC/retry |
| FR-06 | UC-01 / yêu cầu gốc | Thay đổi phạm vi ngân hàng/điểm | Endpoint simulate đã gỡ; tạo payment chỉ nhận bank/points | integration kiểm từ chối phương thức đã bỏ | Có ở v0.2.1; không đáp ứng FR-06 trên main hiện tại |
| FR-07 | US-06 | activity-checkout | orders/me, orders/:id, confirmation | integration ownership; browser checkout | Xác nhận đọc API |
| FR-08 | US-06 | activity-checkout | orders management/status; web/admin/orders | integration transitions; api.e2e-spec | Chặn bỏ qua thanh toán |
| FR-09 | US-07 | class-domain | products management, product.version | products.e2e-spec; integration oversell | Kho thành phẩm |
| FR-10 | US-07 | class-domain | promotions; quote/order discount | orders.service.spec | Voucher phía server |
| FR-11 | US-07 | class-domain | LoyaltyTransaction; payment/refund | payments.service.spec; integration ledger | Ledger nguyên tử |
| FR-12 | UC-01 / phạm vi cũ | Thay đổi phạm vi | Mã cũ còn lưu nhưng controller/service không nối vào module hiện tại | integration kiểm Return/simulate không hoạt động | VNPay không hoạt động trên main |
| FR-13 | US-07 | use-cases | admin, audit modules | admin.e2e-spec | Manager dùng ADMIN |
| FR-14 | US-09 | class-domain | inventory module, reservations, ingredients page | integration stock/receipts/roles | Nguyên liệu + công thức |
| FR-15 | Ngoài phạm vi | context-and-scope | Không cung cấp cổng production chưa merchant hoặc giao hàng; chuyển khoản VietQR thuộc FR-16 | Kiểm tra phạm vi | Won’t |
| FR-16 | UC-01 chuyển khoản thật | sequence-checkout, cập nhật phạm vi | BankTransferService; /payments/methods; /payments/bank-transfer/:orderId; confirmation | PostgreSQL bank reconciliation + browser bank checkout | VietQR tạo QR; staff đối soát; không tuyên bố xác minh tài khoản/thực nhận tiền khi chưa đối soát |
| NFR-01 | Menu | overview | products API | integration performance 100 sản phẩm/20 clients | Đo local; không suy ra SLA cloud |
| NFR-02 | Auth/checkout | ADR-002/003 | JWT/RBAC/DTO/security headers | authorization, JWT, integration tampering | HTTPS web/API smoke đạt; DB inbound private đã có minh chứng dashboard trong deployment.md |
| NFR-03 | PWA | ADR-005 | manifest/icons/sw/offline, health | UI states; browser; health.e2e-spec | Chưa kiểm install trên thiết bị vật lý |
| NFR-04 | US-02 | deployment | Dockerfile/compose/migrations/seed | Compose smoke và migrations | Compose build/up/health/seed local đã đạt |
| NFR-05 | UC-01 | ADR-002 | transaction/unique/OCC/row claims | PostgreSQL concurrent integration | Đã có test tranh chấp |
| NFR-06 | US-02 | ADR-001 | ci.yml | GitHub PR workflow runs | CI đạt; required check có cấu hình nhưng admin được bypass push main, không cưỡng chế NFR-06 hoàn toàn |
| NFR-07 | US-08 | deployment/ADR-004 | Render Git deploy (`render.yaml`); GH Actions build SHA (`cd.yml`) | Public web, API health/menu và version smoke; CI/Delivery runs | Run CI deploy/smoke 43710893938 đạt trên 55c02e4; DB private và video ngân hàng PENDING có minh chứng; v0.2.1 là bản cũ, Review/Retrospective còn dự thảo |
