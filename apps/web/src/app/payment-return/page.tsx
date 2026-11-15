import Link from "next/link";

export default function PaymentReturn() {
  return (
    <div className="wrap sub">
      <h1>Kiểm tra trạng thái đơn hàng</h1>
      <p role="status">
        VNPay hiện không được hỗ trợ. Vui lòng mở lịch sử đơn để xem trạng thái
        thanh toán được hệ thống ghi nhận.
      </p>
      <Link href="/orders">Xem đơn hàng của tôi</Link>
    </div>
  );
}
