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
}

export interface IngredientCreateRequest {
  name: string;
  code?: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
}

export interface IngredientUpdateRequest {
  name: string;
  code?: string;
  unit: string;
  minThreshold?: number;
  costPerUnit?: number;
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
