import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOrderItemSubtotal,
  calculateOrderSubtotal,
  calculateVoucherDiscount,
  calculatePointsDiscount,
  calculateFinalTotal,
} from "../src/lib/utils/priceCalculation.ts";

test("calculateOrderItemSubtotal calculates item price with modifiers and quantity", () => {
  // Món 45k + Topping 20k, số lượng 2 phần = (45k + 20k) * 2 = 130k
  const subtotal = calculateOrderItemSubtotal(45_000, 20_000, 2);
  assert.equal(subtotal, 130_000);
});

test("calculateOrderSubtotal sums multiple items correctly", () => {
  const items = [
    { basePrice: 45_000, modifierTotal: 10_000, quantity: 2 }, // 110k
    { basePrice: 35_000, modifierTotal: 0, quantity: 1 },      // 35k
  ];
  const total = calculateOrderSubtotal(items);
  assert.equal(total, 145_000);
});

test("calculateVoucherDiscount calculates percentage discount with max cap", () => {
  // Đơn 200k, voucher 10% tối đa 30k -> giảm 20k
  const discount1 = calculateVoucherDiscount(200_000, 10, 30_000);
  assert.equal(discount1, 20_000);

  // Đơn 500k, voucher 10% tối đa 30k -> giảm trần 30k (thay vì 50k)
  const discount2 = calculateVoucherDiscount(500_000, 10, 30_000);
  assert.equal(discount2, 30_000);
});

test("calculatePointsDiscount redeems points safely within balance and order limit", () => {
  // Đơn còn lại 150k, yêu cầu 5 điểm, khách có 10 điểm -> dùng 5 điểm, giảm 5.000đ
  const res1 = calculatePointsDiscount(150_000, 5, 10);
  assert.equal(res1.pointsRedeemed, 5);
  assert.equal(res1.discountAmount, 5_000);

  // Đơn còn lại 4.000đ, khách có 10 điểm, đòi dùng 8 điểm -> chỉ được dùng tối đa 4 điểm (4.000đ)
  const res2 = calculatePointsDiscount(4_000, 8, 10);
  assert.equal(res2.pointsRedeemed, 4);
  assert.equal(res2.discountAmount, 4_000);
});

test("calculateFinalTotal calculates final amount with voucher and points", () => {
  // Subtotal 150k, Voucher 15k, Dùng 5 điểm (5k) -> 130k
  const total = calculateFinalTotal(150_000, 15_000, 5_000);
  assert.equal(total, 130_000);
});

test("calculateFinalTotal clamps to zero when discount exceeds subtotal", () => {
  // Subtotal 50k, Giảm giá 60k -> 0đ (không âm tiền)
  const total = calculateFinalTotal(50_000, 60_000, 0);
  assert.equal(total, 0);
});
