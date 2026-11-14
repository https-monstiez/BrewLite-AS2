
import type { Product, Order, Method } from "@/lib/types";

const base = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

async function req<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  let r: Response;

  try {
    r = await fetch(base + path, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw Error(
      "Không kết nối được backend. Kiểm tra backend và NEXT_PUBLIC_API_URL.",
    );
  }

  const raw = await r.text();
  let d: any;

  try {
    d = raw ? JSON.parse(raw) : {};
  } catch {
    d = { message: raw };
  }

  if (!r.ok) {
    const message = Array.isArray(d.message)
      ? d.message[0]
      : typeof d.message === "string"
        ? d.message
        : "";

    if (r.status === 401) {
      throw Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    if (r.status === 409) {
      throw Error(
        message || "Yêu cầu bị xung đột. Vui lòng tải lại dữ liệu.",
      );
    }

    if (r.status === 400) {
      throw Error(
        message || "Thông tin nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
      );
    }

    if (r.status === 503) throw Error(message || "Phương thức này hiện chưa sẵn sàng.");

    if (r.status >= 500) {
      throw Error("Máy chủ đang gặp sự cố. Vui lòng thử lại sau.");
    }

    throw Error(
      message || "Không thể thực hiện yêu cầu. Vui lòng thử lại.",
    );
  }

  return d as T;
}

const arr = <T,>(x: any): T[] =>
  Array.isArray(x)
    ? x
    : Array.isArray(x?.data)
      ? x.data
      : Array.isArray(x?.items)
        ? x.items
        : [];

export async function products() {
  const p = arr<any>(await req("/products"));

  return {
    list: p.map((x: any, i: number) => ({
      id: String(x.id ?? i + 1),
      name: String(x.name ?? x.title ?? "Sản phẩm"),
      price: Number(x.price ?? 0),
      stock: Number(x.stock ?? 0),
      image:
        x.image ??
        x.imageUrl ??
        ({
          Americano:
            "https://images.openai.com/static-rsc-4/Ri2HMExjAhuwRO-Gawi6oYhicFfQQIaFpi9a1sFBhR1pd_vLI1m5Uu2APTFQO30sPBZtGWxbvTia1C-yTdfs83RJdNqyZD_nt_qLEHTRAEMuKvMq-yastNvaK-pqzSsLzLSzcMJ91_Xw1_Je8NkX7mXe6lMoPpwWf73deLQgpwN-tLtKSXxwWGmYna_F4_pD?purpose=fullsize",

          "Bạc xỉu":
            "https://chaosuonbebu.com/cdn/shop/files/cafe-sua-tuoi-bac-siu_2.jpg?v=1738581102",

          "Cà phê sữa đá":
            "https://www.coffeebrewhub.com/uploads/images/engine_images/master-authentic-vietnamese-iced-coffee-ca-phe-sua-da-at-hom-2026-04-11.webp",

          "Matcha latte":
            "https://images.openai.com/static-rsc-4/2GMalk9B0h3H8-L0EKjsy2P2D6u6jER9f8vcIHS9HsFkDPzvr23QDryQEPba0yaiHcc0XHnj8m5x2fiyJfveBDwnjPttEj57b6EBy5xePKX3oT3_okQGsGmVGjXO31lZ5hzhvmOIG9OfDOIOKYo4tdlkGx7Dg0OkwXpy9686CaC_Go20bIjuEnIDWT6OetIx?purpose=fullsize",

          "Trà đào cam sả":
            "https://images.openai.com/static-rsc-4/byUp2mcw_xQHltNxqPxWdgZTyYuqacZvnua0uqMm6GfcwiWA51bTlwElVOfUO5nGR98W5IUgNJp_wJ-klkExtM_YhyOzQYFUDBkY6QbkqiaQvuSt_obxO849P2TPJ6BtMVysbpgUuirOJJz7ygeZHWVYExBQ5ig8NzIG1RaIhWSYyWqZwWtqpvu63cAmmmTA?purpose=fullsize",
        } as Record<string, string>)[
          String(x.name ?? x.title ?? "")
        ] ??
        undefined,
      description: x.description ?? "",
      category: x.category ?? "Đồ uống",
    })) as Product[],
    demo: false,
    error: "",
  };
}

export type ManagedProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
};

export type ProductInput = {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number;
};

export type ProductUpdateInput = Partial<ProductInput> & {
  isActive?: boolean;
};

export async function adminProducts(token: string) {
  const result = await req<{ items: ManagedProduct[] }>(
    "/products/management",
    {},
    token,
  );

  return result.items;
}

export async function createProduct(token: string, data: ProductInput) {
  return req<ManagedProduct>(
    "/products",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateProduct(
  token: string,
  id: string,
  data: ProductUpdateInput,
) {
  return req<ManagedProduct>(
    `/products/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function deleteProduct(token: string, id: string) {
  return req<ManagedProduct>(
    `/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export const login = (email: string, password: string) =>
  req<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (
  name: string,
  email: string,
  password: string,
) =>
  req<any>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const validatePromotion = (
  items: unknown[],
  promotionCode: string,
  token: string,
) =>
  req<any>(
    "/orders/validate-promotion",
    {
      method: "POST",
      body: JSON.stringify({
        items,
        promotionCode: promotionCode.trim().toUpperCase(),
      }),
    },
    token,
  );

export const order = (
  items: unknown[],
  token: string,
  promotionCode?: string,
  idempotencyKey: string = crypto.randomUUID(),
) =>
  req<any>(
    "/orders",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        items,
        ...(promotionCode?.trim()
          ? { promotionCode: promotionCode.trim().toUpperCase() }
          : {}),
      }),
    },
    token,
  );

export const pay = (
  orderId: string,
  method: Method,
  token: string,
  key = crypto.randomUUID(),
) =>
  req<any>(
    "/payments",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": key,
      },
      body: JSON.stringify({ orderId, method }),
    },
    token,
  );

export async function history(token: string) {
  return arr<Order>(await req("/orders/me", {}, token));
}

export type AdminSummary = {
  customers: number;
  staff: number | null;
  orders: number;
  pendingOrders: number;
  activityLogs: number;
};

export type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  actorRole: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
};

export async function adminSummary(token: string) {
  return req<AdminSummary>("/admin/summary", {}, token);
}

export async function adminActivityLogs(
  token: string,
  page = 1,
  limit = 30,
) {
  return req<{
    items: ActivityLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    `/admin/activity-logs?page=${page}&limit=${limit}`,
    {},
    token,
  );
}

export async function adminUsers(
  token: string,
  page = 1,
  limit = 30,
  q = "",
) {
  return req<{
    items: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    `/admin/users?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`,
    {},
    token,
  );
}

export async function updateUserRole(
  token: string,
  userId: string,
  role: AdminUser["role"],
) {
  return req<AdminUser>(
    `/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
    token,
  );
}

export type ManagedOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;

  cancellationRequestStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  cancellationReason?: string | null;
  cancellationRequestedAt?: string | null;
  cancellationReviewedAt?: string | null;

  user: {
    id: string;
    name: string | null;
    email: string;
  };

  items: {
    id: string;
    qty: number;
    size: string;
    toppings: string[];
    sugar: string;
    ice: string;
    lineTotal: number;
    product: {
      name: string;
    };
  }[];

  payments: {
    id: string;
    amount: number;
    method: string;
    status: string;
  }[];
};

export async function adminOrders(token: string) {
  return req<ManagedOrder[]>("/orders/management", {}, token);
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: string,
) {
  return req<ManagedOrder>(
    `/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    token,
  );
}

export async function staffCancelOrder(
  token: string,
  orderId: string,
) {
  return req<ManagedOrder>(
    `/orders/${encodeURIComponent(orderId)}/staff-cancel`,
    {
      method: "POST",
    },
    token,
  );
}

export async function confirmPayment(
  token: string,
  orderId: string,
) {
  return req<any>(
    `/payments/${encodeURIComponent(orderId)}/confirm`,
    {
      method: "POST",
    },
    token,
  );
}


export async function cancelOrder(
  token: string,
  orderId: string,
  reason: string,
) {
  return req<any>(
    `/orders/${encodeURIComponent(orderId)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    token,
  );
}


export async function requestOrderCancellation(
  token: string,
  orderId: string,
  reason: string,
) {
  return req<any>(
    `/orders/${encodeURIComponent(orderId)}/cancellation-request`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    token,
  );
}

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  loyaltyPoints: number;
  createdAt: string;
};

export const getMyProfile = (token: string) =>
  req<UserProfile>("/auth/me", {}, token);

export const updateMyProfile = (
  token: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
  },
) =>
  req<UserProfile>(
    "/auth/me",
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token,
  );

export async function reviewOrderCancellation(
  token: string,
  orderId: string,
  approved: boolean,
) {
  return req<any>(
    `/orders/${encodeURIComponent(orderId)}/cancellation-request`,
    {
      method: "PATCH",
      body: JSON.stringify({ approved }),
    },
    token,
  );
}

export type CreatePromotionInput = {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startAt: string;
  endAt: string;
  usageLimit?: number;
};

export async function createAdminPromotion(
  token: string,
  data: CreatePromotionInput,
) {
  return req<any>(
    "/admin/promotions",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}
export const quote = (items: unknown[], token: string, promotionCode?: string) => req<{ subtotal: number; discountAmount: number; total: number }>("/orders/quote", { method: "POST", body: JSON.stringify({ items, ...(promotionCode ? { promotionCode } : {}) }) }, token);
export const simulatePayment = (id: string, token: string, outcome: "success" | "failure") => req<{ status: string }>(`/payments/${encodeURIComponent(id)}/simulate`, { method: "POST", body: JSON.stringify({ outcome }) }, token);
export const getOrder = (id: string, token: string) => req<Order>(`/orders/${encodeURIComponent(id)}`, {}, token);
export const paymentReturn = (query: string) => req<{ RspCode: string; orderId?: string }>(`/payments/vnpay/return?${query}`);

export type Ingredient = { id: string; name: string; unit: string; stock: number; recipe: {productId: string; quantity: number; product: {id: string; name: string}}[]; movements: {id: string; quantity: number; reason: string; createdAt: string}[] };
export const ingredients = (token: string) => req<Ingredient[]>("/inventory",{},token);
export const createIngredient = (token: string, name: string, unit: string) => req<Ingredient>("/inventory",{method:"POST",body:JSON.stringify({name,unit})},token);
export const receiveIngredient = (token: string,id: string,quantity: number,reference: string) => req<Ingredient>(`/inventory/${encodeURIComponent(id)}/receive`,{method:"POST",body:JSON.stringify({quantity,reference})},token);
export const saveRecipe = (token: string,productId: string,items: {ingredientId:string;quantity:number}[]) => req(`/inventory/recipes/${encodeURIComponent(productId)}`,{method:"PUT",body:JSON.stringify({items})},token);

export async function getProduct(id: string): Promise<Product> {
 const x=await req<ManagedProduct>(`/products/${encodeURIComponent(id)}`);
 return {id:x.id,name:x.name,price:x.price,stock:x.stock,image:x.imageUrl||undefined,description:x.description||'',category:'Đồ uống'};
}

export type BankInstructions = { bankBin:string; bankName:string; accountNumber:string; accountName:string; orderId:string; paymentId:string; amount:number; transferContent:string; qrImageUrl:string; confirmation:'STAFF_RECONCILIATION' };
export const paymentMethods = (token:string) => req<{available:Method[]}>("/payments/methods",{},token);
export const bankInstructions = (token:string,orderId:string) => req<BankInstructions>(`/payments/bank-transfer/${encodeURIComponent(orderId)}`,{},token);
