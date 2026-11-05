export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "DINE_IN" | "TAKE_AWAY" | "DELIVERY";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export type PaymentMethod = "CASH" | "VIETQR" | "CREDIT_CARD";

export interface OrderItemResponse {
  id: number;
  productId: number;
  variantId?: number | null;
  modifierOptionIds?: number[];
  itemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifierTotal: number;
  toppings?: string | null;
  sweetness?: string | null;
  note?: string | null;
  subTotal: number;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  tableNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  promotionId?: number | null;
  promotionCode?: string | null;
  promotionName?: string | null;
  subtotal?: number;
  discountAmount?: number;
  pointsDiscountAmount?: number;
  totalAmount: number;
  note?: string | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemRequest {
  productId: number;
  variantId?: number;
  modifierOptionIds?: number[];
  itemId?: string;
  name: string;
  quantity: number;
  basePrice: number;
  modifierTotal?: number;
  toppings?: string[];
  sweetness?: string;
  note?: string;
}

export interface CreateOrderRequest {
  tableNumber?: string;
  orderType?: OrderType;
  note?: string;
  customerId?: number;
  customerPhone?: string;
  promotionCode?: string;
  pointsToRedeem?: number;
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdatePaymentRequest {
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

// ==================== KHÁCH HÀNG & TÍCH ĐIỂM (LOYALTY) ====================

export interface CustomerResponse {
  id: number;
  phone: string;
  fullName?: string | null;
  currentPoints: number;
  totalSpent: number;
  createdAt: string;
}

export interface CustomerCreateRequest {
  phone: string;
  fullName?: string;
}

export interface PointTransactionResponse {
  id: number;
  customerId: number;
  orderId?: number | null;
  orderCode?: string | null;
  pointsChange: number;
  type: string; // 'EARN' | 'REDEEM'
  createdAt: string;
}

// ==================== KHUYẾN MÃI (PROMOTIONS) ====================

export interface PromotionResponse {
  id: number;
  code: string;
  name: string;
  discountPercent: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
}

export interface PromotionCreateRequest {
  code: string;
  name: string;
  discountPercent: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface ApplyPromotionRequest {
  code: string;
  subtotal: number;
}

export interface ApplyPromotionResponse {
  valid: boolean;
  code?: string;
  name?: string;
  discountPercent?: number;
  discountAmount?: number;
  finalSubtotal?: number;
  message: string;
}
