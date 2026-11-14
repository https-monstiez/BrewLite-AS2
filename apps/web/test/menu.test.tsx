import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Home from "../src/app/page";
import { products } from "../src/lib/api";
vi.mock("../src/lib/api", () => ({ products: vi.fn() }));
describe("FR-01 menu states", () => {
  beforeEach(() => vi.clearAllMocks());
  it("shows loading until the API responds", () => {
    vi.mocked(products).mockReturnValue(new Promise(() => {}));
    render(<Home />);
    expect(screen.getByText("Đang tải thực đơn...")).toBeInTheDocument();
  });
  it("shows an empty menu", async () => {
    vi.mocked(products).mockResolvedValue({ list: [], demo: false, error: "" });
    render(<Home />);
    expect(
      await screen.findByText("Chưa có sản phẩm trong danh mục này."),
    ).toBeInTheDocument();
  });
  it("shows an API failure instead of an unhandled rejection", async () => {
    vi.mocked(products).mockRejectedValue(new Error("Không kết nối được"));
    render(<Home />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không kết nối được",
    );
  });
  it("searches the real catalog by name", async () => {
    vi.mocked(products).mockResolvedValue({
      list: [
        {
          id: "coffee",
          name: "Cà phê sữa",
          price: 29000,
          stock: 1,
          category: "Đồ uống",
        },
        {
          id: "tea",
          name: "Trà đào",
          price: 39000,
          stock: 0,
          category: "Đồ uống",
        },
      ],
      demo: false,
      error: "",
    });
    render(<Home />);
    await screen.findByText("Cà phê sữa");
    fireEvent.change(screen.getByLabelText("Tìm đồ uống"), {
      target: { value: "trà" },
    });
    expect(screen.queryByText("Cà phê sữa")).not.toBeInTheDocument();
    expect(screen.getByText("Trà đào")).toBeInTheDocument();
  });
});
