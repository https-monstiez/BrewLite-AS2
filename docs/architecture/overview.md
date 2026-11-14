# Task 3 — Kiến trúc phân lớp

## Thành phần và trách nhiệm
| Thành phần | Mã nguồn dự kiến | Trách nhiệm |
|---|---|---|
| Browser/PWA | apps/web | Menu, tùy chọn, giỏ, auth, checkout, quản trị; service worker chỉ offline fallback |
| Next.js | apps/web/src/app | App Router; trang mobile-first; gọi REST qua NEXT_PUBLIC_API_URL |
| API NestJS | apps/api/src | auth, products, orders, payments, promotions, admin, audit |
| Domain services | */*.service.ts | Quote, transaction đặt đơn, chuyển trạng thái, callback/payment và loyalty |
| Prisma/PostgreSQL | apps/api/prisma | Schema, unique keys, OCC, transaction, migration/seed |
| Payment adapter | payments | Ví/Thẻ mô phỏng cho PDF; VNPay sandbox cho mở rộng |
| Logging/health | audit, health.controller.ts | Audit thao tác, runtime logs; /api/health kiểm SELECT 1 |

Client chỉ gửi productId/qty/tùy chọn/mã ưu đãi; không quyết định số tiền hay vai trò. JWT strategy đọc lại role từ DB để thay đổi quyền có hiệu lực ngay. Giá/stock/points phải được kiểm tra trong transaction cuối cùng; quote chỉ là ảnh chụp tham khảo.

## Luồng dữ liệu và nhất quán
1. UI → API qua HTTPS/JSON/JWT; ValidationPipe whitelist/forbidNonWhitelisted.
2. OrdersService → Prisma transaction: idempotency payload + updateMany version/stock + Order/OrderItem.
3. PaymentsService/adapter → transaction claim trạng thái + Payment + User points + LoyaltyTransaction.
4. Return/IPN không dựa vào trạng thái client. Duplicate callbacks không phát sinh biến động tiếp.
5. Quản trị gọi cùng API có RolesGuard; UI ẩn nút không phải biện pháp bảo mật.

## Cấu hình
Local dùng `.env` ngoài Git; CI dùng GitHub Secrets và DB test tách riêng; production dùng secret Vercel/Render. NEXT_PUBLIC_API_URL là URL công khai build-time, không phải secret. Database URL/JWT/VNPay secret tuyệt đối không mang tiền tố NEXT_PUBLIC_.

## Triển khai
Production hiện phục vụ Next.js/PWA trên Vercel và NestJS API/PostgreSQL trên Render; GHCR lưu image tag SHA cho luồng Delivery. Web/API đã được kiểm tra công khai cùng SHA; endpoint và giới hạn xác minh được ghi trong [deployment.md](../deployment.md). Sơ đồ [deployment.svg](../diagrams/deployment.svg) mô tả deployment target và không thay thế dashboard evidence. Render blueprint khai báo DB private, nhưng cần xác minh dashboard để loại trừ cấu hình drift.

## Ưu điểm và trade-off
Monolith module đơn giản cho nhóm nhỏ và transaction SQL; khó scale độc lập từng domain. Giữ tiền số nguyên VND đơn giản nhưng chưa hỗ trợ đa tiền tệ. OCC tránh bán âm mà không giữ khóa kéo dài, nhưng có thể phải retry khi tranh chấp. Service worker không cache dữ liệu cá nhân nên offline chỉ có thông báo/giỏ cục bộ. Ghép Vercel/Render dễ triển khai nhưng cần CORS, build-time URL và quản lý hai nền tảng.

Quyết định chi tiết nằm trong `adr/`.
