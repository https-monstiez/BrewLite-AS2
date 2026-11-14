# ADR 003-payment-adapters: Thanh toán mô phỏng và VNPay sandbox

Ngày: 15/11/2026

Trạng thái: Accepted

## Bối cảnh
PDF cho phép Ví/Thẻ mô phỏng, nhóm yêu cầu thêm VNPay ký HMAC/IPN.

## Quyết định
Tách nhãn mô phỏng; server xác thực owner/amount/reference; gateway chỉ xác nhận qua callback hợp lệ.

## Hệ quả/trade-off
Không dùng QR chuỗi nội bộ như QR thanh toán thật; sandbox cần secret do nhóm cấp; hoàn tiền ngoài hệ thống cần đối soát.
