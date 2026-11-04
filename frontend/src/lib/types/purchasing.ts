// Định nghĩa DTOs cho Phân hệ Nhà cung cấp & Nhập kho (Phase 3)

export type PurchaseOrderStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface SupplierResponse {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
}

export interface SupplierCreateRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface SupplierUpdateRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface PurchaseOrderItemRequest {
  ingredientId: number;
  quantity: number;
  unitPrice: number;
  expiryDate?: string | null;
}

export interface PurchaseOrderCreateRequest {
  supplierId: number;
  staffId: number;
  orderDate?: string;
  deliveryDate?: string | null;
  note?: string;
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderUpdateRequest {
  supplierId: number;
  orderDate?: string;
  deliveryDate?: string | null;
  note?: string;
  items: PurchaseOrderItemRequest[];
}

export interface PurchaseOrderItemResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  ingredientCode: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expiryDate: string | null;
}

export interface PurchaseOrderResponse {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  staffId: number;
  orderDate: string | null;
  deliveryDate: string | null;
  totalAmount: number;
  status: PurchaseOrderStatus;
  note: string | null;
  createdAt: string;
  items: PurchaseOrderItemResponse[];
}
