"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import {
  ingredients,
  createIngredient,
  receiveIngredient,
  saveRecipe,
  products,
  type Ingredient,
} from "@/lib/api";
import type { Product } from "@/lib/types";
export default function Ingredients() {
  const { token, role } = useApp();
  const [list, setList] = useState<Ingredient[]>([]),
    [menu, setMenu] = useState<Product[]>([]);
  const [name, setName] = useState(""),
    [unit, setUnit] = useState("g"),
    [selected, setSelected] = useState(""),
    [quantity, setQuantity] = useState(1),
    [reference, setReference] = useState("");
  const [productId, setProductId] = useState(""),
    [recipe, setRecipe] = useState<Record<string, number>>({});
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!token || role !== "ADMIN") return;
    const [stock, catalog] = await Promise.all([
      ingredients(token),
      products(),
    ]);
    setList(stock);
    setMenu(catalog.list);
  }, [token, role]);
  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Không thể tải nguyên liệu"),
    );
  }, [load]);
  const action = async (fn: () => Promise<unknown>, success: string) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
      await load();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  };
  if (role !== "ADMIN") return <p>Bạn cần quyền quản lý.</p>;
  return (
    <div className="wrap sub">
      <h1>Nguyên liệu và định lượng</h1>
      <p>
        Định lượng cho size S. Size M dùng 125%, size L dùng 150%, làm tròn lên
        theo đơn vị g/ml/cái.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div className="columns">
        <section className="summary">
          <h2>Tạo nguyên liệu</h2>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void action(
                () => createIngredient(token!, name, unit),
                "Đã tạo nguyên liệu",
              );
            }}
          >
            <label>
              Tên nguyên liệu
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Đơn vị
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="g">Gram</option>
                <option value="ml">Mililít</option>
                <option value="piece">Cái</option>
              </select>
            </label>
            <button className="btn" disabled={busy}>
              Tạo nguyên liệu
            </button>
          </form>
          <h2>Nhập kho</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action(
                () => receiveIngredient(token!, selected, quantity, reference),
                "Đã ghi phiếu nhập",
              );
            }}
          >
            <label>
              Nguyên liệu
              <select
                required
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Chọn nguyên liệu</option>
                {list.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Số lượng
              <input
                required
                type="number"
                min={1}
                max={100000000}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label>
              Mã phiếu nhập
              <input
                required
                maxLength={200}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <button className="btn" disabled={busy}>
              Nhập kho
            </button>
          </form>
          <p>Gửi lại cùng mã phiếu và số lượng không cộng tồn lần thứ hai.</p>
        </section>
        <section className="summary">
          <h2>Công thức theo món</h2>
          <label>
            Món
            <select
              value={productId}
              onChange={(e) => {
                const id = e.target.value;
                setProductId(id);
                setRecipe(
                  Object.fromEntries(
                    list.flatMap((i) =>
                      i.recipe
                        .filter((r) => r.productId === id)
                        .map((r) => [i.id, r.quantity]),
                    ),
                  ),
                );
              }}
            >
              <option value="">Chọn món</option>
              {menu.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {list.map((i) => (
            <label key={i.id}>
              {i.name} ({i.unit})
              <input
                type="number"
                min={0}
                max={1000000}
                value={recipe[i.id] || 0}
                onChange={(e) =>
                  setRecipe({ ...recipe, [i.id]: Number(e.target.value) })
                }
              />
            </label>
          ))}
          <button
            className="btn"
            disabled={busy || !productId}
            onClick={() =>
              void action(
                () =>
                  saveRecipe(
                    token!,
                    productId,
                    Object.entries(recipe)
                      .filter(([, q]) => q > 0)
                      .map(([ingredientId, q]) => ({
                        ingredientId,
                        quantity: q,
                      })),
                  ),
                "Đã lưu công thức",
              )
            }
          >
            Lưu công thức
          </button>
        </section>
      </div>
      <h2>Tồn nguyên liệu</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Nguyên liệu</th>
              <th>Tồn</th>
              <th>Biến động gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>
                  {i.stock} {i.unit}
                </td>
                <td>
                  {i.movements.slice(0, 3).map((m) => (
                    <p key={m.id}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity} · {m.reason} ·{" "}
                      {new Date(m.createdAt).toLocaleString("vi-VN")}
                    </p>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && (
        <p>Chưa có nguyên liệu. Tạo nguyên liệu và nhập kho để bắt đầu.</p>
      )}
    </div>
  );
}
