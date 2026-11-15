# CI/CD và triển khai hệ thống

## Kết quả đã kiểm chứng

[Delivery run 43710893938](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43710893938) thành công trên `55c02e4a4b4c63f1abd5554c6d22647e968a45b4`: quality, image, **deploy** và delivery-status đều success. Web `/version` và API `/api/health` cùng SHA khi smoke sau run; menu trả 5 sản phẩm. Xem [deployment.md](deployment.md) để phân biệt snapshot với phiên bản sau các commit tiếp theo.

## CI

PR/main chạy install → lint → unit/UI → PostgreSQL integration → build → Playwright E2E, cùng test orchestration CD. Bộ hiện tại gồm 107 test ứng dụng (84 backend, 7 frontend, 12 PostgreSQL, 4 browser) và 16 test CD; 123 test tổng. Main có required check `Lint, tests and build` và strict. Theo yêu cầu chủ repo ngày 15/11/2026, tài khoản quản trị được push trực tiếp (enforce admins tắt, không yêu cầu reviewer); do đó required checks không ngăn admin ghi code lên main. CI vẫn chạy trên main, còn deploy chỉ chạy khi quality gate đạt.

## Đóng gói và triển khai

Image API/web có tag SHA và được đẩy GHCR. Render đang là Docker service Git-backed: CI dùng secret gọi Render API với `commitId`, chờ deployment live, startup migration, kiểm API health/SHA/menu. Response 202 Queued không có body được xử lý bằng tìm deployment mới cùng commit; không chấp nhận deployment cũ. Sau đó CI gọi Vercel hook main, kiểm web version/trang chủ và API version lần cuối.

GHCR image là tạo phẩm đóng gói; không tuyên bố Render đã pull chính image đó. Git integration của nền tảng vẫn là một cơ chế riêng; run có job deploy success mới chứng minh CI deploy. Secrets/variables và bước tái lập xem [cd-setup.md](cd-setup.md).

## Lỗi và khôi phục

Các run trước đã phát hiện sai contract menu và response deploy rỗng; lịch sử minh chứng giữ trong [testing.md](testing.md). Pipeline dừng khi lỗi và hiển thị runbook [rollback](deployment.md#rollback), không reset/drop database. Chưa thực hiện diễn tập rollback production.

## Demo

[Video mobile production](demo/README.md) ghi checkout chuyển khoản bằng Playwright trên API thật, kết thúc ở PENDING và lịch sử; QR/tài khoản nhận được che trong bản ghi. Ba tài khoản demo đã đăng nhập online đúng quyền. Không có tiền thật được chuyển hoặc xác nhận trong video; VNPay/mô phỏng không còn hoạt động trên main, VietQR cần nhân viên đối soát. Video không phải biên bản Sprint Review/Retrospective.
