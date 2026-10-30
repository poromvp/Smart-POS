import { ApiResponse, CategoryMenuResponse } from "./types/menu";
import {
  IngredientResponse,
  IngredientCreateRequest,
  IngredientUpdateRequest,
  RecipeResponse,
  ProductRecipeRequest,
  ProductSummaryResponse,
  DeductInventoryRequest,
  DeductInventoryResponse,
} from "./types/inventory";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Lỗi HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.detail || errorJson.message || errorJson.title || errorMsg;
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
  const res = await fetch(`${API_BASE_URL}/products/menu`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<CategoryMenuResponse[]>(res);
}

// ==================== GIAI ĐOẠN 2.1: NGUYÊN LIỆU (INGREDIENT) ====================

export async function fetchIngredients(search?: string): Promise<IngredientResponse[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE_URL}/ingredients${query}`, {
    cache: "no-store",
  });
  return handleResponse<IngredientResponse[]>(res);
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
