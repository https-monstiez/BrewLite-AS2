import { afterEach, expect, it, vi } from "vitest";
import { getMyProfile, login } from "../src/lib/api";

afterEach(() => vi.unstubAllGlobals());
const unauthorized = () => ({ ok: false, status: 401, text: async () => JSON.stringify({ message: "Unauthorized" }) });

it("reports incorrect credentials on login instead of an expired session", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(unauthorized()));
  await expect(login("admin@example.test", "incorrect-password")).rejects.toThrow("Email hoặc mật khẩu không đúng.");
});

it("still reports an expired session for an authenticated profile request", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(unauthorized()));
  await expect(getMyProfile("expired-token")).rejects.toThrow("Phiên đăng nhập đã hết hạn.");
});
