# Task 2 — Sơ đồ UML

Mỗi sơ đồ có nguồn PlantUML và SVG xuất từ chính nguồn. Render: `java -jar plantuml.jar -tsvg docs/diagrams/*.puml`. Dùng layout Smetana để không phụ thuộc Graphviz.

- use-cases: toàn hệ thống (Task 1.2).
- checkout-use-case: phạm vi UC-01 (Task 1.3).
- activity-checkout: swimlane, nhánh hết hàng, đăng nhập, thanh toán lỗi (Task 2.1).
- sequence-checkout: JWT/DTO, transaction/OCC, idempotency, Return/IPN (Task 2.2).
- class-domain: domain mục tiêu, enums và multiplicity (Task 2.3).
- deployment: ranh giới local/CI/production và target Vercel/Render/GHCR (Task 3.2).

Các lớp/thuộc tính mới trong mô hình phải được hiện thực và kiểm thử trong Task 5 trước nghiệm thu; theo dõi ở ma trận truy vết. Chưa dùng sơ đồ target làm minh chứng production.
