# Bắt đầu AS2 khi nhóm chưa có hạ tầng

## 1. Những gì nhóm đã có
Repo riêng https://github.com/https-monstiez/BrewLite-AS2; code web/API/DB, hồ sơ AS2 và CI. AS1 của Hiếu giữ riêng. Các mục đã kiểm chứng và minh chứng CI nằm trong [testing.md](testing.md). Chưa cần mua VPS, domain hay có tài khoản VNPay để thử luồng mô phỏng.

## 2. Chạy trên máy cá nhân
Cài và mở Docker Desktop, Git. Clone repo AS2, mở terminal tại root. Copy `.env.example` thành `.env`, đổi POSTGRES_PASSWORD và JWT_SECRET; dùng password HEX hoặc URL-safe. Nếu máy đang chạy AS1 trên 3000/3001, đặt trong `.env`:

```dotenv
WEB_PORT=3200
API_PORT=3201
FRONTEND_ORIGIN=http://localhost:3200
NEXT_PUBLIC_API_URL=http://localhost:3201/api
```

Sau đó chạy:
```sh
docker compose up --build -d --wait
docker compose exec api npm run db:seed
```
Mở http://localhost:3200 nếu dùng cấu hình trên; health http://localhost:3201/api/health. Lần đầu build cần tải thư viện. DB có volume, khởi động lại không mất dữ liệu. Không dùng down -v nếu muốn giữ dữ liệu.

## 3. Thử chức năng
Đăng ký tài khoản mới trên giao diện; chọn món/size/topping/đường/đá, thêm giỏ; chọn **Ví mô phỏng** hoặc **Thẻ mô phỏng**, kết quả thành công hoặc bị từ chối. Đây là demo không thu tiền. VNPay chỉ dùng sau khi nhóm có merchant sandbox.

Để thử ba vai trò trên **máy local**, có thể seed tài khoản mẫu tường minh:
```sh
docker compose exec -e SEED_DEMO_ACCOUNTS=true api npm run db:seed
```
Tài khoản demo hiện có trong apps/api/prisma/seed.ts; chỉ dùng dữ liệu mẫu local. Không bật tùy chọn này trên máy chủ công khai. Đăng nhập STAFF để nhận đơn đã trả tiền, ADMIN để quản lý món/voucher/nguyên liệu. Có thể tự đăng ký rồi cấp role bằng DB thay cho demo accounts.

## 4. Làm việc nhóm
Mọi thay đổi ở repo AS2, mở nhánh/PR; đợi required CI xanh mới merge. Không sửa/push repo AS1. Đọc backlog, SRS và ma trận truy vết trước khi sửa nghiệp vụ; cập nhật tài liệu/test liên quan cùng PR. GitHub Project có thể bổ sung sau, không cản việc chạy app.

## 5. Khi cần public demo để nộp
Chọn **một** phương án: VPS hoặc Vercel/Render. Bộ cấu hình đã chuẩn bị trong deploy/vps và docs/deployment.md. Lúc đó mới cần máy chủ, domain/URL và cấu hình secret trực tiếp trên nền tảng. Không gửi secret vào chat/Git. Chỉ đánh dấu deploy hoàn thành khi URL HTTPS hoạt động và smoke/version check đạt.

## 6. Hồ sơ còn cần nhóm thực hiện thật
Điền thành viên/lịch họp, Sprint Review/Retrospective; ghi video/demo; cung cấp URL production; tạo release nghiệm thu. Các mẫu có sẵn trong docs/process/handover.md, không dùng mẫu làm minh chứng sự kiện đã diễn ra.

## Đợt nộp 16–18/11/2026
Ưu tiên [deploy miễn phí](deploy-mien-phi.md): Vercel Hobby + Render Free API/DB. Nhóm đã chọn nhận chuyển khoản qua VietQR; cấu hình tài khoản nhận ở env riêng. VNPay/MoMo production cần merchant được duyệt; không dùng nhãn cổng thật khi chưa có.
