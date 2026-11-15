# Video demo mobile trên production

[Video checkout-mobile.webm](checkout-mobile.webm) — khoảng 20 giây, viewport 390 × 844, ghi ngày 15/11/2026 trên website Vercel và API Render thật bằng Playwright.

Luồng đã quan sát: đăng nhập CUSTOMER demo → mở món → chọn size M, đường/đá 50% → thêm giỏ → reload vẫn giữ giỏ → chọn Thẻ mô phỏng → tạo đơn/thanh toán → API xác nhận đã trả 40.000đ. Không mock API và không chuyển tiền ngân hàng thật. Video là ghi hình tự động, không phải biên bản nghiệm thu của giảng viên hay buổi họp nhóm.

Tải file để xem hoặc dùng cùng phần thuyết minh khi bảo vệ. Video không thay thế Sprint Review/Retrospective.

## Ghi lại từ máy local

Từ root repo, sau khi `npm run install:apps` và `npx playwright install chromium` trong apps/web:

```sh
node scripts/record-demo.mjs
```

Mặc định dùng website online và CUSTOMER demo được công khai trong README. Lệnh tạo **một đơn mô phỏng mới** và ghi đè video trong `docs/demo`. Có thể đặt `DEMO_WEB_URL`, `DEMO_EMAIL`, `DEMO_PASSWORD` để dùng môi trường/tài khoản khác; không commit giá trị mật khẩu riêng.
