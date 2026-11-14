"use client";
import { useEffect, useState } from "react";
export default function PwaStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline ? (
    <p role="status" className="offline-banner">
      Bạn đang mất kết nối. Giỏ hàng vẫn được lưu; hãy kết nối lại để đặt và
      thanh toán.
    </p>
  ) : null;
}
