# Triển khai AS2 trên VPS — từ môi trường chưa có hạ tầng

Trạng thái: cấu hình đã chuẩn bị; nhóm chưa có VPS/domain nên chưa có production thật. Dùng local Docker để phát triển/demo trước; không cần mua máy chủ ngay. Đây là một lựa chọn thay thế Vercel/Render, không cần vận hành cả hai mô hình cùng lúc.

## Kiến trúc
Một VPS Linux chạy Docker Compose: Caddy nhận cổng 80/443 và cấp HTTPS; Next.js phục vụ web; `/api/*` chuyển đến NestJS; PostgreSQL chỉ ở mạng Docker nội bộ có volume bền. API và web không publish cổng ra Internet. Domain dùng chung nên frontend build với NEXT_PUBLIC_API_URL=/api. Image API/web cùng tag SHA từ GHCR; secret đặt trên VPS, không nằm trong image/Git.

## Chuẩn bị khi nhóm đã có máy chủ
1. Có VPS Linux x86_64/arm64 phù hợp image được build, SSH bằng key, Docker Engine/Compose v2, curl, Python 3. Workflow mặc định build linux/amd64; VPS arm64 cần bật build đa kiến trúc trước.
2. Có domain/subdomain A/AAAA trỏ đúng IP VPS. Chỉ mở 80/443 và SSH cần dùng; không mở 5432/3000/3001. Hạn chế SSH theo IP khi có thể.
3. Clone **repo AS2** vào thư mục riêng, ví dụ `/opt/brewlite-as2`; không dùng checkout AS1. Đảm bảo tài khoản deploy có quyền Docker (quyền này tương đương quản trị máy).
4. `cd deploy/vps`, `cp env.example .env`, `chmod 600 .env`. Điền domain/email và sinh bốn secret khác nhau bằng `openssl rand -hex 32`, nhập trực tiếp vào file. Password dùng HEX để không lỗi URL encoding. Không gửi các secret vào chat hoặc commit.
5. Đăng nhập GHCR trên VPS bằng credential chỉ read:packages để pull image GHCR khi registry để private: `docker login ghcr.io -u https-monstiez`. Lưu credential an toàn trên máy chủ.
6. Chọn SHA image có CI đạt và đã push registry. Chạy `bash deploy.sh <FULL_COMMIT_SHA>`. Script pull image, đợi health, kiểm cùng SHA cho API/web và HTTPS. File `.last-good-image` chỉ cập nhật sau smoke đạt.
7. Seed menu một lần nếu DB mới: `IMAGE_TAG=<SHA> docker compose --env-file .env -f compose.yml exec api npm run db:seed`. Không tự tạo tài khoản demo trên production.

## Database hai tầng quyền
`db-init.sql` chỉ chạy lần khởi tạo volume mới: tạo migrator và app role không có quyền superuser, schema thuộc migrator; default privileges chỉ cấp CRUD/sequences cho app. Startup API dùng MIGRATION_DATABASE_URL để migrate rồi xóa biến này khỏi env của tiến trình API. DB admin riêng chỉ dùng quản trị/backup. Với volume có sẵn, cần quản trị tạo/grant roles tường minh; không xóa volume để chạy lại init.

## CI/CD cho VPS
Trong GitHub repo AS2, đặt `DEPLOY_TARGET=vps`, `PRODUCTION_DEPLOY_ENABLED=true`. Secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_SSH_KNOWN_HOSTS. Variable VPS_PATH là đường dẫn thư mục **deploy/vps** trên máy chủ, ví dụ `/opt/brewlite-as2/deploy/vps`. Xác minh host key độc lập trước khi lưu vào secret; không dùng StrictHostKeyChecking=no.

CD chạy quality gate, build/push hai image SHA; scp cấu hình không chứa `.env`, SSH chạy deploy.sh với SHA. Secret/registry credential phải được cấu hình trên VPS trước; CD không tạo máy chủ, mua domain hay ghi đè file `.env`.

## Backup và rollback
- Backup DB định kỳ: `docker compose --env-file .env -f compose.yml exec -T db pg_dump -U postgres brewlite > backup.sql`; bảo vệ/mã hóa và sao chép backup ra nơi khác, không commit file dump.
- Khi lỗi: dùng `.previous-good-image` hoặc SHA tốt trước đó từ lịch sử delivery rồi `bash deploy.sh <SHA_CU>`. Script thất bại giữ `.last-good-image` cũ, không tự tuyên bố rollback đã hoàn tất.
- Giữ nguyên volume và migration additive. Không dùng down -v hay migrate reset trên production. Nếu DB cần thay đổi ngược không tương thích, fix-forward/restore backup theo kế hoạch bảo trì.
- Log: `docker compose --env-file .env -f compose.yml logs --tail=100 api`; không công khai log chứa dữ liệu cá nhân.

## Điều kiện được đánh dấu hoàn thành
HTTPS web thật; `/api/health` và `/version` đúng SHA; đặt đơn thành công và thất bại; DB không public; backup/rollback đã thử; URL, ngày giờ, SHA và người nghiệm thu được ghi trong docs/deployment.md. Cấu hình hiện tại chưa thay cho các minh chứng đó.
