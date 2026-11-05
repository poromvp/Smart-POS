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
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpdatePaymentRequest {
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

