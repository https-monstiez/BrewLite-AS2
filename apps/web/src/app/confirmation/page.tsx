"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { getOrder, bankInstructions, type BankInstructions } from "@/lib/api";
import type { Order } from "@/lib/types";
const money = (value: number) => value.toLocaleString("vi-VN") + "đ";
const labels: Record<string, string> = {
  PENDING: "Chờ thanh toán / đối soát",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha",
  READY: "Sẵn sàng",
  COMPLETED: "Hoàn tất",
  PAYMENT_FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy",
};
const methods: Record<string, string> = {
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  LOYALTY_POINTS: "Điểm tích lũy",
};
function Content() {
  const id = useSearchParams().get("id");
  const { token } = useApp();
  const [order, setOrder] = useState<Order | null>(null),
    [bank, setBank] = useState<BankInstructions | null>(null),
    [error, setError] = useState(""),
    [imageError, setImageError] = useState(false);
  useEffect(() => {
    if (!id || !token) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const value = await getOrder(id, token);
        if (!active) return;
        setOrder(value);
        setError("");
        const pending = value.payments?.some(
          (p) => p.method === "BANK_TRANSFER" && p.status === "PENDING",
        );
        if (value.status === "PENDING" && pending) {
          const instructions = await bankInstructions(token, id);
          if (active) setBank(instructions);
        } else setBank(null);
        if (
          active &&
          ["PENDING", "PAID", "PREPARING", "READY"].includes(value.status)
        )
          timer = setTimeout(load, 5000);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Không thể tải đơn.");
          timer = setTimeout(load, 10000);
        }
      }
    };
    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, token]);
  const status = order?.status;
  const paid =
    !!status && ["PAID", "PREPARING", "READY", "COMPLETED"].includes(status);
  const method =
    order?.payments?.find(
      (p) => p.status === "SUCCEEDED" || p.status === "PENDING",
    )?.method || order?.payments?.[0]?.method;
  const title = !status
    ? "Đang xác minh đơn hàng"
    : status === "PAID"
      ? "Đặt hàng thành công!"
      : status === "PENDING"
        ? "Đơn hàng đang chờ xác nhận thanh toán"
        : status === "CANCELLED"
          ? "Đơn hàng đã hủy"
          : status === "PAYMENT_FAILED"
            ? "Thanh toán chưa thành công"
            : "Đơn hàng đã được tiếp nhận";
  return (
    <div className="confirmation">
      <div className="check">
        {paid
          ? "✓"
          : status === "CANCELLED" || status === "PAYMENT_FAILED"
            ? "!"
            : "◷"}
      </div>
      <small>BREWLITE ORDER</small>
      <h1>{title}</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!token && (
        <p>
          Vui lòng <Link href="/login">đăng nhập</Link> để xem đơn của bạn.
        </p>
      )}
      {status === "PENDING" && (
        <p>
          Chỉ chuyển khoản một lần. Nhân viên sẽ kiểm tra giao dịch và xác nhận
          sau khi nhận được tiền.
        </p>
      )}
      {paid && (
        <p>Thanh toán đã được ghi nhận. Theo dõi trạng thái đơn bên dưới.</p>
      )}
      {order && (
        <div className="confirmdetail">
          <p>
            Mã đơn hàng <b>#{order.id}</b>
          </p>
          <p>
            Trạng thái <b>{labels[order.status] || order.status}</b>
          </p>
          <p>
            Tổng thanh toán <b>{money(order.total || 0)}</b>
          </p>
          {method && (
            <p>
              Phương thức <b>{methods[method] || method}</b>
            </p>
          )}
        </div>
      )}
      {bank && status === "PENDING" && (
        <section
          className="bank-transfer-panel"
          aria-label="Hướng dẫn chuyển khoản"
        >
          <h2>Quét QR bằng app ngân hàng</h2>
          <p className="real-payment-label">
            Chuyển khoản tiền thật · Chờ nhân viên đối soát
          </p>
          {!imageError ? (
            <img
              className="bank-qr-image"
              src={bank.qrImageUrl}
              alt="Mã VietQR chuyển khoản cho đơn hàng"
              onError={() => setImageError(true)}
            />
          ) : (
            <p role="alert">
              Chưa tải được mã QR. Bạn có thể nhập thông tin chuyển khoản bên
              dưới trong app ngân hàng.
            </p>
          )}
          <dl>
            <dt>Ngân hàng</dt>
            <dd>{bank.bankName}</dd>
            <dt>Số tài khoản</dt>
            <dd>{bank.accountNumber}</dd>
            <dt>Tên người nhận được cung cấp</dt>
            <dd>{bank.accountName}</dd>
            <dt>Số tiền</dt>
            <dd>{money(bank.amount)}</dd>
            <dt>Nội dung chuyển khoản</dt>
            <dd className="transfer-reference">{bank.transferContent}</dd>
          </dl>
          <p>
            Kiểm tra tên người nhận, số tài khoản và số tiền trên app ngân hàng
            trước khi xác nhận. Giữ đúng nội dung để nhân viên tìm được giao
            dịch.
          </p>
          <a
            className="back"
            href={bank.qrImageUrl}
            target="_blank"
            rel="noreferrer"
          >
            Mở mã QR để lưu hoặc quét từ ảnh
          </a>
          <p role="status">
            Trang tự cập nhật khi nhân viên xác nhận. Việc mở hoặc quét QR không
            tự đánh dấu đơn đã thanh toán.
          </p>
        </section>
      )}
      {(status === "CANCELLED" || status === "PAYMENT_FAILED") && (
        <p>
          Không chuyển thêm tiền cho đơn này. Nếu bạn đã chuyển, liên hệ nhân
          viên để đối soát.
        </p>
      )}
      <Link className="btn" href="/orders">
        Xem lịch sử đơn ↗
      </Link>
      <Link className="back" href="/">
        Về trang chủ
      </Link>
    </div>
  );
}
export default function Confirmation() {
  return (
    <Suspense fallback={<div className="state">Đang tải...</div>}>
      <Content />
    </Suspense>
  );
}
