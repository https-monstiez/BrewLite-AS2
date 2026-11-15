export type Size = "S" | "M" | "L";
export type Method = "LOYALTY_POINTS" | "BANK_TRANSFER";

export type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  category?: string;
  stock: number;
};

export type Item = {
  key: string;
  productId: string;
  name: string;
  image?: string;
  size: Size;
  toppings: string[];
  sugar?: string;
  ice?: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  status: string;
  total?: number;
  createdAt?: string;
  items?: OrderItem[];
  payments?: Payment[];
};

export type OrderItem = {
  id: string;
  qty: number;
  size: Size;
  toppings: string[];
  sugar?: string;
  ice?: string;
  unitPrice: number;
  lineTotal: number;
  product: {
    name: string;
  };
};

export type Payment = {
  id: string;
  amount: number;
  method: Method;
  status: string;
  createdAt: string;
};
