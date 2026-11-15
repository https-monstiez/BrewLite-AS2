# Video demo mobile — chuyển khoản và lịch sử

[Xem/tải checkout-mobile.webm](checkout-mobile.webm). Video này đã ghi đè bản Thẻ mô phỏng trước đó trên main, theo phạm vi mới chỉ ngân hàng/điểm.

Ghi ngày 15/11/2026 trên website Vercel/API Render, viewport 390 × 844. Luồng thực tế: đăng nhập CUSTOMER demo → chọn Americano size M, đường 25%, đá 50% → thêm giỏ → reload vẫn giữ giỏ → chọn chuyển khoản → tạo đơn 40.000đ → xem trạng thái **chờ đối soát** → mở lịch sử đúng đơn vừa tạo.

Không thực hiện chuyển tiền, không gọi xác nhận của nhân viên và không mô tả đơn đó là PAID. Backend API không được mock. QR và các trường tài khoản nhận được che bằng CSS chỉ trong phiên ghi; request ảnh QR được chặn để không đưa dữ liệu tài khoản vào bản ghi. Các chi tiết này không thay đổi code hay trạng thái của ứng dụng đang phục vụ người dùng.

Video là ghi hình tự động bằng Playwright, không phải biên bản Sprint Review/Retrospective hoặc buổi nghiệm thu của giảng viên. Asset trong release v0.2.1 thuộc phiên bản cũ và được giữ làm lịch sử; file main này là bản thay thế.

## Ghi lại

Từ root repo, cài dependencies và Chromium theo README, sau đó:

```sh
node scripts/record-demo.mjs
```

Lệnh tạo một đơn chuyển khoản pending bằng CUSTOMER demo và ghi đè file video khi toàn bộ kiểm tra UI thành công. Có thể đặt `DEMO_WEB_URL`, `DEMO_EMAIL`, `DEMO_PASSWORD` cho môi trường khác; không commit mật khẩu riêng. Không chạy lặp nếu không cần tạo thêm đơn giữ tồn.
