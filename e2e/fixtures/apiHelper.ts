import type { APIRequestContext } from "@playwright/test";
import { GATEWAY_URL } from "./constants";

export interface LoginTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface OrderItemDto {
  id: number;
  productId: number;
  variantId?: number | null;
  modifierOptionIds?: number[];
  name: string;
  quantity: number;
  unitPrice: number;
  modifierTotal: number;
  subTotal: number;
  kdsStatus: "PENDING" | "COOKING" | "READY" | "SERVED";
}

export interface OrderDto {
  id: number;
  orderCode: string;
  tableNumber?: string | null;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  customerId?: number | null;
  customerPhone?: string | null;
  promotionCode?: string | null;
  subtotal: number;
  discountAmount: number;
  pointsDiscountAmount: number;
  totalAmount: number;
  version?: number;
  items: OrderItemDto[];
}

export interface IngredientDto {
  id: number;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
  isActive: boolean;
}

export interface InventoryTransactionDto {
  id: number;
  ingredientId: number;
  ingredientName: string;
  ingredientCode: string;
  unit: string;
  quantity: number;
  transactionType: "IMPORT" | "SALE_DEDUCT" | "AUDIT_ADJUST" | "SPOILAGE";
  orderCode?: string | null;
}

export interface CustomerDto {
  id: number;
  phone: string;
  fullName?: string | null;
  currentPoints: number;
  totalSpent: number;
}

export interface PointTransactionDto {
  id: number;
  orderId?: number | null;
  orderCode?: string | null;
  pointsChange: number;
  type: "EARN" | "REDEEM" | string;
}

export interface RecipeResponseDto {
  productId: number;
  productName: string;
  baseItems: { ingredientId: number; ingredientCode?: string; ingredientName: string; quantityNeeded: number }[];
  variants: {
    variantId: number;
    sizeName: string;
    items: { ingredientId: number; ingredientCode?: string; ingredientName: string; quantityNeeded: number }[];
  }[];
  modifierOptions: {
    modifierOptionId: number;
    optionName: string;
    items: { ingredientId: number; ingredientCode?: string; ingredientName: string; quantityNeeded: number }[];
  }[];
}

export async function loginViaGateway(
  request: APIRequestContext,
  username: string,
  password: string
): Promise<string> {
  const res = await request.post(`${GATEWAY_URL}/api/auth/login`, {
    data: { username, password },
  });
  if (!res.ok()) {
    throw new Error(`Login via Gateway failed for ${username}: ${res.status()} ${await res.text()}`);
  }
  const json = (await res.json()) as LoginTokenResponse;
  return json.accessToken;
}

export async function getJsonEnvelope<T>(
  request: APIRequestContext,
  path: string,
  token?: string
): Promise<T> {
  const res = await request.get(`${GATEWAY_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok()) {
    throw new Error(`GET ${path} failed: ${res.status()} ${await res.text()}`);
  }
  const env = (await res.json()) as ApiEnvelope<T>;
  return env.data;
}

export async function postJsonEnvelope<T>(
  request: APIRequestContext,
  path: string,
  data: unknown,
  token?: string
): Promise<T> {
  const res = await request.post(`${GATEWAY_URL}${path}`, {
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok()) {
    throw new Error(`POST ${path} failed: ${res.status()} ${await res.text()}`);
  }
  const env = (await res.json()) as ApiEnvelope<T>;
  return env.data;
}

export async function fetchOrdersViaApi(
  request: APIRequestContext,
  token: string,
  query = ""
): Promise<OrderDto[]> {
  return getJsonEnvelope<OrderDto[]>(request, `/api/sales/orders${query}`, token);
}

export async function fetchOrderByCodeViaApi(
  request: APIRequestContext,
  token: string,
  orderCode: string
): Promise<OrderDto> {
  return getJsonEnvelope<OrderDto>(request, `/api/sales/orders/code/${encodeURIComponent(orderCode)}`, token);
}

export async function fetchIngredientsViaApi(
  request: APIRequestContext,
  token: string
): Promise<IngredientDto[]> {
  return getJsonEnvelope<IngredientDto[]>(request, "/api/catalog/ingredients", token);
}

export async function fetchInventoryTransactionsViaApi(
  request: APIRequestContext,
  token: string,
  params: { type?: string; search?: string } = {}
): Promise<InventoryTransactionDto[]> {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.search) qs.set("search", params.search);
  const q = qs.toString() ? `?${qs.toString()}` : "";
  return getJsonEnvelope<InventoryTransactionDto[]>(
    request,
    `/api/catalog/inventory/transactions${q}`,
    token
  );
}

export async function fetchProductRecipeViaApi(
  request: APIRequestContext,
  token: string,
  productId: number
): Promise<RecipeResponseDto> {
  return getJsonEnvelope<RecipeResponseDto>(
    request,
    `/api/catalog/recipes/product/${productId}`,
    token
  );
}

export async function fetchCustomerByPhoneViaApi(
  request: APIRequestContext,
  token: string,
  phone: string
): Promise<CustomerDto> {
  return getJsonEnvelope<CustomerDto>(
    request,
    `/api/sales/customers/search?phone=${encodeURIComponent(phone)}`,
    token
  );
}

export async function fetchCustomerTransactionsViaApi(
  request: APIRequestContext,
  token: string,
  customerId: number
): Promise<PointTransactionDto[]> {
  return getJsonEnvelope<PointTransactionDto[]>(
    request,
    `/api/sales/customers/${customerId}/transactions`,
    token
  );
}
