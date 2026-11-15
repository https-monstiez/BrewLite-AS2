# Deploy miễn phí để nộp đồ án — Vercel + Render

Trạng thái cập nhật 15/11/2026: web và API đã được deploy; public smoke đạt. URL/SHA và giới hạn xác minh ghi tại [deployment.md](deployment.md). Hướng dẫn dưới đây ghi lại cấu hình/kiểm tra nền tảng; không tạo thêm tài nguyên nếu đã có service.

**Lưu ý database:** Render dashboard báo PostgreSQL Free sẽ bị xóa ngày **15/12/2026** nếu không nâng cấp lên gói compute trả phí. Không tự nâng cấp. Nhóm cần xuất/backup dữ liệu trước hạn hoặc lên kế hoạch chuyển database; kiểm tra khả năng khôi phục backup trước khi xóa/hết hạn.

## Thành phần
- Web Next.js: Vercel **Hobby**, root `apps/web`.
- API NestJS: Render Web Service **Free**, Docker context `apps/api`.
- PostgreSQL: Render Postgres **Free**, cùng region Singapore; chặn toàn bộ kết nối public (`ipAllowList: []`), API dùng internal connection string.
- Không cần VPS, mua domain, disk hoặc nâng gói. Dùng URL HTTPS mặc định của hai nền tảng.

## 1. Web trên Vercel
Đăng nhập GitHub tại https://vercel.com/signup. Chọn tài khoản cá nhân **Hobby**, không chọn Pro trial.

Add New → Project → import `https-monstiez/BrewLite-AS2` → Root Directory **apps/web** → Framework **Next.js** → Install `npm ci` → Build `npm run build` → Deploy.

Lưu URL production thực tế dạng `https://<ten-project>.vercel.app`. Ở giai đoạn này menu có thể báo chưa kết nối backend; bước 3 sẽ nối URL API. Không dùng URL preview ngẫu nhiên làm CORS origin lâu dài.

## 2. API và database trên Render
Đăng nhập GitHub tại https://dashboard.render.com/register và cho Render truy cập **repo AS2**. Tạo Blueprint từ repo, nhánh `main`, file `render.yaml`. Có thể dùng [Deploy to Render](https://render.com/deploy?repo=https://github.com/https-monstiez/BrewLite-AS2).

Blueprint khai báo đúng **hai tài nguyên**, cả hai `plan: free`. Nhập FRONTEND_ORIGIN bằng URL Vercel ở bước 1, không có dấu `/` cuối và không thêm `/api`. Nhập BANK_BIN, BANK_ACCOUNT_NUMBER, BANK_ACCOUNT_NAME trực tiếp vào Render bằng thông tin nhận tiền đã thống nhất trong nhóm; không commit các giá trị này. Vietcombank dùng BIN 970436. Kiểm tra màn hình xác nhận: API Free, database Free; không xác nhận nếu nền tảng đổi sang plan trả phí. Nếu tài khoản yêu cầu xác minh thanh toán, dừng và thông báo để xem phương án khác; không tự nâng gói.

Đợi deploy. Startup chạy migration rồi seed **chỉ khi catalog trống**. Không tự tạo tài khoản demo có mật khẩu công khai; restart không ghi đè giá/tồn đã sửa.

Mở URL health thực tế `https://<api-host>.onrender.com/api/health`: phải trả `status: ok`. Mở `/api/products`: phải có 5 món mẫu trên DB mới. API dùng PORT do Render cấp, health hiển thị commit Render đã deploy. Không copy DATABASE_URL/JWT_SECRET vào chat hoặc frontend.

## 3. Nối frontend với API
Vercel → Project → Settings → Environment Variables:

```text
NEXT_PUBLIC_API_URL=https://<api-host-thuc-te>.onrender.com/api
```

Áp dụng cho **Production**, sau đó Redeploy web. Đây là URL công khai, không phải secret. Không dùng `localhost`, IP Docker hoặc internal DB URL trong frontend. Mở lại web bằng điện thoại; đăng ký tài khoản mới và thanh toán.

Nếu đổi tên/domain frontend, cập nhật FRONTEND_ORIGIN trên Render và redeploy API. Nếu đổi API URL, sửa NEXT_PUBLIC_API_URL và build/redeploy web.

## 4. Quản trị để demo
Tài khoản mới là CUSTOMER. Để tạo quản lý lần đầu, Render → API service → Environment, thêm **trực tiếp trên dashboard**:

```text
BOOTSTRAP_ADMIN_EMAIL=<email-mới-chưa-đăng-ký>
BOOTSTRAP_ADMIN_PASSWORD=<mật-khẩu-riêng-tối-thiểu-12-ký-tự-tối-đa-72-byte>
```

Save/redeploy. Startup tạo đúng một ADMIN, hash mật khẩu; không ghi mật khẩu vào log, không mở endpoint cấp quyền. Nếu email đã thuộc CUSTOMER/STAFF thì từ chối, không tự nâng quyền tài khoản có sẵn. Khi ADMIN đã tồn tại, restart không đổi mật khẩu. Sau khi đăng nhập được, xóa hai biến bootstrap khỏi Render và redeploy; tài khoản vẫn còn trong DB.

Đăng nhập bằng tài khoản quản lý vừa tạo. Cho thành viên đăng ký tài khoản riêng, rồi quản lý đổi role thành STAFF ở trang Quản lý khách hàng. Gửi thông tin tài khoản demo riêng cho giảng viên, không đưa lên repo/chat. Không bật các tài khoản seed với mật khẩu công khai trên Internet.

Blueprint bản miễn phí dùng tài khoản DB quản lý do Render tạo. Tách riêng migrator/app role là bước hardening cần cấu hình thêm, không tự coi đã có chỉ vì VPS có mẫu hai tầng quyền.

## 5. Trước nộp và demo
- Ngày 16/11: gửi **URL frontend production** cùng repo AS2 và URL health. Không gửi localhost hoặc địa chỉ mẫu trong tài liệu.
- Trước demo 18/11 khoảng 5–10 phút: mở web và health để backend thức dậy, đợi menu tải rồi thử đơn mô phỏng.
- Xác minh trên điện thoại qua Wi-Fi và 4G: menu → tùy chọn → giỏ → đăng ký/đăng nhập → thanh toán mô phỏng → xác nhận/lịch sử.
- Kiểm tra UI STAFF/ADMIN sau khi cấp tài khoản; chụp/lưu log health, SHA, URL, CI và ghi video/demo thật.
- Ghi thời điểm tạo và ngày hết hạn database trong docs/deployment.md. Export/backup trước hết hạn; không coi Free là lưu trữ vĩnh viễn.
- Giới hạn và lỗi thư viện kế thừa theo issue #2 cần tiếp tục vá trước khi công khai; không đưa dữ liệu cá nhân hoặc thanh toán thật vào demo.

## Giới hạn miễn phí đã kiểm tra
Render API ngủ sau 15 phút không có truy cập; đánh thức có thể mất khoảng 1 phút. Render Postgres Free hết hạn 30 ngày sau tạo. Free web service không có shell/SSH và one-off job; vì vậy seed catalog được xử lý trong startup. Khi quota không đủ, kiểm tra dashboard; không bấm Upgrade để xử lý tự động.

Nguồn: [Render Free](https://render.com/docs/free), [Blueprint spec](https://render.com/docs/blueprint-spec), [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## CI/CD ở phương án miễn phí
Render service này build từ Git và dùng `autoDeployTrigger: checksPass`; cần GitHub integration để kiểm tra CI trên nhánh main. Lần deploy đầu được xác nhận trong dashboard. Vercel Git integration build web từ main; không merge PR khi required CI chưa xanh.

Workflow CD hiện hỗ trợ đúng service Git-backed bằng `commitId`. Để hoàn tất Task 5.3, làm theo [cd-setup.md](cd-setup.md): thêm secrets/variables, bật `PRODUCTION_DEPLOY_ENABLED=true` sau khi đủ cấu hình và chạy Delivery trên main. GHCR vẫn lưu image SHA làm tạo phẩm. Chưa có run deploy/smoke thành công thì không đánh dấu CD hoàn tất.
