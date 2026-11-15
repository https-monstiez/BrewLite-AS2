# Đối chiếu AS2 với PDF — 15/11/2026

Nguồn: Assignment2-BrewLite.pdf, trang 3–8. Đây là kết quả kiểm tra tạo phẩm và bằng chứng hiện có; không thay thế buổi nghiệm thu trực tiếp.

| Task | Tạo phẩm/bằng chứng | Trạng thái |
| --- | --- | --- |
| 1.1 | [Bối cảnh, stakeholder, phạm vi](requirements/context-and-scope.md) | Có |
| 1.2 | [SRS, MoSCoW, acceptance criteria](requirements/srs.md), use-case toàn hệ thống | Có |
| 1.3 | [Đặc tả checkout](requirements/checkout-use-case.md), diagram riêng, liên kết FR | Có |
| 2.1–2.3 | [Activity/Sequence/Class](diagrams/README.md), nguồn `.puml` và `.svg` | Có |
| 3.1 | [Kiến trúc phân lớp](architecture/overview.md), ADR trong architecture/adr | Có |
| 3.2 | [Deployment diagram](diagrams/deployment.svg), local/CI/production, Vercel/Render/GHCR | Có; phản ánh Git-backed CI deployment đã kiểm chứng |
| 4.1–4.2 | Repo riêng AS2, apps/web + apps/api + docs, README/env mẫu, [backlog/DoD](process/backlog.md), lịch sử commit/PR | Có |
| 4.3 | GET products/detail, mobile UI, loading/empty/error, seed và test | Có code, CI và production |
| 4.4 | CI PR lint/test/build, required check, [run thành công và phát hiện lỗi](testing.md) | Có minh chứng |
| 5.1 | Tùy chọn, giỏ, JWT, tạo đơn, thanh toán mô phỏng, xác nhận/lịch sử/trạng thái | Có code và test |
| 5.2 | Unit, PostgreSQL integration, browser E2E, migrations/seed, Compose/health | CI đã đạt; xem testing.md |
| 5.3 | Image SHA/GHCR, CI secrets, Git-backed deploy, migration, smoke/rollback | **Đạt run đã kiểm chứng**: [43685179367](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367), job deploy success, web/API cùng SHA |
| 5.4 | HTTPS web/API, DB private, release v0.2.0, release notes, README/runbook | Có URL/release/runbook và video demo; còn Review/Retrospective thực tế |
| Truy vết | [Ma trận yêu cầu → thiết kế → code → test](traceability-matrix.md) | Có |

## Các mục nhóm cần thực hiện

- Xem [video demo đã ghi](demo/README.md) và chuẩn bị phần thuyết minh/demo trực tiếp khi bảo vệ 18/11/2026. Video là thao tác tự động trên production, không phải biên bản nghiệm thu.
- Sprint Review: ghi người tham dự thật, thời gian, chức năng nghiệm thu, phản hồi và việc còn lại.
- Sprint Retrospective: ghi điều làm tốt/chưa tốt, nguyên nhân, hành động cải tiến, người phụ trách và hạn thực hiện. Mẫu có trong [handover.md](process/handover.md).
- Bổ sung lớp/nhóm nếu mẫu giảng viên yêu cầu. Báo cáo đã có tên, MSSV, giảng viên Từ Lãng Phiêu và mốc nộp/bảo vệ do nhóm cung cấp.

## Các mục mở rộng

ADMIN/STAFF/CUSTOMER demo đã đăng nhập online thành công. VNPay/MoMo production không nằm trong MVP thanh toán mô phỏng bắt buộc của PDF; chưa có merchant nên không ghi là đã bật cổng thật. VietQR vẫn yêu cầu nhân viên đối soát, không xem quét QR là đã nhận tiền. Hai DB role riêng và PWA install trên điện thoại vật lý chưa có minh chứng production; không dùng kết quả local thay thế.
