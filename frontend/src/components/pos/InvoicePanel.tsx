"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Tag,
  Sparkles,
  User,
  UserPlus,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import type { RestaurantTable } from "./TableMap";
import type { ProductDetailResponse } from "@/lib/types/menu";
import type { CustomerResponse, ApplyPromotionResponse } from "@/lib/types/sales";
import { searchCustomerByPhone, createCustomer, applyPromotion } from "@/lib/api";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  rawProduct?: ProductDetailResponse;
  spicyLevels?: string[];
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  sizeName?: string;
  toppings?: string[];
  note?: string;
  spicyLevel?: string;
  sweetness?: string;
}

export interface InvoicePanelProps {
  table: RestaurantTable | null;
  orderItems: OrderItem[];
  menuItems: MenuItem[];
  onAddItem: (menuItem: MenuItem, spicyLevel?: string) => void;
  onSelectItem?: (menuItem: MenuItem) => void;
  onChangeQuantity: (orderItemId: string, quantity: number) => void;
  onPayment: (paymentData: {
    customer?: CustomerResponse | null;
    promotion?: ApplyPromotionResponse | null;
    pointsToRedeem: number;
    subtotal: number;
    discountAmount: number;
    pointsDiscountAmount: number;
    finalTotal: number;
  }) => void;
  onCancelOrder?: () => void;
}

export const formatCurrency = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

export default function InvoicePanel({
  table,
  orderItems,
  menuItems,
  onAddItem,
  onSelectItem,
  onChangeQuantity,
  onPayment,
  onCancelOrder,
}: InvoicePanelProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Khách hàng & Loyalty
  const [phoneInput, setPhoneInput] = useState("");
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [customerSearchMsg, setCustomerSearchMsg] = useState<string | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showRegisterCustomer, setShowRegisterCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Khuyến mãi / Voucher
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoResponse, setPromoResponse] = useState<ApplyPromotionResponse | null>(null);
  const [promoMsg, setPromoMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // Tính số tiền giảm giá Voucher
  const voucherDiscount = promoResponse?.valid && promoResponse.discountAmount
    ? promoResponse.discountAmount
    : 0;

  // Tính số tiền giảm giá Điểm (1 điểm = 1.000 VNĐ)
  const remainingBeforePoints = Math.max(0, subtotal - voucherDiscount);
  const maxPointsAllowed = Math.min(
    customer?.currentPoints || 0,
    Math.floor(remainingBeforePoints / 1000)
  );

  const activePointsToRedeem = usePoints ? Math.min(pointsToRedeem, maxPointsAllowed) : 0;
  const pointsDiscount = activePointsToRedeem * 1000;

  // Tổng thanh toán thực tế
  const finalTotal = Math.max(0, subtotal - voucherDiscount - pointsDiscount);

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .toLowerCase();

  const filteredMenu = menuItems.filter((item) =>
    normalize(item.name).includes(normalize(query.trim()))
  );

  // Xử lý tìm khách hàng
  const handleSearchCustomer = async () => {
    if (!phoneInput.trim()) return;
    setIsSearchingCustomer(true);
    setCustomerSearchMsg(null);
    try {
      const res = await searchCustomerByPhone(phoneInput.trim());
      setCustomer(res);
      setUsePoints(false);
      setPointsToRedeem(res.currentPoints || 0);
      setShowRegisterCustomer(false);
    } catch {
      setCustomer(null);
      setCustomerSearchMsg("Chưa có thông tin khách hàng với SĐT này");
      setShowRegisterCustomer(true);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Đăng ký nhanh khách hàng
  const handleRegisterCustomer = async () => {
    if (!phoneInput.trim()) return;
    setIsRegisteringCustomer(true);
    try {
      const res = await createCustomer({
        phone: phoneInput.trim(),
        fullName: newCustomerName.trim() || undefined,
      });
      setCustomer(res);
      setShowRegisterCustomer(false);
      setCustomerSearchMsg("Đăng ký thành công!");
      setUsePoints(false);
      setPointsToRedeem(0);
    } catch (err: unknown) {
      setCustomerSearchMsg(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setIsRegisteringCustomer(false);
    }
  };

  // Xử lý áp dụng Voucher
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || subtotal <= 0) return;
    setIsApplyingPromo(true);
    setPromoMsg(null);
    try {
      const res = await applyPromotion({
        code: promoCodeInput.trim(),
        subtotal,
      });
      if (res.valid) {
        setPromoResponse(res);
        setPromoMsg({ text: res.message || "Áp dụng voucher thành công!", error: false });
      } else {
        setPromoResponse(null);
        setPromoMsg({ text: res.message || "Mã không hợp lệ", error: true });
      }
    } catch (err: unknown) {
      setPromoResponse(null);
      setPromoMsg({ text: err instanceof Error ? err.message : "Lỗi áp dụng voucher", error: true });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoResponse(null);
    setPromoMsg(null);
    setPromoCodeInput("");
  };

  const handleClearCustomer = () => {
    setCustomer(null);
    setPhoneInput("");
    setCustomerSearchMsg(null);
    setUsePoints(false);
    setPointsToRedeem(0);
    setShowRegisterCustomer(false);
  };

  const handleProceedPayment = () => {
    onPayment({
      customer,
      promotion: promoResponse,
      pointsToRedeem: activePointsToRedeem,
      subtotal,
      discountAmount: voucherDiscount,
      pointsDiscountAmount: pointsDiscount,
      finalTotal,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header Panel */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{table?.name ?? "Chưa chọn bàn"}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {orderItems.length} loại món · {count} phần
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowMenu(!showMenu);
            setPendingItem(null);
          }}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-orange-50 px-4 text-sm font-bold text-orange-700 hover:bg-orange-100 cursor-pointer transition"
        >
          {showMenu ? <ArrowLeft size={18} /> : <Plus size={18} />}
          {showMenu ? "Về hóa đơn" : "Thêm món"}
        </button>
      </div>

      {showMenu ? (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <label className="mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={18} className="text-slate-400" />
            <input
              autoFocus
              aria-label="Tìm món"
              placeholder="Tìm tên món…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 min-w-0 flex-1 outline-none text-sm"
            />
          </label>
          {pendingItem ? (
            <div className="overflow-y-auto rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold text-slate-900">{pendingItem.name}</h3>
              <p className="mt-1 text-sm text-slate-500">Chọn tùy chọn để thêm món</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pendingItem.spicyLevels?.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      onAddItem(pendingItem, level);
                      setPendingItem(null);
                      setShowMenu(false);
                    }}
                    className="min-h-11 rounded-lg border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-700 hover:bg-orange-50 cursor-pointer transition"
                  >
                    {level}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPendingItem(null)}
                className="mt-4 min-h-11 text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Quay lại danh mục
              </button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (onSelectItem) {
                        onSelectItem(item);
                      } else if (item.spicyLevels?.length) {
                        setPendingItem(item);
                      } else {
                        onAddItem(item);
                      }
                    }}
                    className="flex min-h-20 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{item.name}</span>
                      <span className="mt-1 block text-sm font-bold text-orange-700">
                        {formatCurrency(item.price)}
                      </span>
                    </span>
                    <Plus size={18} className="shrink-0 text-orange-600" />
                  </button>
                ))}
              </div>
              {filteredMenu.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy món phù hợp.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="flex justify-between border-b border-slate-100 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Món / số lượng</span>
            <span>Thành tiền</span>
          </div>

          {orderItems.map((item) => (
            <div key={item.id} className="border-b border-slate-100 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    {item.name}
                    {item.sizeName && (
                      <span className="ml-1.5 text-xs font-semibold text-orange-600">
                        ({item.sizeName})
                      </span>
                    )}
                  </p>
                  {item.toppings && item.toppings.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      + {item.toppings.join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="mt-0.5 text-xs italic text-slate-400">* {item.note}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {item.spicyLevel && `${item.spicyLevel} · `}
                    {formatCurrency(item.price)} / phần
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    aria-label={`Giảm số lượng ${item.name}`}
                    onClick={() =>
                      item.quantity === 1 ? setRemoveId(item.id) : onChangeQuantity(item.id, item.quantity - 1)
                    }
                    className="flex size-9 items-center justify-center rounded-l-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-9 text-center text-sm font-bold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Tăng số lượng ${item.name}`}
                    onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
                    className="flex size-9 items-center justify-center rounded-r-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {removeId === item.id && (
                <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  <p>Xóa {item.name} khỏi hóa đơn?</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeQuantity(item.id, 0);
                        setRemoveId(null);
                      }}
                      className="min-h-9 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                    >
                      Xóa món
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveId(null)}
                      className="min-h-9 rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Giữ lại
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {orderItems.length === 0 && (
            <div className="py-16 text-center">
              <ShoppingBag size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-600">Chưa có món trong hóa đơn</p>
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                className="mt-3 min-h-11 text-sm font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                + Thêm món đầu tiên
              </button>
            </div>
          )}

          {/* Phân hệ Khách hàng thân thiết & Voucher (chỉ hiển thị khi có món) */}
          {orderItems.length > 0 && (
            <div className="mt-4 space-y-3 pt-2">
              {/* 1. KHÁCH HÀNG THÂN THIẾT */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-orange-600" />
                    Khách hàng thân thiết
                  </span>
                  {customer && (
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {!customer ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập SĐT khách hàng..."
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer()}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleSearchCustomer}
                        disabled={isSearchingCustomer || !phoneInput.trim()}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isSearchingCustomer ? "..." : "Tìm"}
                      </button>
                    </div>

                    {customerSearchMsg && (
                      <p className="text-[11px] text-amber-700 font-medium">
                        {customerSearchMsg}
                      </p>
                    )}

                    {showRegisterCustomer && (
                      <div className="mt-2 rounded-lg bg-white p-2 border border-orange-200 space-y-2">
                        <input
                          type="text"
                          placeholder="Họ tên khách hàng (tùy chọn)..."
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={handleRegisterCustomer}
                          disabled={isRegisteringCustomer}
                          className="flex items-center justify-center gap-1 w-full rounded bg-emerald-600 py-1 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <UserPlus size={12} />
                          Đăng ký nhanh SĐT này
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {customer.fullName || "Khách quen"} ({customer.phone})
                      </span>
                      <span className="font-extrabold text-orange-600">
                        {customer.currentPoints} điểm
                      </span>
                    </div>

                    {customer.currentPoints > 0 && maxPointsAllowed > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={usePoints}
                            onChange={(e) => {
                              setUsePoints(e.target.checked);
                              if (e.target.checked) {
                                setPointsToRedeem(maxPointsAllowed);
                              }
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span>Dùng {maxPointsAllowed} điểm giảm {formatCurrency(maxPointsAllowed * 1000)}</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. MÃ KHUYẾN MÃI (VOUCHER) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Tag size={14} className="text-orange-600" />
                    Mã khuyến mãi
                  </span>
                  {promoResponse && (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {!promoResponse ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã voucher (vd: GIAM10)..."
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs uppercase outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCodeInput.trim()}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isApplyingPromo ? "..." : "Áp dụng"}
                      </button>
                    </div>

                    {promoMsg && (
                      <p
                        className={`text-[11px] font-medium ${
                          promoMsg.error ? "text-red-600" : "text-emerald-600"
                        }`}
                      >
                        {promoMsg.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Check size={14} />
                      {promoResponse.code} ({promoResponse.discountPercent}%)
                    </span>
                    <span className="font-bold text-emerald-700">
                      -{formatCurrency(voucherDiscount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Tổng kết & Nút Thao tác */}
      <div className="shrink-0 border-t border-slate-200 bg-slate-50/90 p-4">
        {/* Breakdown chi tiết */}
        {orderItems.length > 0 && (
          <div className="mb-3 space-y-1 text-xs text-slate-600 border-b border-slate-200 pb-2">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Giảm giá voucher</span>
                <span className="tabular-nums">-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Giảm giá điểm thưởng</span>
                <span className="tabular-nums">-{formatCurrency(pointsDiscount)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Tổng thanh toán</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {count} phần · {orderItems.length} món
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums text-orange-600">
            {formatCurrency(finalTotal)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Hủy đơn */}
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            disabled={!table || orderItems.length === 0}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            title="Hủy đơn hàng và giải phóng bàn"
          >
            <Trash2 size={16} />
            <span>Hủy đơn</span>
          </button>

          {/* Nút Thanh toán */}
          <button
            type="button"
            onClick={handleProceedPayment}
            disabled={!table || orderItems.length === 0}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shadow-lg shadow-orange-500/20 transition"
          >
            <ShoppingBag size={18} />
            Thanh toán
          </button>
        </div>
      </div>

      {/* Modal Xác nhận Hủy Đơn */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <AlertCircle size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận hủy đơn hàng</h3>
            </div>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn hủy đơn hàng của <strong>{table?.name}</strong>? Đơn hàng sẽ
              chuyển sang trạng thái <strong>CANCELLED</strong> và bàn sẽ được giải phóng về trạng
              thái trống.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirm(false);
                  if (onCancelOrder) onCancelOrder();
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Đồng ý hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
