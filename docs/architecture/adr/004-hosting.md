# ADR 004-hosting: Vercel + Render + GHCR

Ngày: 15/11/2026

Trạng thái: Proposed — chưa có môi trường thực tế

## Bối cảnh
Cần HTTPS public, DB private, image version và smoke test.

## Quyết định
Target Vercel cho web; Render Docker cho API/Postgres; GHCR tag SHA; deploy hook qua secret.

## Hệ quả/trade-off
Phụ thuộc quyền tài khoản và chi phí nền tảng; chỉ chuyển thành deployed khi URL/health được xác minh.
