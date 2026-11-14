# ADR 001-monorepo: Monorepo và kiến trúc module

Ngày: 15/11/2026

Trạng thái: Accepted

## Bối cảnh
Cần truy vết tài liệu và code trong một repo AS2 riêng, giữ AS1 nguyên trạng.

## Quyết định
Dùng apps/web, apps/api, docs, tests; NestJS module theo domain.

## Hệ quả/trade-off
Không tách microservice; transaction nội bộ dễ kiểm thử. Hai app có lockfile riêng; CI chạy cả hai.
