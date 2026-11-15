# Task 5 — Triển khai và rollback

## Minh chứng đã kiểm chứng — 15/11/2026

[Delivery run 43685179367](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367) hoàn tất thành công trên commit `2af63a27619e7062e94bc6163643448e08a1b7f8`. Các job quality, image, **deploy** và delivery-status đều success; deploy-vps skipped vì nhóm chọn Render/Vercel. Đây là minh chứng CI đã deploy và smoke production, không chỉ build image.

| Thành phần | Kết quả kiểm tra sau run |
| --- | --- |
| Frontend | https://brew-lite-as-2.vercel.app/ — HTTPS hoạt động |
| Web version | https://brew-lite-as-2.vercel.app/version — `2af63a27619e7062e94bc6163643448e08a1b7f8` |
| API health | https://brewlite-as2-api.onrender.com/api/health — 200, `status: ok`, cùng SHA web |
| API menu | https://brewlite-as2-api.onrender.com/api/products — 200, `{ items, pagination }`, 5 sản phẩm |
| Demo accounts | ADMIN, STAFF và CUSTOMER đăng nhập HTTP 201, đúng quyền |
| Video end-to-end | [Video mobile](demo/README.md), API thật, thanh toán mô phỏng |
| Release nền | [v0.2.0](https://github.com/https-monstiez/BrewLite-AS2/releases/tag/v0.2.0), commit `ab5af17` |

SHA trên là snapshot của run đã chứng minh, không phải cam kết endpoint luôn giữ phiên bản đó sau các commit tiếp theo. Trước buổi chấm kiểm tra lại version, health và đăng nhập. Test mô phỏng không chứng minh một giao dịch ngân hàng thật đã được nhận.

## Topology đang dùng

- **Vercel Hobby:** Next.js/PWA, root `apps/web`; production `NEXT_PUBLIC_API_URL=https://brewlite-as2-api.onrender.com/api`.
- **Render Free:** service Docker **Git-backed** `brewlite-as2-api`, repo AS2/main, context `apps/api`, region Singapore, health `/api/health`.
- **Render PostgreSQL Free:** persistent managed storage, connection string nội bộ được Blueprint ánh xạ vào `DATABASE_URL`; `ipAllowList: []`.
- **GHCR:** lưu API/web images theo commit SHA. Render hiện build Docker từ Git commit được CI chỉ định, không pull image GHCR. Không mô tả hai cơ chế này như cùng một image artifact.

Dashboard đã xác nhận API/DB gói Free, database inbound rules trống (Render chặn toàn bộ traffic Internet) và `DATABASE_URL` tồn tại nhưng giá trị được che. Database có thông báo xóa ngày **15/12/2026** nếu không nâng cấp. Public health kiểm tra SELECT 1, không đủ để xác minh mọi quyền DB, backup hoặc billing. Cấu hình hai database role riêng trên Render chưa được xác minh; mô hình VPS đã kiểm tra local không thay thế bằng chứng production.

## CI và deploy bằng secrets

CI PR/main chạy install, lint, unit/UI, PostgreSQL integration, build, browser E2E và test orchestration CD. Main có required check `Lint, tests and build`, strict/up-to-date và enforce admins.

Delivery chạy trên main sau quality gate:

1. Build API/web Docker images, gắn tag SHA, push GHCR.
2. Từ chối commit đã bị thay thế trên main; dùng secret `RENDER_API_KEY` và `RENDER_SERVICE_ID` gọi deploy với `commitId`.
3. Nếu Render trả 202 Queued không có body, tìm deployment **mới** đúng SHA; không chấp nhận deployment cũ cùng SHA làm bằng chứng.
4. Chờ deployment live. Startup chạy `prisma migrate deploy`, seed catalog chỉ khi trống và seed demo chỉ khi nhóm bật opt-in; migration lỗi thì app không khởi động.
5. Kiểm API health/SHA và menu đúng envelope phân trang.
6. Gọi secret `VERCEL_DEPLOY_HOOK` của main; kiểm web `/version`, trang chủ và API SHA lần cuối.
7. Lỗi làm job thất bại và hiện hướng dẫn rollback; không tự xóa/reset database.

Cấu hình chính xác ở [cd-setup.md](cd-setup.md). Secrets chỉ lưu trên GitHub/hosting. Render auto-deploy Git và Vercel Git integration có thể tạo deploy riêng; chỉ run có job deploy/smoke success mới là minh chứng CI deployment. Tránh merge commit mới khi một bản đang deploy; Vercel hook theo đầu nhánh main, smoke sẽ từ chối nếu phiên bản không khớp.

## Lịch sử lỗi đã phát hiện

| Run | Kết quả và cách sửa |
| --- | --- |
| [43644852017](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43644852017) | Image đạt, deploy skipped vì chưa cấu hình; không được tính CD hoàn chỉnh |
| [43682676783](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43682676783) | API deploy được nhưng smoke menu chờ sai kiểu mảng; sửa theo `{ items, pagination }` |
| [43684074987](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43684074987) | Response deploy rỗng làm parse JSON lỗi; thêm nhánh queued và test chống nhận nhầm deployment cũ |
| [43685179367](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367) | Quality/image/deploy/smoke thành công, web/API cùng SHA |

## Rollback

1. Dừng phát hành tiếp; ghi SHA tốt gần nhất từ run smoke thành công.
2. Render → Manual Deploy → Deploy a specific commit → chọn SHA tốt. Hoặc gọi API deploy với `commitId` tương ứng; không dùng `imageUrl` cho service Git-backed này.
3. Vercel → promote deployment tương thích đã tốt trước đó. Kiểm tra web `/version` và API health, không suy ra rollback thành công từ trạng thái Live riêng lẻ.
4. Giữ migration additive. Không `migrate reset`, không drop DB. Nếu schema không tương thích ngược, fix-forward hoặc phục hồi backup trong bảo trì có kế hoạch.
5. Kiểm menu, đăng nhập và checkout mô phỏng; lưu SHA, thời gian và kết quả. Runbook đã có; chưa thực hiện diễn tập rollback production nên không ghi là đã diễn tập.

## Chạy local và phương án thay thế

Xem [README](../README.md): dùng `.env` riêng, `docker compose up --build -d --wait` và seed tường minh. DB không publish cổng host. Khi AS1 dùng cổng mặc định, đổi API_PORT/WEB_PORT và URL tương ứng của AS2.

[VPS](vps-deployment.md) là phương án bổ sung đã chuẩn bị, chưa phải hosting đang dùng. Nhóm không cần mua VPS/domain cho đợt nộp 16–18/11/2026. Xem [hosting miễn phí](deploy-mien-phi.md) và kế hoạch giữ/xuất dữ liệu trước hạn database Free.
