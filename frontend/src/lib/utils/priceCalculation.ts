export interface PriceCalculationItem {
  basePrice: number;
  modifierTotal?: number;
  quantity: number;
}

/**
 * Tính tổng tiền cho 1 món ăn kèm tùy chọn/topping và số lượng
 */
export function calculateOrderItemSubtotal(
  basePrice: number,
  modifierTotal: number = 0,
  quantity: number = 1
): number {
  const safeBase = Math.max(0, basePrice);
  const safeModifier = Math.max(0, modifierTotal);
  const safeQty = Math.max(0, quantity);
  return (safeBase + safeModifier) * safeQty;
}

/**
 * Tính tổng giá trị tạm tính (Subtotal) của toàn bộ danh sách món trong đơn
 */
export function calculateOrderSubtotal(items: PriceCalculationItem[]): number {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    return sum + calculateOrderItemSubtotal(item.basePrice, item.modifierTotal, item.quantity);
  }, 0);
}

/**
 * Tính số tiền giảm giá từ Voucher (áp dụng trần tối đa nếu có)
 */
export function calculateVoucherDiscount(
  subtotal: number,
  discountPercent: number,
  maxDiscountAmount?: number | null
): number {
  if (subtotal <= 0 || discountPercent <= 0) return 0;

  const rawDiscount = Math.round((subtotal * discountPercent) / 100);
  if (maxDiscountAmount != null && maxDiscountAmount > 0) {
    return Math.min(rawDiscount, maxDiscountAmount);
  }
  return rawDiscount;
}

/**
 * Tính số điểm tích lũy có thể quy đổi và số tiền giảm tương ứng (1 điểm = 1.000đ)
 */
export function calculatePointsDiscount(
  remainingAmount: number,
  requestedPoints: number,
  customerPoints: number
): { pointsRedeemed: number; discountAmount: number } {
  if (remainingAmount <= 0 || requestedPoints <= 0 || customerPoints <= 0) {
    return { pointsRedeemed: 0, discountAmount: 0 };
  }

  const maxPointsAllowedByAmount = Math.floor(remainingAmount / 1000);
  const actualPointsToUse = Math.min(
    requestedPoints,
    customerPoints,
    maxPointsAllowedByAmount
  );

  return {
    pointsRedeemed: actualPointsToUse,
    discountAmount: actualPointsToUse * 1000,
  };
}

/**
 * Tính tổng thanh toán thực tế cuối cùng (đảm bảo không âm)
 */
export function calculateFinalTotal(
  subtotal: number,
  voucherDiscount: number = 0,
  pointsDiscount: number = 0
): number {
  const safeSubtotal = Math.max(0, subtotal);
  const safeVoucher = Math.max(0, voucherDiscount);
  const safePoints = Math.max(0, pointsDiscount);

  const total = safeSubtotal - safeVoucher - safePoints;
  return Math.max(0, total);
}
