export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface ProductVariantResponse {
  id: number;
  sizeName: string;
  priceAdjustment: number;
  finalPrice: number;
  sku?: string;
}

export interface ModifierOptionResponse {
  id: number;
  name: string;
  price: number;
}

export interface ModifierGroupResponse {
  id: number;
  name: string;
  isMultiple: boolean;
  isRequired: boolean;
  options: ModifierOptionResponse[];
}

export interface ProductDetailResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  code?: string;
  basePrice: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  variants: ProductVariantResponse[];
  modifierGroups: ModifierGroupResponse[];
}

export interface CategoryMenuResponse {
  categoryId: number;
  categoryName: string;
  displayOrder: number;
  products: ProductDetailResponse[];
}

export interface CategoryResponse {
  id: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryRequest {
  name: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ProductVariantRequest {
  id?: number;
  sizeName: string;
  priceAdjustment: number;
  sku?: string;
}

export interface ProductCreateRequest {
  categoryId: number;
  name: string;
  code?: string;
  basePrice: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  variants?: ProductVariantRequest[];
  modifierGroupIds?: number[];
}

export interface ProductUpdateRequest {
  categoryId: number;
  name: string;
  code?: string;
  basePrice: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  variants?: ProductVariantRequest[];
  modifierGroupIds?: number[];
}

export interface ModifierOptionInput {
  name: string;
  price: number;
}

export interface ModifierGroupCreateRequest {
  name: string;
  isMultiple: boolean;
  isRequired: boolean;
  options?: ModifierOptionInput[];
}
