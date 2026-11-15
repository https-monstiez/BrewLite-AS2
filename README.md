# BrewLite — Assignment 2

Hệ thống đặt cà phê trực tuyến cho đồ án kết thúc học phần. Ứng dụng sử dụng Next.js/PWA, NestJS và PostgreSQL/Prisma, hỗ trợ đặt món trên điện thoại và quản lý vận hành cửa hàng.

## Demo trực tuyến

| Thành phần | Đường dẫn |
| --- | --- |
| Website | [brew-lite-as-2.vercel.app](https://brew-lite-as-2.vercel.app/) |
| API health | [brewlite-as2-api.onrender.com/api/health](https://brewlite-as2-api.onrender.com/api/health) |
| API menu | [Danh sách sản phẩm](https://brewlite-as2-api.onrender.com/api/products) |
| Mã nguồn AS2 | [https-monstiez/BrewLite-AS2](https://github.com/https-monstiez/BrewLite-AS2) |

Backend Render Free có thể cần khoảng một phút để khởi động sau thời gian không sử dụng. Nếu lần đầu tải menu chậm, chờ API hoạt động rồi tải lại trang.

AS2 phát triển từ [BrewLite AS1](https://github.com/leehieu36/BrewLite). Mọi thay đổi của AS2 được thực hiện trong repo riêng này.

## Thành viên

| Họ và tên | MSSV |
| --- | --- |
| Lê Ngọc Hiếu | 3124410095 |
| Nguyễn Tiến Đạt | 3124410060 |

## Chức năng chính

- **Khách hàng:** xem và tìm món, chọn size/topping/đường/đá, lưu giỏ hàng, đăng ký/đăng nhập, áp dụng voucher, đổi điểm và theo dõi đơn.
- **Nhân viên (`STAFF`):** đối soát chuyển khoản và xử lý đơn theo trạng thái pha chế, sẵn sàng, hoàn tất.
- **Quản lý (`ADMIN`):** quản lý menu, tài khoản, voucher, nguyên liệu, công thức và nhật ký thao tác.
- **Thanh toán:** Ví/Thẻ mô phỏng; chuyển khoản ngân hàng bằng VietQR và đối soát thủ công; tích hợp VNPay sandbox khi có cấu hình merchant. MoMo chưa được kích hoạt.
- **Độ tin cậy:** server tính tiền và kiểm tồn; transaction, idempotency và kiểm soát cập nhật đồng thời bảo vệ thao tác đặt hàng/thanh toán.
- **PWA:** giao diện di động, manifest và trang dự phòng khi mất mạng.

## Cấu trúc
```text
apps/web/                 Next.js App Router, Zustand, PWA, Vitest
apps/api/                 NestJS, Prisma schema/migrations/seed, Jest
  src/inventory/          Kho nguyên liệu, công thức và biến động
  src/payments/           Điểm, Ví/Thẻ mô phỏng, VNPay sandbox
  test/                   Unit, HTTP authorization, PostgreSQL integration
docs/requirements/        Task 1: phạm vi, SRS, UC-01
docs/diagrams/            Task 2: UML nguồn PlantUML và SVG
docs/architecture/        Task 3: kiến trúc, ADR
docs/process/             Backlog, review/retro và checklist bàn giao
tests/e2e/                Playwright: mobile menu → xác nhận
.github/workflows/        CI và Delivery
scripts/deploy.mjs        Render deploy + smoke SHA, Vercel hook + smoke SHA
```

## Bắt đầu từ đầu

Nhóm chưa có VPS/cloud có thể theo [hướng dẫn từng bước](docs/bat-dau.md) để chạy và demo local trước.

## Chạy local với Docker
Cần Docker Compose v2. Từ root:
```sh
# Chỉ sao chép nếu chưa có .env; giữ cấu hình hiện tại nếu đã có.
cp .env.example .env
# Đổi POSTGRES_PASSWORD và JWT_SECRET trong .env
# Nếu password DB có ký tự đặc biệt, URL-encode trước khi ghép DATABASE_URL.
docker compose up --build -d --wait
docker compose exec api npm run db:seed
```
Web http://localhost:3000; API http://localhost:3001/api; health http://localhost:3001/api/health. PostgreSQL không publish cổng ra host. Nếu AS1 đang chạy các cổng này, dùng cổng khác cho AS2; ví dụ đặt `WEB_PORT=3200`, `API_PORT=3201`, `NEXT_PUBLIC_API_URL=http://localhost:3201/api` và `FRONTEND_ORIGIN=http://localhost:3200` trong `.env` trước khi build.

Seed mặc định chỉ tạo/upsert 5 món, không reset tồn hiện tại. Tài khoản demo chỉ tạo khi `SEED_DEMO_ACCOUNTS=true` và không thay mật khẩu tài khoản đã tồn tại. Không bật seed demo ở production. Cách tạo tài khoản quản lý trên Render được hướng dẫn bên dưới.

## Chạy trực tiếp
Node.js 22.12+ và PostgreSQL 16. Hai app có lockfile riêng:
```sh
npm run install:apps
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Cấu hình DATABASE_URL, JWT_SECRET, PAYMENT_MODE=simulation và URL API.
npm run prisma:generate --prefix apps/api
npm run prisma:deploy --prefix apps/api
npm run db:seed --prefix apps/api
npm run start:dev --prefix apps/api
# Terminal khác:
npm run dev --prefix apps/web
```

## Tạo tài khoản quản lý trên Render

1. Mở service `brewlite-as2-api` → **Environment** và thêm hai biến:

   | Biến | Giá trị |
   | --- | --- |
   | `BOOTSTRAP_ADMIN_EMAIL` | Email mới dành cho quản lý |
   | `BOOTSTRAP_ADMIN_PASSWORD` | Mật khẩu riêng, ít nhất 12 ký tự |

2. Lưu thay đổi và redeploy. Khi API khởi động thành công, đăng nhập trên website bằng tài khoản vừa cấu hình.
3. Xóa hai biến bootstrap và redeploy sau khi đã đăng nhập được. Tài khoản được lưu trong database.
4. Dùng màn hình quản lý tài khoản để cấp quyền `STAFF` cho thành viên cần xử lý đơn.

Script khởi tạo không nâng quyền tài khoản khách hàng/nhân viên đã tồn tại và không đặt lại mật khẩu ADMIN đã có. Không đưa mật khẩu, token hoặc thông tin kết nối database vào GitHub.

## Kiểm thử và build
```sh
npm run lint
npm test
npm run test:delivery
npm run build
```
Unit/HTTP tests backend dùng mocks có kiểm soát; **không** coi đó là test PostgreSQL thực. Test tích hợp dùng DB tách riêng, migration đầy đủ và kiểm tra transaction/idempotency/OCC/callback:
```sh
# Chỉ dùng URL của database test, không phải production.
# Nếu chưa có database test, tạo một PostgreSQL riêng bằng Docker:
docker run --name brewlite-as2-test-db -e POSTGRES_USER=as2test -e POSTGRES_PASSWORD=as2_test_only -e POSTGRES_DB=brewlite_as2_test -p 127.0.0.1:55432:5432 -d postgres:16-alpine
# Đợi pg_isready báo accepting connections; nếu container đã có, dùng docker start thay docker run.
docker exec brewlite-as2-test-db pg_isready -U as2test -d brewlite_as2_test
export TEST_DATABASE_URL='postgresql://as2test:as2_test_only@127.0.0.1:55432/brewlite_as2_test'
DATABASE_URL="$TEST_DATABASE_URL" npm run prisma:deploy --prefix apps/api
npm run test:integration --prefix apps/api
DATABASE_URL="$TEST_DATABASE_URL" npm run db:seed --prefix apps/api
NEXT_PUBLIC_API_URL=http://127.0.0.1:3101/api npm run build --prefix apps/web
cd apps/web
npx playwright install chromium
npm run test:e2e
```
Playwright tự chạy API :3101 và web :3100, dùng database test được chỉ định. Không dùng server AS1. Browser test tạo user và đơn demo riêng; database test là dữ liệu dùng một lần. CI tự cung cấp PostgreSQL service và upload trace/report khi lỗi.

## Quy tắc nghiệp vụ
- Giá gốc size S; M +5.000, L +10.000; mỗi topping +7.000. Server quyết định giá, voucher và tồn.
- Định lượng nguyên liệu g/ml/cái theo size S; M ×1,25 và L ×1,5, làm tròn lên từng đơn vị/cốc. Món chưa có công thức chỉ kiểm tồn thành phẩm; cấu hình công thức để bật kiểm nguyên liệu.
- Giữ tồn thành phẩm và nguyên liệu trong transaction tạo đơn. Thanh toán bị từ chối hoặc hủy trước pha trả tồn đúng một lần; đã pha không trả nguyên liệu đã dùng.
- 500 VND/điểm khi đổi; 10.000 VND chi tiêu nhận 1 điểm. Ledger ghi nhận trừ/nhận/hoàn/thu hồi điểm. Thu hồi điểm đã tiêu có thể tạo số dư âm và ngăn đổi tiếp đến khi bù đủ.
- Idempotency-Key: cùng key/payload trả cùng kết quả; khác payload/phương thức bị từ chối. UI lưu key checkout qua reload.
- Chỉ giao dịch thanh toán đổi PENDING→PAID. Nhân viên chỉ PAID→PREPARING→READY→COMPLETED; bước sai trả 409.
- Ví/Thẻ mô phỏng không thu tiền thật. VNPay là sandbox có HMAC-SHA512/Return/IPN; cần merchant cấu hình. BANK_TRANSFER sử dụng VietQR với tài khoản nhận trong env riêng, tổng tiền và reference từ DB; đây là chuyển khoản thật nhưng phải chờ STAFF/ADMIN đối soát. MoMo chưa có merchant nên không được hiển thị/khởi tạo như cổng đang hoạt động.
- PWA có manifest/icons/offline fallback; không cache API riêng tư, không tự replay thanh toán khi có mạng lại.

## Deploy miễn phí cho đồ án

Hạn nộp 16/11/2026, demo 18/11/2026: dùng Vercel Hobby + Render Free API/PostgreSQL, không cần VPS/domain. Xem [hướng dẫn từng bước](docs/deploy-mien-phi.md).

[Deploy API + DB lên Render](https://render.com/deploy?repo=https://github.com/https-monstiez/BrewLite-AS2) — kiểm tra cả hai tài nguyên vẫn là Free trước khi xác nhận. Database Free hết hạn sau 30 ngày; backend có cold start. `render.yaml` chặn DB public và lấy URL nội bộ, JWT được tạo trên nền tảng.

## Triển khai VPS (phương án thay thế)

Production hiện dùng Vercel + Render. Bộ [deploy/vps](deploy/vps) là phương án tự quản thay thế, gồm Compose, Caddy HTTPS, DB roles và deploy/rollback theo SHA; xem [hướng dẫn VPS](docs/vps-deployment.md). Không cần vận hành song song VPS với hosting hiện tại.

## CI/CD và production

Task 5.3 còn cần cấu hình secrets và chạy deploy/smoke qua CI. Xem [hướng dẫn bật CD](docs/cd-setup.md); job đóng gói màu xanh không chứng minh production đã được workflow triển khai.
[Hướng dẫn triển khai/rollback](docs/deployment.md), [ma trận truy vết](docs/traceability-matrix.md), [checklist](docs/process/handover.md).
[Báo cáo Assignment 2](docs/report-as2.md). Nhóm cần bổ sung thông tin lớp/giảng viên, video demo và biên bản Review/Retrospective thực tế trước khi nộp.

CI chạy Install→Lint→Test→Build, integration PostgreSQL và browser E2E. Nhánh `main` có required check `Lint, tests and build`. CD đóng gói API image SHA lên GHCR và chỉ chạy job deploy khi `PRODUCTION_DEPLOY_ENABLED=true` cùng đủ secret/URLs.

**Production đã triển khai và smoke công khai:** [website](https://brew-lite-as-2.vercel.app/), [API health](https://brewlite-as2-api.onrender.com/api/health), [API menu](https://brewlite-as2-api.onrender.com/api/products). Ở lần kiểm tra lúc khoảng 12:34 ICT ngày 15/11/2026, web báo `e9b3949` và API báo `ab5af17`; cả hai phản hồi nhưng chưa đồng bộ SHA. Chi tiết và giới hạn xác minh xem [deployment.md](docs/deployment.md). Trạng thái release và các minh chứng bàn giao được theo dõi trong báo cáo và checklist; deployment không thay thế video demo hoặc biên bản làm việc nhóm.

## Tài liệu đồ án

| Nội dung | Tài liệu |
| --- | --- |
| Báo cáo tổng hợp AS2 | [Báo cáo](docs/report-as2.md) |
| Phạm vi và yêu cầu | [Phạm vi](docs/requirements/context-and-scope.md), [SRS](docs/requirements/srs.md), [Use case checkout](docs/requirements/checkout-use-case.md) |
| UML và kiến trúc | [Sơ đồ](docs/diagrams/README.md), [Kiến trúc](docs/architecture/overview.md) |
| Truy vết và kiểm thử | [Ma trận truy vết](docs/traceability-matrix.md), [Hướng dẫn kiểm thử](docs/testing.md) |
| Triển khai | [Hosting miễn phí](docs/deploy-mien-phi.md), [Deploy/rollback](docs/deployment.md) |
| Tiến độ và bàn giao | [Backlog](docs/process/backlog.md), [Checklist bàn giao](docs/process/handover.md) |
