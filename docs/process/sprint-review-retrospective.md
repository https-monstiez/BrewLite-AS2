# Dự thảo Sprint Review và Sprint Retrospective

**Trạng thái:** tài liệu chuẩn bị thảo luận, chưa phải biên bản cuộc họp đã diễn ra. Nội dung kỹ thuật dựa trên code, test và các lần triển khai có minh chứng. Các nhận xét và phân công dưới đây là đề xuất để nhóm xem xét, không phải phát biểu đã được thành viên hoặc giảng viên xác nhận.

| Thông tin | Nội dung |
| --- | --- |
| Dự án | BrewLite — Assignment 2 |
| Thành phần dự kiến | Lê Ngọc Hiếu — 3124410095; Nguyễn Tiến Đạt — 3124410060 |
| Thời gian, hình thức | Điền theo buổi trao đổi thực tế |
| Tài liệu đối chiếu | [Báo cáo AS2](../report-as2.md), [kiểm thử](../testing.md), [bản v0.2.1](https://github.com/https-monstiez/BrewLite-AS2/releases/tag/v0.2.1) |

## 1. Sprint Review — nội dung chuẩn bị

### 1.1 Mục tiêu rà soát

Đối chiếu sản phẩm với luồng tối thiểu: xem menu → tùy chọn món → giỏ hàng → đặt đơn → thanh toán → theo dõi đơn. Kiểm tra khả năng chạy local, truy cập production và truy vết từ yêu cầu tới thiết kế, code, test.

### 1.2 Kết quả có thể trình diễn

| Nhóm công việc | Kết quả kỹ thuật có minh chứng | Cách trình diễn đề xuất |
| --- | --- | --- |
| Nền tảng Sprint 1 | Monorepo, API menu/chi tiết, Next.js mobile-first, seed, Docker Compose, CI PR | Mở menu và API; trình bày cấu trúc repo, một run CI đạt và một run phát hiện lỗi |
| Checkout Sprint 2 | Tùy chọn món, giỏ qua reload, JWT, báo giá server, đặt đơn, chuyển khoản/điểm, xác nhận/lịch sử | Dùng CUSTOMER demo thực hiện một đơn; mở video mobile đã ghi |
| Xử lý đơn | Phân quyền STAFF/ADMIN và kiểm soát thứ tự trạng thái | Chuyển PAID → PREPARING → READY → COMPLETED; kiểm tra không bỏ qua bước |
| Chất lượng | 107 test ứng dụng và 16 test orchestration CD; test tranh chấp tồn và yêu cầu lặp | Trình bày kết quả và giải thích một tình huống idempotency |
| Delivery | CI deploy/smoke thành công; web/API cùng SHA trong run được ghi nhận; release/video | Mở [run 43685179367](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367), web và health |

### 1.3 Nhận xét đề xuất để nhóm thảo luận

- Luồng checkout đã nối xuyên suốt giao diện, API và database; có xử lý lỗi và kiểm thử thay vì chỉ trình bày giao diện tĩnh.
- Dữ liệu tiền, tồn kho và trạng thái do server kiểm soát; cần giải thích rõ khi trình bày chống gửi lặp hoặc cập nhật đồng thời.
- Video đã ghi là thao tác tự động trên production; nhóm nên bổ sung phần thuyết minh về yêu cầu, UML và quyết định kiến trúc.
- Bản main hiện tại chỉ giữ ngân hàng/điểm; VietQR chờ đối soát, Ví/Thẻ mô phỏng và VNPay đã bị bỏ khỏi luồng hoạt động. Cách giới thiệu phương thức thanh toán cần thống nhất với chức năng đang bật.
- Hosting Free cần được kiểm tra trước buổi bảo vệ để tránh cold start hoặc sự cố cấu hình ảnh hưởng phần trình diễn.

### 1.4 Kết luận cần xác nhận sau buổi thật

Nhóm ghi lại chức năng đã cùng kiểm tra, tiêu chí chấp nhận đạt/chưa đạt, phản hồi thực tế và công việc chuyển tiếp. Không chuyển các nhận xét đề xuất ở trên thành ý kiến của giảng viên hoặc thành viên khi chưa có xác nhận.

## 2. Sprint Retrospective — nội dung chuẩn bị

### 2.1 Điều làm tốt có thể rút ra từ minh chứng

- Tạo phẩm yêu cầu, sơ đồ và kiến trúc được quản lý trong repo, có nguồn UML và ma trận truy vết.
- Required CI ngăn tích hợp khi chưa đạt lint/test/build; lịch sử PR cho thấy lỗi được sửa qua các lần kiểm tra.
- Unit test được tách với PostgreSQL integration; các test quan trọng kiểm tra transaction, quyền truy cập, callback lặp và tranh chấp tồn.
- Các giới hạn production được ghi rõ, tránh dùng kết quả local thay cho xác nhận triển khai thật.

### 2.2 Khó khăn và nguyên nhân kỹ thuật đã quan sát

| Sự việc | Nguyên nhân quan sát được | Bài học đề xuất |
| --- | --- | --- |
| Seed có ADMIN nhưng chưa đăng nhập được online | Startup mặc định tắt demo accounts; catalog đã có khiến seed cũ bỏ qua phần tài khoản | Kiểm tra dữ liệu và cấu hình của từng môi trường, không suy ra từ file seed |
| Login sai báo phiên hết hạn | Client dùng chung thông báo cho mọi HTTP 401 | Phân biệt lỗi đăng nhập với lỗi token của request đã xác thực |
| CD dừng ở smoke menu | Smoke chờ mảng trong khi API trả `{ items, pagination }` | Đối chiếu contract API thực tế khi viết kiểm tra tích hợp |
| CD dừng khi parse response deploy | Xử lý chưa đầy đủ phản hồi không có JSON; Render hỗ trợ queued deploy | Xử lý trạng thái bất đồng bộ, kiểm tra đúng deployment/SHA và thêm hồi quy |
| Các endpoint từng báo SHA khác nhau | Web và API được triển khai trên hai nền tảng, có thời điểm cập nhật khác nhau | Dùng smoke xác minh cả hai thành phần sau deploy |

Đây là sự việc từ quá trình thực hiện, không phải bản ghi lời phát biểu hoặc đánh giá đóng góp cá nhân.

### 2.3 Kế hoạch cải tiến đề xuất

| Việc cần làm | Phụ trách đề xuất, chờ nhóm thống nhất | Mốc dự kiến |
| --- | --- | --- |
| Kiểm tra web, API health và ba vai trò; chuẩn bị dữ liệu demo | Lê Ngọc Hiếu | Trước buổi nộp/bảo vệ |
| Rà báo cáo, UML, truy vết và đường dẫn minh chứng | Nguyễn Tiến Đạt | Trước buổi nộp/bảo vệ |
| Tập thuyết minh luồng checkout, CI/CD và một tình huống lỗi | Cả hai thành viên | Trước 18/11/2026 |
| Thống nhất kế hoạch xuất/giữ dữ liệu của database Free | Cả hai thành viên | Trước hạn dịch vụ 15/12/2026 |

## 3. Phần ghi nhận sau buổi trao đổi

- Thời gian và hình thức thực tế:
- Người tham dự thực tế:
- Các chức năng đã cùng trình diễn/kiểm tra:
- Phản hồi và quyết định thống nhất:
- Thay đổi so với phân công đề xuất:
- Xác nhận của các thành viên:
