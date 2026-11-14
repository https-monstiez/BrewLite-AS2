
"use client";

import Link from "next/link";
import { getOrder } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function Content() {
  const p = useSearchParams();
  const { token } = useApp();
  const [verified, setVerified] = useState<{ id: string; status: string; total?: number } | null>(null);
  const [error, setError] = useState("");
  const requestedId = p.get("id");
  useEffect(() => { if (!token || !requestedId) return; let active=true; getOrder(requestedId, token).then(o => { if(active) setVerified(o); }).catch(e => { if(active) setError(e instanceof Error ? e.message : "Không thể tải đơn."); }); return () => {active=false;}; }, [token, requestedId]);
  const [saved, S] = useState<any>(null);

  useEffect(() => {
    try {
      S(JSON.parse(localStorage.getItem("bl_last_order") || "null"));
    } catch {
      S(null);
    }
  }, []);

  const id = verified?.id || requestedId || "—";
  const status = verified?.status || "VERIFYING";
  const method = saved?.method;

  const title =
    status === "VERIFYING" ? "Đang xác minh đơn hàng" : status === "PAYMENT_FAILED"
      ? "Thanh toán chưa thành công"
      : status === "PENDING"
        ? "Đơn hàng đang chờ xác nhận thanh toán"
        : status === "PAID"
          ? "Đặt hàng thành công!"
          : "Đơn hàng đã được tiếp nhận";

  const description =
    status === "PENDING"
      ? method === "LOYALTY_POINTS"
        ? "Đơn hàng của bạn đang chờ xử lý."
        : "Yêu cầu thanh toán đã được gửi. Nhân viên sẽ kiểm tra và xác nhận sau khi nhận được tiền."
      : status === "PAYMENT_FAILED"
        ? "Thanh toán chưa hoàn tất. Vui lòng liên hệ nhân viên để được hỗ trợ."
        : "Thanh toán thành công! Vui lòng theo dõi trạng thái đơn hàng.";

  const statusLabel =
    status === "PENDING"
      ? "Đang chờ xác nhận thanh toán"
      : status === "PAID"
        ? "Đã thanh toán"
        : status === "PAYMENT_FAILED"
          ? "Thanh toán thất bại"
          : status;

  return (
    <div className="confirmation">
      <div className="check">✓</div>

      <small>ORDER RECEIVED</small>

      <h1>{title}</h1>

      <p>{status === "VERIFYING" ? error || "Đang tải trạng thái từ máy chủ. Vui lòng đăng nhập nếu cần." : description}</p>

      <div className="confirmdetail">
        <p>
          Mã đơn hàng <b>#{id}</b>
        </p>

        <p>
          Trạng thái <b>{statusLabel}</b>
        </p>

        {saved?.total != null && (
          <p>
            Tổng thanh toán{" "}
            <b>{Number(saved.total).toLocaleString("vi-VN")}đ</b>
          </p>
        )}

        {method && (
          <p>
            Phương thức thanh toán{" "}
            <b>
              {method === "LOYALTY_POINTS"
                ? "Điểm tích lũy"
                : method === "BANK_TRANSFER"
                  ? "Chuyển khoản ngân hàng"
                  : method === "VNPAY"
                    ? "VNPay"
                    : method === "MOMO"
                      ? "MoMo"
                      : method}
            </b>
          </p>
        )}
      </div>

      <p>☕ Mời bạn theo dõi đơn hàng và nhận đồ uống tại quầy.</p>

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
