# ADR 002-data-integrity: PostgreSQL, Prisma và transaction

Ngày: 15/11/2026

Trạng thái: Accepted

## Bối cảnh
Giá/stock/điểm có thể bị tranh chấp, client có thể gửi lại request.

## Quyết định
Tiền nguyên VND; unique idempotency key; payload comparison; OCC product.version; payment claim có điều kiện; loyalty ledger cùng transaction.

## Hệ quả/trade-off
Retry có giới hạn; migration thêm trường/bảng trước, không reset production.
