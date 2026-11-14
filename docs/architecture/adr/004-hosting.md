# ADR 004-hosting: Vercel + Render + GHCR

Ngày: 15/11/2026

Trạng thái: Accepted — Vercel + Render production đang hoạt động; URL/health và SHA được kiểm tra công khai ngày 15/11/2026. Cấu hình trong dashboard chưa được xác minh độc lập.

## Bối cảnh
Cần HTTPS public, DB private, image version và smoke test.

## Quyết định
Vercel phục vụ web; Render Blueprint chạy Docker API và PostgreSQL; GHCR lưu image tag SHA. Render service hiện deploy từ Git với `autoDeployTrigger: checksPass` theo `render.yaml`; GitHub Actions image-backed deploy qua deploy hook là phương án riêng, không phải bằng chứng của deploy hiện tại.

## Hệ quả/trade-off
Phụ thuộc quyền tài khoản, cấu hình billing và giới hạn gói miễn phí. Public smoke đã xác minh web/API cùng SHA; kiểm tra DB privacy, gói, backup, billing và secrets vẫn cần dashboard. Xem [deployment.md](../../deployment.md).
