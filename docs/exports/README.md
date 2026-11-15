# Báo cáo bàn giao

- [Bản PDF](BrewLite-AS2-Bao-cao.pdf): trình bày A4, sơ đồ vector, mục lục và liên kết minh chứng.
- [Bản Word chỉnh sửa](BrewLite-AS2-Bao-cao.docx): có bìa, heading, bảng và sơ đồ được nhúng.
- Nguồn: [report-as2.md](../report-as2.md).

Bản báo cáo cập nhật ngày 15/11/2026, đối chiếu code `55c02e4` và CI run `43710893938`. Nội dung mô tả ngân hàng/điểm hiện tại; ghi rõ khác biệt FR-06 và quyền admin bypass CI. Review/Retrospective được dẫn là dự thảo, không ghi nhận cuộc họp chưa xác nhận.

## Xuất lại

Cần Node/dependencies của apps/web, Chromium Playwright và Python 3.9+:

```sh
python3 -m venv /tmp/brewlite-report-venv
/tmp/brewlite-report-venv/bin/pip install -r scripts/requirements-report.txt
/tmp/brewlite-report-venv/bin/python scripts/export-report.py
```

Chạy từ root repo. Công cụ render SVG thành ảnh nhúng Word và xuất PDF qua Chromium; HTML/ảnh trung gian nằm trong thư mục tạm, không cần để mở PDF/DOCX.
