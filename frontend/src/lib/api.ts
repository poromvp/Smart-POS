import {
  ApiResponse,
  CategoryMenuResponse,
  CategoryResponse,
  CategoryRequest,
  ProductDetailResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  ModifierGroupResponse,
  ModifierGroupCreateRequest,
  ModifierGroupUpdateRequest,
  ModifierOptionInput,
  ModifierOptionResponse,
} from "./types/menu";
import {
  IngredientResponse,
  IngredientCreateRequest,
  IngredientUpdateRequest,
  RecipeResponse,
  ProductRecipeRequest,
  ProductSummaryResponse,
  DeductInventoryRequest,
  DeductInventoryResponse,
  LowStockAlertResponse,
  InventoryTransactionResponse,
  InventoryAdjustmentRequest,
  InventoryAdjustmentResponse,
} from "./types/inventory";
import {
  SupplierResponse,
  SupplierCreateRequest,
  SupplierUpdateRequest,
  PurchaseOrderResponse,
  PurchaseOrderCreateRequest,
  PurchaseOrderUpdateRequest,
} from "./types/purchasing";
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
  OrderItemResponse,
  OrderResponse,
  CreateOrderRequest,
  CreateOrderItemRequest,
  UpdateOrderStatusRequest,
  UpdatePaymentRequest,
} from "./types/sales";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/catalog";
export const SALES_API_BASE_URL =
  process.env.NEXT_PUBLIC_SALES_API_URL || "/api/sales";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItemRequest {
  itemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  modifierTotal: number;
  toppings: string[];
  sweetness?: string;
  note?: string;
}

export interface CreateOrderRequest {
  tableNumber: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  items: OrderItemRequest[];
}

export interface OrderItemResponse {
  id: number;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifierTotal: number;
  toppings?: string;
  sweetness?: string;
  note?: string;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  tableNumber?: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt: string;
}

export async function createOrder(
  data: CreateOrderRequest
): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<OrderResponse>(res);
}

export async function fetchOrders(): Promise<OrderResponse[]> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders`, {
    cache: "no-store",
  });
  return handleResponse<OrderResponse[]>(res);
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse<OrderResponse>(res);
}

export const SALES_API_BASE_URL =
  process.env.NEXT_PUBLIC_SALES_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}`
    : "http://localhost:8083/api");

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Lỗi HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      if (
        errorJson.errors &&
        typeof errorJson.errors === "object" &&
        Object.keys(errorJson.errors).length > 0
      ) {
        const fieldErrors = Object.entries(errorJson.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join("; ");
        errorMsg =
          fieldErrors ||
          errorJson.detail ||
          errorJson.message ||
          errorJson.title ||
          errorMsg;
      } else {
        errorMsg =
          errorJson.detail ||
          errorJson.message ||
          errorJson.title ||
          errorMsg;
      }
    } catch {
      // Bỏ qua lỗi parse JSON
    }
    throw new Error(errorMsg);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

/**
 * Lấy toàn bộ thực đơn theo danh mục (Menu POS / QR Order)
 */
export async function fetchMenu(): Promise<CategoryMenuResponse[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

  try {
  const res = await fetch(`${API_BASE_URL}/products/menu`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
      signal: controller.signal,
  });
  return handleResponse<CategoryMenuResponse[]>(res);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// ==================== GIAI ĐOẠN 2.1: NGUYÊN LIỆU (INGREDIENT) ====================

export async function fetchIngredients(
  search?: string,
  activeOnly?: boolean
): Promise<IngredientResponse[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (activeOnly !== undefined) params.append("activeOnly", String(activeOnly));
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/ingredients${query}`, {
    cache: "no-store",
  });
  return handleResponse<IngredientResponse[]>(res);
}

export async function toggleIngredientStatus(
  id: number,
  isActive: boolean
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/ingredients/${id}/status?isActive=${isActive}`,
    {
      method: "PATCH",
    }
  );
  return handleResponse<void>(res);
}

export async function createIngredient(
  data: IngredientCreateRequest
): Promise<IngredientResponse> {
  const res = await fetch(`${API_BASE_URL}/ingredients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<IngredientResponse>(res);
}

export async function updateIngredient(
  id: number,
  data: IngredientUpdateRequest
): Promise<IngredientResponse> {
  const res = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<IngredientResponse>(res);
}

export async function deleteIngredient(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

// ==================== GIAI ĐOẠN 2.2: CÔNG THỨC MÓN (RECIPE / BOM) ====================

export async function fetchProducts(): Promise<ProductSummaryResponse[]> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    cache: "no-store",
  });
  return handleResponse<ProductSummaryResponse[]>(res);
}

export async function fetchProductRecipe(productId: number): Promise<RecipeResponse> {
  const res = await fetch(`${API_BASE_URL}/recipes/product/${productId}`, {
    cache: "no-store",
  });
  return handleResponse<RecipeResponse>(res);
}

export async function saveProductRecipe(
  productId: number,
  data: ProductRecipeRequest
): Promise<RecipeResponse> {
  const res = await fetch(`${API_BASE_URL}/recipes/product/${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<RecipeResponse>(res);
}

// ==================== GIAI ĐOẠN 2.3: TRỪ KHO (INVENTORY DEDUCTION) ====================

export async function deductInventory(
  data: DeductInventoryRequest
): Promise<DeductInventoryResponse> {
  const res = await fetch(`${API_BASE_URL}/inventory/deduct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<DeductInventoryResponse>(res);
}

// ==================== QUẢN LÝ THỰC ĐƠN & MÓN ĂN (CATALOG CRUD) ====================

export async function fetchProductDetail(id: number): Promise<ProductDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    cache: "no-store",
  });
  return handleResponse<ProductDetailResponse>(res);
}

export async function createProduct(data: ProductCreateRequest): Promise<ProductDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ProductDetailResponse>(res);
}

export async function updateProduct(
  id: number,
  data: ProductUpdateRequest
): Promise<ProductDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ProductDetailResponse>(res);
}

export async function toggleProductStatus(id: number, isActive: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}/status?isActive=${isActive}`, {
    method: "PATCH",
  });
  return handleResponse<void>(res);
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE_URL}/files/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let errorMsg = `Lỗi tải ảnh (${res.status})`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.detail || errJson.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return json.data.fileUrl;
}

export async function fetchCategories(activeOnly?: boolean): Promise<CategoryResponse[]> {
  const query = activeOnly ? "?activeOnly=true" : "";
  const res = await fetch(`${API_BASE_URL}/categories${query}`, {
    cache: "no-store",
  });
  return handleResponse<CategoryResponse[]>(res);
}

export async function createCategory(data: CategoryRequest): Promise<CategoryResponse> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<CategoryResponse>(res);
}

export async function updateCategory(id: number, data: CategoryRequest): Promise<CategoryResponse> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<CategoryResponse>(res);
}

export async function toggleCategoryStatus(id: number, isActive: boolean): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}/status?isActive=${isActive}`, {
    method: "PATCH",
  });
  return handleResponse<void>(res);
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

export async function fetchModifierGroups(
  activeOnly?: boolean
): Promise<ModifierGroupResponse[]> {
  const query = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : "";
  const res = await fetch(`${API_BASE_URL}/modifier-groups${query}`, {
    cache: "no-store",
  });
  return handleResponse<ModifierGroupResponse[]>(res);
}

export async function toggleModifierGroupStatus(
  id: number,
  isActive: boolean
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/modifier-groups/${id}/status?isActive=${isActive}`,
    {
      method: "PATCH",
    }
  );
  return handleResponse<void>(res);
}

export async function createModifierGroup(
  data: ModifierGroupCreateRequest
): Promise<ModifierGroupResponse> {
  const res = await fetch(`${API_BASE_URL}/modifier-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ModifierGroupResponse>(res);
}

export async function updateModifierGroup(
  id: number,
  data: ModifierGroupUpdateRequest
): Promise<ModifierGroupResponse> {
  const res = await fetch(`${API_BASE_URL}/modifier-groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ModifierGroupResponse>(res);
}

export async function deleteModifierGroup(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/modifier-groups/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

export async function addOptionToGroup(
  groupId: number,
  data: ModifierOptionInput
): Promise<ModifierOptionResponse> {
  const res = await fetch(`${API_BASE_URL}/modifier-groups/${groupId}/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ModifierOptionResponse>(res);
}

export async function deleteOptionFromGroup(
  groupId: number,
  optionId: number
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/modifier-groups/${groupId}/options/${optionId}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse<void>(res);
}

// ==================== GIAI ĐOẠN 3: NHÀ CUNG CẤP & NHẬP KHO (PURCHASING) ====================

export async function fetchSuppliers(
  search?: string,
  activeOnly?: boolean
): Promise<SupplierResponse[]> {
  const params = new URLSearchParams();
  if (search?.trim()) params.append("search", search.trim());
  if (activeOnly) params.append("activeOnly", "true");
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${API_BASE_URL}/suppliers${query}`, {
    cache: "no-store",
  });
  return handleResponse<SupplierResponse[]>(res);
}

export async function fetchSupplierDetail(id: number): Promise<SupplierResponse> {
  const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    cache: "no-store",
  });
  return handleResponse<SupplierResponse>(res);
}

export async function createSupplier(
  data: SupplierCreateRequest
): Promise<SupplierResponse> {
  const res = await fetch(`${API_BASE_URL}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<SupplierResponse>(res);
}

export async function updateSupplier(
  id: number,
  data: SupplierUpdateRequest
): Promise<SupplierResponse> {
  const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<SupplierResponse>(res);
}

export async function toggleSupplierStatus(
  id: number,
  isActive: boolean
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/suppliers/${id}/status?isActive=${isActive}`, {
    method: "PATCH",
  });
  return handleResponse<void>(res);
}

export async function deleteSupplier(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}

export async function fetchPurchaseOrders(params?: {
  status?: string;
  supplierId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<PurchaseOrderResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.supplierId) queryParams.append("supplierId", String(params.supplierId));
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const res = await fetch(`${API_BASE_URL}/purchase-orders${query}`, {
    cache: "no-store",
  });
  return handleResponse<PurchaseOrderResponse[]>(res);
}

export async function fetchPurchaseOrderDetail(id: number): Promise<PurchaseOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
    cache: "no-store",
  });
  return handleResponse<PurchaseOrderResponse>(res);
}

export async function createPurchaseOrder(
  data: PurchaseOrderCreateRequest
): Promise<PurchaseOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PurchaseOrderResponse>(res);
}

export async function updatePurchaseOrder(
  id: number,
  data: PurchaseOrderUpdateRequest
): Promise<PurchaseOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PurchaseOrderResponse>(res);
}

export async function completePurchaseOrder(id: number): Promise<PurchaseOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/complete`, {
    method: "PATCH",
  });
  return handleResponse<PurchaseOrderResponse>(res);
}

export async function cancelPurchaseOrder(id: number): Promise<PurchaseOrderResponse> {
  const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}/cancel`, {
    method: "PATCH",
  });
  return handleResponse<PurchaseOrderResponse>(res);
}

// ==================== GIAI ĐOẠN 4: CẢNH BÁO & SỔ THẺ KHO (AUDIT & ALERTS) ====================

export async function fetchLowStockAlerts(): Promise<LowStockAlertResponse[]> {
  const res = await fetch(`${API_BASE_URL}/inventory/low-stock`, {
    cache: "no-store",
  });
  return handleResponse<LowStockAlertResponse[]>(res);
}

export async function fetchInventoryTransactions(params?: {
  ingredientId?: number;
  type?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<InventoryTransactionResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.ingredientId) queryParams.append("ingredientId", String(params.ingredientId));
  if (params?.type) queryParams.append("type", params.type);
  if (params?.search?.trim()) queryParams.append("search", params.search.trim());
  if (params?.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params?.toDate) queryParams.append("toDate", params.toDate);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const res = await fetch(`${API_BASE_URL}/inventory/transactions${query}`, {
    cache: "no-store",
  });
  return handleResponse<InventoryTransactionResponse[]>(res);
}

export async function adjustInventory(
  data: InventoryAdjustmentRequest
): Promise<InventoryAdjustmentResponse> {
  const res = await fetch(`${API_BASE_URL}/inventory/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<InventoryAdjustmentResponse>(res);
}

// ==================== BÁN HÀNG & ĐƠN HÀNG (SALES SERVICE) ====================

export async function fetchOrders(params?: {
  status?: OrderStatus;
  tableNumber?: string;
}): Promise<OrderResponse[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.tableNumber) queryParams.append("tableNumber", params.tableNumber);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const res = await fetch(`${SALES_API_BASE_URL}/orders${query}`, {
    cache: "no-store",
  });
  return handleResponse<OrderResponse[]>(res);
}

export async function fetchOrderDetail(id: number): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/${id}`, {
    cache: "no-store",
  });
  return handleResponse<OrderResponse>(res);
}

export async function fetchOrderByCode(orderCode: string): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/code/${orderCode}`, {
    cache: "no-store",
  });
  return handleResponse<OrderResponse>(res);
}

export async function createOrder(
  data: CreateOrderRequest
): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<OrderResponse>(res);
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse<OrderResponse>(res);
}

export async function completeOrder(id: number): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/${id}/complete`, {
    method: "POST",
  });
  return handleResponse<OrderResponse>(res);
}

export async function updateOrderPayment(
  id: number,
  data: UpdatePaymentRequest
): Promise<OrderResponse> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/${id}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<OrderResponse>(res);
}

export async function cancelOrder(id: number): Promise<void> {
  const res = await fetch(`${SALES_API_BASE_URL}/orders/${id}`, {
    method: "DELETE",
  });
  return handleResponse<void>(res);
}
