# Task 5 — Triển khai và rollback

## Trạng thái thực tế — 15/11/2026
Production đã được triển khai theo thông tin nhóm và kiểm tra công khai lúc 03:55 ICT. GET menu và health trả thành công; web và API báo cùng SHA. Đây là smoke check công khai, không thay thế việc xác minh cấu hình tài khoản, database hoặc luồng đặt hàng production.

| Mục | Giá trị đã kiểm chứng |
|---|---|
| Frontend production | https://brew-lite-as-2.vercel.app/ — trang tải và hiển thị menu |
| API /api | https://brewlite-as2-api.onrender.com/api — GET `/products` trả 5 món |
| Health /api/health | https://brewlite-as2-api.onrender.com/api/health — `status: ok` |
| SHA đang chạy | `ab5af1728c75be75c6b5c7d150fcd6ed6028d409` trên web `/version` và API `/health` |
| GitHub Release/tag | [v0.2.0](https://github.com/https-monstiez/BrewLite-AS2/releases/tag/v0.2.0) trên commit production |
| Demo/video | Chưa được cung cấp |

Render dashboard xác nhận service API là Free và Live, database là Free, và biến `DATABASE_URL` tồn tại trong Environment (giá trị vẫn được che). Blueprint `render.yaml` của đúng service ánh xạ biến này tới `brewlite-as2-db` → `connectionString`; API health công khai trả `ok`. Theo thông báo hiển thị trong dashboard, PostgreSQL Free sẽ bị xóa ngày **15/12/2026** trừ khi nâng cấp lên gói compute trả phí. Đã kiểm tra Networking trong dashboard: bảng **PostgreSQL Inbound IP Rules trống**, Render thông báo toàn bộ traffic Internet bị chặn. Điều này khớp với `ipAllowList: []` trong `render.yaml`. Vercel settings, billing chi tiết và cấu hình secrets chưa được xác minh độc lập.

## Local
`cp .env.example .env`, đổi password/JWT rồi `docker compose up --build -d`. Mặc định web :3000, API :3001; DB chỉ trên mạng Compose, không publish 5432. Nếu AS1 đang chạy cùng cổng, dừng AS1 hoặc đổi mapping cho AS2. Chạy seed tường minh: `docker compose exec api npm run db:seed` (chỉ dữ liệu menu). Demo account chỉ được tạo khi SEED_DEMO_ACCOUNTS=true; tuyệt đối không bật trong production.

## Render — cấu hình đang dùng
`render.yaml` khai báo Blueprint có một PostgreSQL và một Docker Web Service `brewlite-as2-api`, cùng region Singapore; service theo dõi `main`, `autoDeployTrigger: checksPass`, health path `/api/health`. Đây là Git-backed deploy từ repo, không phải image-backed deploy từ GHCR. DB được cấu hình với `ipAllowList: []`; API lấy connection string nội bộ từ database resource. `JWT_SECRET` được Render tạo; `FRONTEND_ORIGIN` và thông tin nhận chuyển khoản phải được đặt trong dashboard, không đưa vào Git.

Health công khai đã trả `status: ok`, version SHA `ab5af1728c75be75c6b5c7d150fcd6ed6028d409`; `/api/products` đã trả 5 món. Không thể xác minh cấu hình thực tế, secrets, backup hoặc billing của tài khoản chỉ từ endpoint công khai.

## Hai vai trò database
Schema owner chỉ dùng migration; app role chỉ được CONNECT, USAGE schema, SELECT/INSERT/UPDATE/DELETE bảng và USAGE/SELECT sequences. Sau migration, owner GRANT quyền cho app role, gồm ALTER DEFAULT PRIVILEGES để bảng mới được truy cập. Dùng tên role/password riêng tạo bằng giao diện/psql an toàn; kiểm tra app role không CREATE/ALTER/DROP. Không dùng tài khoản superuser chạy ứng dụng.

## Vercel — cấu hình đang dùng
Frontend production đã phản hồi tại https://brew-lite-as-2.vercel.app/ và hiển thị thực đơn. Endpoint `/version` trả SHA `ab5af1728c75be75c6b5c7d150fcd6ed6028d409`, trùng với API. Dự án được triển khai từ repo AS2. Giá trị `NEXT_PUBLIC_API_URL`, root directory, build settings và phạm vi production environment cần xác minh trong dashboard; không ghi giá trị từ dashboard nếu chưa quan sát.

## GitHub Actions và Delivery
CI chạy PR/push: Install→Lint→Tests→Build, PostgreSQL integration và browser E2E. Các lần CI/Delivery trên `main` tại [CI run 43635976686](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43635976686) và [Delivery run 43635976761](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43635976761) đã thành công trên SHA production nêu trên. Workflow Delivery đóng gói image SHA lên GHCR. Job deploy của workflow chỉ hoạt động khi `PRODUCTION_DEPLOY_ENABLED=true`; điều kiện này không phải cách triển khai Render Git-backed hiện tại.

GitHub branch protection đã xác minh trên `main`: required check `Lint, tests and build`, strict/up-to-date và enforce administrators. `render.yaml` khai báo Render auto-deploy từ Git khi checks đạt; cấu hình Vercel build/production environment và việc Render dashboard có khớp hoàn toàn với Blueprint cần được nhóm kiểm tra nếu cần làm minh chứng. Không tuyên bố job GitHub CD đã triển khai production chỉ dựa vào Delivery run màu xanh: deployment trực tiếp của nhóm và GitHub Actions deploy là hai cơ chế khác nhau.

Luồng image-backed Render trong workflow `scripts/deploy.mjs` là phương án riêng, không dùng cho service Git-backed hiện tại. Chỉ cấu hình `RENDER_API_KEY`, `RENDER_SERVICE_ID`, `VERCEL_DEPLOY_HOOK` và các biến URL khi chuyển sang đúng mô hình image-backed; secrets chỉ lưu trong GitHub settings.

## Rollback
1. Dừng release mới; ghi SHA tốt gần nhất từ lần smoke thành công.
2. Render dashboard → chọn deployment/image SHA tốt hoặc gọi deploy API với imageUrl cũ. Không dùng mutable `latest`.
3. Vercel → promote deployment tốt trước đó; xác minh `/version` và luồng menu/checkout tương thích API.
4. Giữ migration additive; không chạy migrate reset, không drop DB. Nếu migration không tương thích ngược, fix-forward hoặc restore backup trong bảo trì có kế hoạch.
5. Gọi health, menu, đăng nhập và checkout mô phỏng trên dữ liệu kiểm thử; lưu log, thời gian, SHA và người thực hiện.

## Phương án VPS
VPS là phương án tùy chọn, không được chọn cho đợt nộp này. Bộ triển khai tự quản nằm trong [vps-deployment.md](vps-deployment.md); chỉ chọn `DEPLOY_TARGET=vps` sau khi nhóm chuẩn bị máy chủ và thống nhất chuyển hạ tầng. Không cần triển khai đồng thời cả VPS và Render/Vercel.

## Phương án được chọn cho đợt nộp 16–18/11/2026
Nhóm chọn Vercel Hobby + Render Free API/PostgreSQL. Public smoke đã đạt cho web, menu, health và SHA; URL ở đầu tài liệu. Xem [deploy-mien-phi.md](deploy-mien-phi.md) và `render.yaml` để đối chiếu cấu hình. Render Free có thể ngủ khi không có truy cập; database hiện có thông báo xóa ngày **15/12/2026** nếu không nâng cấp. Sao lưu/xuất dữ liệu trước hạn hoặc lên kế hoạch chuyển DB; không nâng cấp khi chưa được nhóm chấp thuận.
