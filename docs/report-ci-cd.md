# CI/CD và triển khai hệ thống

## Continuous Integration

Dự án sử dụng GitHub Actions để tự động kiểm tra các thay đổi khi có Pull Request và khi cập nhật các nhánh được cấu hình. Quy trình CI gồm cài đặt dependencies, sinh Prisma Client, chạy ESLint, chạy unit test và kiểm thử HTTP authorization cho backend bằng Jest, chạy test giao diện bằng Vitest, áp dụng migration trên PostgreSQL dùng riêng cho kiểm thử, chạy integration test với PostgreSQL thật, build backend/frontend và chạy kiểm thử end-to-end trên trình duyệt bằng Playwright. Workflow lưu browser report và test results làm artifact khi chạy CI. Branch protection trên `main` yêu cầu check `Lint, tests and build` theo cấu hình đã được ghi nhận trong hồ sơ CI.

Các lần chạy trên nhánh `main` tại [CI run #13](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43635976686) và trong quy trình Delivery đã hoàn tất thành công. Repo cũng cấu hình required check trên `main` theo hồ sơ kiểm chứng của dự án; thay đổi không đạt quality gate không được xem là đủ điều kiện để tích hợp.

## Đóng gói và phát hành image

Sau quality gate, workflow Delivery build Docker image cho API và web, gắn tag theo commit SHA rồi đẩy image lên GitHub Container Registry (GHCR). [Delivery run #2](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43635976761) hoàn tất thành công trên commit `ab5af1728c75be75c6b5c7d150fcd6ed6028d409`, cũng là SHA được quan sát trên website và API production. Việc build/push image lên GHCR là bước đóng gói; không tự nó chứng minh workflow đã triển khai image đó lên production.

## Triển khai production

Hệ thống production sử dụng Vercel cho frontend Next.js và Render cho API NestJS cùng PostgreSQL. Theo cấu hình `render.yaml`, Render Web Service được liên kết trực tiếp với repository AS2 và nhánh `main`, đặt `autoDeployTrigger: checksPass`; Render triển khai service từ repository sau khi các kiểm tra tương ứng đạt. Vercel cung cấp website tại [brew-lite-as-2.vercel.app](https://brew-lite-as-2.vercel.app/). API và health check lần lượt ở [API menu](https://brewlite-as2-api.onrender.com/api/products) và [API health](https://brewlite-as2-api.onrender.com/api/health).

Ngày 15/11/2026, smoke check công khai xác nhận API health trả `status: ok`, API menu trả năm sản phẩm, và endpoint phiên bản của web cùng API báo SHA `ab5af1728c75be75c6b5c7d150fcd6ed6028d409`.

Workflow GitHub Actions có job triển khai image-backed/VPS tùy cấu hình, nhưng các job này chỉ chạy khi bật biến `PRODUCTION_DEPLOY_ENABLED` và khai báo secrets/URLs phù hợp. Môi trường production đang mô tả ở trên được triển khai qua tích hợp Git của Render và Vercel; không đồng nhất cơ chế này với việc GitHub Actions trực tiếp triển khai image production.

## Kiểm tra sau triển khai và giới hạn

Render kiểm tra health tại `/api/health`. Các endpoint production đã được gọi để xác nhận khả năng phản hồi và phiên bản đang chạy. Những kiểm tra này không thay thế kiểm thử end-to-end giao dịch trên dữ liệu production. Không thực hiện thanh toán thật trong kiểm thử; VNPay chỉ là sandbox khi merchant được cấu hình, còn phương thức chuyển khoản cần nhân viên đối soát theo quy trình nghiệp vụ.
