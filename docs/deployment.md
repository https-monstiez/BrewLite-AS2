# Task 5 — Triển khai và rollback

## Trạng thái thực tế
Chưa có URL production hoặc tài khoản cloud được cung cấp/kiểm chứng. Vercel + Render + GHCR là target; không coi Task 5.4 hoàn thành cho đến khi các URL HTTPS dưới đây được điền và smoke pass.

| Mục | Giá trị đã kiểm chứng |
|---|---|
| Frontend production | Chưa có |
| API /api | Chưa có |
| Health /api/health | Chưa có |
| Release/tag production | Chưa phát hành |
| Demo/video | Chưa ghi |

## Local
`cp .env.example .env`, đổi password/JWT rồi `docker compose up --build -d`. Mặc định web :3000, API :3001; DB chỉ trên mạng Compose, không publish 5432. Nếu AS1 đang chạy cùng cổng, dừng AS1 hoặc đổi mapping cho AS2. Chạy seed tường minh: `docker compose exec api npm run db:seed` (chỉ dữ liệu menu). Demo account chỉ được tạo khi SEED_DEMO_ACCOUNTS=true; tuyệt đối không bật trong production.

## Render
1. Tạo PostgreSQL, tắt external/public access. Dùng internal URL từ API cùng region.
2. Chuẩn bị một image-backed Web Service cho image `ghcr.io/https-monstiez/brewlite-as2-api:<SHA>`; cấu hình registry credential riêng, quyền read:packages.
3. Env: DATABASE_URL của app role, MIGRATION_DATABASE_URL của schema owner, JWT_SECRET ngẫu nhiên, FRONTEND_ORIGIN bằng URL Vercel, PORT=3001, PAYMENT_MODE=simulation cho bài demo hoặc tắt simulation khi không cần.
4. VNPay tùy chọn: VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_RETURN_URL=<web>/payment-return; đăng ký IPN `<api>/api/payments/vnpay/ipn` với merchant sandbox. Không ghi secret trong repo.
5. Health path `/api/health`. Startup migrate deploy trước khi chạy API, lỗi migration dừng startup; không tự seed hoặc reset dữ liệu.
6. Trước rollout, backup DB từ dashboard; migration mới giữ tương thích ngược. Nếu có nhiều instance, dùng pre-deploy job riêng cho migration thay vì cấp schema-owner secret cho mọi instance.

## Hai vai trò database
Schema owner chỉ dùng migration; app role chỉ được CONNECT, USAGE schema, SELECT/INSERT/UPDATE/DELETE bảng và USAGE/SELECT sequences. Sau migration, owner GRANT quyền cho app role, gồm ALTER DEFAULT PRIVILEGES để bảng mới được truy cập. Dùng tên role/password riêng tạo bằng giao diện/psql an toàn; kiểm tra app role không CREATE/ALTER/DROP. Không dùng tài khoản superuser chạy ứng dụng.

## Vercel
Import repo AS2, Root Directory=`apps/web`, framework Next.js, Install=`npm ci`, Build=`npm run build`. Env NEXT_PUBLIC_API_URL=<API HTTPS>/api. Vercel inject VERCEL_GIT_COMMIT_SHA để `/version` trả phiên bản. Tắt deploy tự động nếu muốn mọi production release đều qua quality gate CD; tạo deploy hook cho nhánh main (không phải as2). Deploy hook là secret.

## GitHub Actions
CI chạy PR/push: Install→Lint→Tests→Build, PostgreSQL integration và browser E2E. Đặt required check **Lint, tests and build** trên nhánh main; workflow file tự nó không khóa nút merge.

CD main/tag: chạy lại quality → build Docker image tag commit SHA → push GHCR. Job deploy chỉ bật khi repository variable PRODUCTION_DEPLOY_ENABLED=true. Thiếu secret khi đã bật làm job thất bại, không được báo deploy thành công.

Secrets: RENDER_API_KEY, RENDER_SERVICE_ID, VERCEL_DEPLOY_HOOK. Variables: API_HEALTH_URL, WEB_URL, PRODUCTION_DEPLOY_ENABLED. Tạo environment production nếu cần phê duyệt release. Render image config phải trùng registry/repo/name với IMAGE_URL.

`scripts/deploy.mjs` gọi Render API với imageUrl, đợi live, kiểm health và SHA; sau đó gọi Vercel hook và đợi `/version` khớp cùng SHA. Không in body lỗi có thể chứa secret. Lỗi bất kỳ dừng pipeline. Nguồn: [Render deploy API](https://api-docs.render.com/reference/create-deploy), [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks).

## Rollback
1. Dừng release mới; ghi SHA tốt gần nhất từ lần smoke thành công.
2. Render dashboard → chọn deployment/image SHA tốt hoặc gọi deploy API với imageUrl cũ. Không dùng mutable `latest`.
3. Vercel → promote deployment tốt trước đó; xác minh `/version` và luồng menu/checkout tương thích API.
4. Giữ migration additive; không chạy migrate reset, không drop DB. Nếu migration không tương thích ngược, fix-forward hoặc restore backup trong bảo trì có kế hoạch.
5. Gọi health, menu, đăng nhập và checkout mô phỏng trên dữ liệu kiểm thử; lưu log, thời gian, SHA và người thực hiện.

## Phương án VPS
Nhóm hiện chưa có hạ tầng. Bộ triển khai tự quản nằm trong [vps-deployment.md](vps-deployment.md); chọn DEPLOY_TARGET=vps để dùng job SSH sau khi đã chuẩn bị máy chủ. Không cần triển khai đồng thời cả VPS và Render/Vercel.

## Phương án được chọn cho đợt nộp 16–18/11/2026
Nhóm chọn gói miễn phí Vercel Hobby + Render Free API/PostgreSQL. Xem [deploy-mien-phi.md](deploy-mien-phi.md) và render.yaml. Cấu hình đã chuẩn bị; chưa điền URL thực tế khi chưa deploy/kiểm tra. Cơ sở dữ liệu có thời hạn 30 ngày, API cold start.
