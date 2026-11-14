# ADR-006 — VPS là lựa chọn triển khai thay thế

Ngày: 15/11/2026. Trạng thái: Proposed; nhóm chưa có máy chủ.

Yêu cầu bổ sung: chuẩn bị triển khai VPS từ đầu. Giữ code web/API/database độc lập nền tảng; thêm Caddy HTTPS và Docker Compose production, GHCR images cùng SHA, SSH có xác minh host key, health/version smoke và rollback.

VPS đơn giản hóa một origin và chủ động vận hành, nhưng nhóm phải chịu trách nhiệm cập nhật OS/Docker, firewall, certificate, backup và monitoring. Không cần dùng VPS cùng Vercel/Render. Chỉ nghiệm thu mô hình thực sự được chọn khi có URL và bằng chứng chạy thật.
