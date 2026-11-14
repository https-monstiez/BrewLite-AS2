"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { paymentReturn } from "@/lib/api";
export default function PaymentReturn() {
  const [message, setMessage] = useState(
    "Đang xác minh kết quả thanh toán với máy chủ...",
  );
  useEffect(() => {
    let active = true;
    paymentReturn(window.location.search.slice(1))
      .then((result) => {
        if (active)
          setMessage(
            ["00", "02"].includes(result.RspCode)
              ? "Đã nhận kết quả. Mở lịch sử đơn để xem trạng thái đã xác minh."
              : "Kết quả chưa được xác minh. Vui lòng kiểm tra lịch sử đơn.",
          );
      })
      .catch(() => {
        if (active)
          setMessage("Chưa thể xác minh. Kiểm tra kết nối và lịch sử đơn.");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="wrap sub">
      <h1>Kết quả VNPay</h1>
      <p role="status">{message}</p>
      <Link href="/orders">Xem đơn hàng của tôi</Link>
    </div>
  );
}
