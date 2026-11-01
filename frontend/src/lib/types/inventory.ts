// Định nghĩa DTOs cho Phân hệ Kho & Định lượng (BOM)

export interface IngredientResponse {
  id: number;
  name: string;
  code: string | null;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
  lowStock: boolean;
  isActive: boolean;
}

export interface IngredientCreateRequest {
  name: string;
  code?: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
  isActive?: boolean;
}

export interface IngredientUpdateRequest {
  name: string;
  code?: string;
  unit: string;
  minThreshold?: number;
  costPerUnit?: number;
  isActive?: boolean;
}

export interface RecipeItemResponse {
  ingredientId: number;
  ingredientName: string;
  ingredientCode: string | null;
  unit: string;
  quantityNeeded: number;
}

export interface VariantRecipe {
  variantId: number;
  sizeName: string;
  items: RecipeItemResponse[];
}

export interface ModifierOptionRecipe {
  modifierOptionId: number;
  optionName: string;
  groupId: number;
  groupName: string;
  items: RecipeItemResponse[];
}

export interface RecipeResponse {
  productId: number;
  productName: string;
  baseItems: RecipeItemResponse[];
  variants: VariantRecipe[];
  modifierOptions: ModifierOptionRecipe[];
}

export interface RecipeItemRequest {
  ingredientId: number;
  quantityNeeded: number;
}

export interface ProductRecipeRequest {
  variantId?: number | null;
  modifierOptionId?: number | null;
  items: RecipeItemRequest[];
}

// DTOs cho Mô phỏng & Thực hiện Trừ kho tự động
export interface DeductItemRequest {
  productId: number;
  variantId?: number | null;
  modifierOptionIds: number[];
  quantity: number;
}

export interface DeductInventoryRequest {
  orderCode: string;
  items: DeductItemRequest[];
}

export interface IngredientDeduction {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantityDeducted: number;
  stockBefore: number;
  stockAfter: number;
}

export interface DeductInventoryResponse {
  orderCode: string;
  deductions: IngredientDeduction[];
}

export interface ProductSummaryResponse {
  id: number;
  name: string;
  code: string | null;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  variantCount: number;
}

// ==================== GIAI ĐOẠN 4: CẢNH BÁO & THẺ KHO (AUDIT & ALERTS) ====================

export type InventoryTransactionType =
  | "IMPORT"
  | "SALE_DEDUCT"
  | "AUDIT_ADJUST"
  | "SPOILAGE";

export interface LowStockAlertResponse {
  ingredientId: number;
  ingredientName: string;
  ingredientCode: string | null;
  unit: string;
  currentStock: number;
  minThreshold: number;
  deficit: number;
  stockPercentage: number;
  costPerUnit: number;
  estimatedReorderCost: number;
  suggestedReorderQuantity: number;
}

export interface InventoryTransactionResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  ingredientCode: string | null;
  unit: string;
  quantity: number;
  transactionType: InventoryTransactionType;
  orderCode: string | null;
  orderItemId: number | null;
  purchaseOrderItemId: number | null;
  createdAt: string;
}

export interface InventoryAdjustmentRequest {
  ingredientId: number;
  type: "AUDIT_ADJUST" | "SPOILAGE";
  actualStock?: number;
  quantity?: number;
  reason?: string;
}

export interface InventoryAdjustmentResponse {
  transactionId: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  stockBefore: number;
  stockAfter: number;
  diffQuantity: number;
  type: "AUDIT_ADJUST" | "SPOILAGE";
  reason: string;
  createdAt: string;
}
