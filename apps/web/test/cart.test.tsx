import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, it, expect, beforeEach } from "vitest";
import { AppProvider, useApp } from "../src/context/AppContext";
import { useCartStore } from "../src/lib/cart-store";
vi.mock("../src/lib/api", () => ({ getMyProfile: vi.fn() }));
const coffee = { id: "coffee", name: "Coffee", price: 29000, stock: 20 };
function CartProbe() {
  const { cart, add, qty, total, remove } = useApp();
  return (
    <>
      <button onClick={() => add(coffee, "M", ["Kem cheese"], 1, "50", "100")}>
        Add
      </button>
      <button onClick={() => add(coffee, "M", ["Kem cheese"], 1, "100", "100")}>
        Other sugar
      </button>
      <button onClick={() => qty(cart[0].key, 0)}>Remove zero</button>
      <button onClick={() => remove(cart[0].key)}>Remove</button>
      <output data-testid="cart">{JSON.stringify({ cart, total })}</output>
    </>
  );
}
beforeEach(() => useCartStore.setState({ cart: [] }));
it("merges identical options, keeps sugar variants separate, prices and persists the cart", async () => {
  const ui = render(
    <AppProvider>
      <CartProbe />
    </AppProvider>,
  );
  await waitFor(() => expect(localStorage.getItem("bl_cart")).toBe("[]"));
  fireEvent.click(screen.getByText("Add"));
  fireEvent.click(screen.getByText("Add"));
  fireEvent.click(screen.getByText("Other sugar"));
  let value = JSON.parse(screen.getByTestId("cart").textContent!);
  expect(value.cart).toHaveLength(2);
  expect(value.cart[0].quantity).toBe(2);
  expect(value.total).toBe(123000);
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem("bl_cart")!)).toHaveLength(2),
  );
  ui.unmount();
  useCartStore.setState({ cart: [] });
  render(
    <AppProvider>
      <CartProbe />
    </AppProvider>,
  );
  await waitFor(() => expect(useCartStore.getState().cart).toHaveLength(2));
  fireEvent.click(screen.getByText("Remove zero"));
  value = JSON.parse(screen.getByTestId("cart").textContent!);
  expect(value.cart).toHaveLength(1);
  expect(value.total).toBe(41000);
});
