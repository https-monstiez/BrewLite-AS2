# Hoàn tất Task 5.3 — CD trên Render và Vercel

## Trạng thái

Script và workflow hỗ trợ đúng service Render **Git-backed** hiện tại. Nhóm đã lưu secrets/variables và bật CD. [Run 43685179367](https://github.com/https-monstiez/BrewLite-AS2/actions/runs/43685179367) đã deploy/smoke thành công trên SHA `2af63a27619e7062e94bc6163643448e08a1b7f8`; các bước dưới đây dùng để tái tạo cấu hình hoặc chuyển môi trường.

Luồng sau khi bật: quality gate → image SHA/GHCR → Render deploy đúng `commitId` → startup migration → API health/SHA/menu → Vercel hook của `main` → web version/trang chủ → kiểm tra lại API SHA. Lỗi dừng job và dẫn tới runbook rollback; không tự reset database. Image GHCR là tạo phẩm đóng gói, service Render hiện build Docker từ Git.

## 1. Lưu secrets trực tiếp trong GitHub

Mở [Actions secrets của repo AS2](https://github.com/https-monstiez/BrewLite-AS2/settings/secrets/actions), chọn **New repository secret** cho từng biến:

| Tên secret | Lấy từ đâu |
| --- | --- |
| `RENDER_API_KEY` | Render → Account Settings → API Keys → tạo key dành cho đồ án |
| `RENDER_SERVICE_ID` | Render → service `brewlite-as2-api`; ID dạng `srv-...` trong URL dashboard |
| `VERCEL_DEPLOY_HOOK` | Vercel → dự án `brew-lite-as-2` → Settings → Git → Deploy Hooks; tạo hook tên `github-cd`, branch **main**, rồi sao chép URL vào secret |

Không gửi key/hook vào chat, không ghi vào file được Git theo dõi. Hook URL là secret vì người biết URL có thể kích hoạt build.

## 2. Khai báo variables

Mở [Actions variables](https://github.com/https-monstiez/BrewLite-AS2/settings/variables/actions) và thêm:

| Tên | Giá trị |
| --- | --- |
| `API_HEALTH_URL` | `https://brewlite-as2-api.onrender.com/api/health` |
| `API_PUBLIC_URL` | `https://brewlite-as2-api.onrender.com/api` |
| `WEB_URL` | `https://brew-lite-as-2.vercel.app/` |
| `DEPLOY_TARGET` | `render` |
| `PRODUCTION_DEPLOY_ENABLED` | `true` — chỉ đặt sau khi các secrets và URLs đã đủ |

Vercel production vẫn cần `NEXT_PUBLIC_API_URL=https://brewlite-as2-api.onrender.com/api`. Trong GitHub → Settings → Environments, tạo/kiểm tra environment `production`; không thêm quy tắc approval nếu nhóm không cần.

## 3. Chạy và lưu minh chứng

1. Merge PR sửa CD sau khi required CI xanh. Trên Render, kiểm tra API tiếp tục dùng đúng repo AS2, nhánh `main`, Docker và database hiện tại; không tạo service/DB trả phí mới.
2. Khi secrets đã đủ và sẵn sàng dùng CD làm cơ chế deploy API, đổi Render **Auto-Deploy → Off** trong service Settings để tránh Render tự deploy cùng lúc với workflow. Có thể giữ Git integration của Vercel; workflow vẫn gọi hook và xác minh SHA. Chưa đủ cấu hình thì giữ cơ chế tự deploy hiện tại để website tiếp tục được cập nhật.
3. Mở [Delivery workflow](https://github.com/https-monstiez/BrewLite-AS2/actions/workflows/cd.yml) → **Run workflow** → chọn **main**. Chỉ `main` được phép chạy job deploy production. Tag/release không kích hoạt deploy lại commit cũ.
4. Chờ job `deploy` xanh, không phải skipped. Xem log `Deployment and smoke tests passed for <SHA>` và tab Summary. Render chạy `prisma migrate deploy` trước khi khởi động API; migration lỗi thì service không được coi là triển khai thành công.
5. Lưu URL run, SHA, ngày giờ và ảnh log không chứa secret vào báo cáo/checklist. Kiểm tra thêm đăng nhập, checkout mô phỏng và xử lý đơn trên website. Chỉ sau đó đánh dấu Task 5.3 hoàn thành.

Hook Vercel triển khai đầu nhánh main, không pin commit như Render API. Tránh merge commit mới trong lúc CD chạy. Workflow từ chối commit main đã cũ trước khi deploy; smoke sẽ thất bại nếu web/API không cùng SHA, kể cả khi nền tảng báo build thành công.

## Rollback

Xem [deployment.md](deployment.md#rollback). Ghi SHA tốt gần nhất trước khi chạy. Nếu deploy thất bại, dừng phát hành tiếp, dùng Render Manual Deploy → Deploy a specific commit với SHA tốt và Vercel promote bản tương thích; xác minh health/menu/version lại. Không chạy migration reset hoặc xóa database. Sau rollback cần kiểm tra tương thích schema và ứng dụng; migration phá vỡ tương thích phải fix-forward hoặc phục hồi có kế hoạch.

## Tài liệu nền tảng

- [Render Trigger Deploy API](https://api-docs.render.com/reference/create-deploy): service Git-backed nhận `commitId`; `imageUrl` dành cho image-backed.
- [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks): hook gắn với project/repository/branch.
