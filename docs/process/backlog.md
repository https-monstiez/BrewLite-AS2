# Product Backlog và hai Sprint

Đây là backlog được tái lập cho AS2 từ ngày 15/11/2026. Không phải lịch sử Sprint 1/2 đã hoàn thành. Khi issue/PR được tạo, thay cột minh chứng bằng link thật; không tự đánh dấu Done.

| Story | Yêu cầu | Sprint | Tiêu chí hoàn thành | Minh chứng |
|---|---|---|---|---|
| US-01 Xem menu | FR-01 | 1 | API list/detail, loading/empty/error, test UI/API | PR #1 / CI: xem docs/testing.md |
| US-02 Nền tảng dự án | NFR-04/06 | 1 | apps/*, env mẫu, compose, CI lint/test/build | PR #1 / CI: xem docs/testing.md |
| US-03 Hồ sơ yêu cầu/thiết kế | Task 1–3 | 1 | SRS, use-case, UML source/SVG, ADR | docs/ |
| US-04 Tùy chọn và giỏ | FR-02/03 | 2 | size/topping/đường/đá, lưu giỏ, validate | Đã kiểm thử local + CI; xem docs/testing.md |
| US-05 Đặt/thanh toán | FR-04/05/06/12 | 2 | JWT, quote, idempotency/OCC, simulation/sandbox | Đã kiểm thử local + CI; xem docs/testing.md |
| US-06 Theo dõi và pha chế | FR-07/08 | 2 | owner-only history, queue/state machine | Đã kiểm thử local + CI; xem docs/testing.md |
| US-07 Quản trị/loyalty | FR-09/10/11/13 | 2 | menu/voucher/users/audit/ledger | Đã kiểm thử local + CI; xem docs/testing.md |
| US-08 Delivery | NFR-07 | 2 | image SHA, deploy/smoke, URL thật, rollback | Production có URL; CI deploy/smoke đạt run 43685179367, xem docs/deployment.md |
| US-09 Nguyên liệu | FR-14 | mở rộng | công thức, nhập/trừ kho transaction | Đã hiện thực kho/công thức; integration CI đạt |

## Branch và PR
- Repo AS1 `leehieu36/BrewLite` chỉ là nguồn nền, không push thay đổi AS2.
- Repo AS2 `https-monstiez/BrewLite-AS2`; `main` là nhánh tích hợp; làm việc trên `as2` hoặc `feat/*`, PR vào main.
- Conventional commits: docs/feat/fix/test/ci/chore; commit theo thứ tự Task 1→2→3→4→5.
- Chỉ merge khi required CI checks pass và review xong. Workflow không tự bật branch protection; cần cấu hình GitHub thực tế.

## Definition of Done
Tiêu chí chấp nhận được truy vết; code lint/typecheck/test/build pass; không commit secret; migration có thể chạy lại trên DB sạch; sơ đồ/tài liệu cập nhật theo code; PR có log CI; tính năng production chỉ Done khi smoke và URL đã kiểm chứng.
