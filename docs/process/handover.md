# Checklist bàn giao

- [x] Repo AS2 tách riêng; AS1 không chỉnh sửa.
- [x] SRS, bối cảnh, UC-01 và truy vết.
- [x] Activity/sequence/class/use-case/deployment UML có nguồn và SVG.
- [x] ADR, backlog và Definition of Done.
- [x] Code apps/web, apps/api, migration/seed và Docker Compose.
- [x] Unit/API tests, integration PostgreSQL và browser E2E có mã nguồn.
- [x] Log CI GitHub thành công, minh chứng lỗi cấu hình và required checks main — xem [testing.md](../testing.md).
- [x] URL HTTPS web/API/health hoạt động — xem [deployment.md](../deployment.md).
- [ ] Deploy và smoke qua CI đạt trên cùng SHA web/API (Task 5.3); cấu hình theo [cd-setup.md](../cd-setup.md).
- [x] Deployment production hoạt động; CI và Delivery GitHub đạt trên SHA đang chạy — xem [testing.md](../testing.md). GHCR image không đồng nghĩa GitHub Actions đã triển khai Render.
- [x] Render dashboard xác nhận PostgreSQL gói Free, PostgreSQL Inbound IP Rules trống (Render chặn toàn bộ traffic Internet), hết hạn/xóa 15/12/2026.
- [x] Environment có `DATABASE_URL`; Blueprint ánh xạ tới `brewlite-as2-db` internal connection string (giá trị secret không được mở/chia sẻ).
- [x] GitHub Release/tag `v0.2.0` trên commit production — [Release](https://github.com/https-monstiez/BrewLite-AS2/releases/tag/v0.2.0).
- [x] README có họ tên/MSSV; báo cáo đã điền Lê Ngọc Hiếu và Nguyễn Tiến Đạt.
- [ ] Điền giảng viên/ngày nộp và xuất bản báo cáo theo định dạng yêu cầu.
- [ ] Tạo ADMIN trên Render, đăng nhập và thử xử lý đơn bằng tài khoản quản lý/nhân viên.
- [ ] Video/demo trực tiếp có người nghiệm thu.
- [ ] Sprint Review/Retrospective có thành viên, thời điểm và phản hồi thật.

Ghi chú vận hành (không phải tiêu chí nghiệm thu trong PDF): Render thông báo database Free sẽ bị xóa ngày 15/12/2026. Nhóm nên tự quyết định kế hoạch lưu trữ/chuyển dữ liệu trước hạn.

## Kịch bản demo đề xuất
1. Điện thoại xem/tìm menu, mở chi tiết, chọn size/topping/đường/đá, thêm giỏ và reload.
2. Đăng ký tài khoản mới; áp voucher hợp lệ, cho thấy server từ chối voucher sai.
3. Ví/Thẻ mô phỏng thành công; trang xác nhận đọc trạng thái thật, lịch sử chỉ của khách.
4. Staff xử lý PAID→PREPARING→READY→COMPLETED, thử chuyển sai bước để thấy 409.
5. Tạo đơn khác và chọn mô phỏng thất bại; tồn thành phẩm/nguyên liệu được trả.
6. Manager tạo nguyên liệu/nhập kho/công thức; gửi lại phiếu không cộng trùng.
7. Trình bày test transaction/callback lặp và CI; chỉ demo VNPay sandbox khi có merchant.
8. Truy cập URL production/health, ghi SHA, ngày giờ và kết quả thực tế.

## Sprint Review — mẫu cần điền sau buổi thật
Ngày; thành viên; Sprint Goal; câu chuyện Done kèm test/PR; phản hồi người dùng/giảng viên; việc chuyển Sprint tiếp; link demo.

## Sprint Retrospective — mẫu cần điền sau buổi thật
Điều làm tốt; khó khăn có bằng chứng; nguyên nhân; 1–3 hành động cải tiến, người phụ trách và hạn kiểm tra. Không ghi mẫu này thành biên bản đã họp.
