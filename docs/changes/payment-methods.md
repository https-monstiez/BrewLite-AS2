# Gộp nhánh update-payment-methods vào main — 15/11/2026

Theo lựa chọn của chủ repo, main gộp cả nhánh `update-payment-methods` trước khi xóa các nhánh phụ. Các phương thức hiện cung cấp là **chuyển khoản ngân hàng** và **điểm tích lũy**. Ví/Thẻ mô phỏng, MoMo và VNPay không còn được cung cấp qua giao diện/API tạo thanh toán.

- Đơn chuyển khoản chờ nhân viên đối soát; không tự đánh dấu đã nhận tiền khi quét QR.
- Chỉ STAFF/ADMIN xác nhận giao dịch BANK_TRANSFER; yêu cầu lặp không ghi thêm điểm hoặc thanh toán.
- API từ chối phương thức đã ngừng hỗ trợ, không tạo payment chờ mà không có luồng xử lý.
- Giữ dữ liệu/schema và mã xử lý cũ chưa được nối vào module để tương thích lịch sử; không có migration xóa giao dịch đã tồn tại.
- Sửa các tham chiếu còn sót ở checkout/trang return để bản gộp build được.
- Đồng bộ mức đường 25%/75% của UI mới với validation API; giữ nhận 30%/70% từ client cũ. Các nhóm chọn đường/đá có tên truy cập rõ ràng.
- Kiểm thử integration/browser được cập nhật theo luồng chuyển khoản và xác nhận bằng nhân viên trên **database test, tài khoản nhận giả**; không có chuyển tiền thật.

PDF AS2 yêu cầu Ví/Thẻ mô phỏng. Vì chủ repo chọn gộp nhánh này, bản main mới khác tiêu chí đó; hồ sơ và video của release v0.2.1 là minh chứng phiên bản trước, không chứng minh bản mới vẫn có mô phỏng. Khi trình bày cần phân biệt rõ hai phiên bản. Không tự khôi phục phương thức đã bỏ khi chưa có thay đổi phạm vi tiếp theo.
