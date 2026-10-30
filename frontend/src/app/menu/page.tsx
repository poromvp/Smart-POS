"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  UtensilsCrossed,
  AlertCircle,
  RotateCw,
} from "lucide-react";

import MenuItem from "@/components/customer/MenuItem";
import ModifierModal, {
  type ModifierSelection,
} from "@/components/customer/ModifierModal";
import FloatingCart from "@/components/customer/FloatingCart";
import { useGuestCart } from "@/components/customer/guestCartStore";
import {
  getGuestTableId,
  getGuestTableLabel,
  getGuestTableQuery,
} from "@/components/customer/guestTable";
import { fetchMenu } from "@/lib/api";
import type {
  CategoryMenuResponse,
  ProductDetailResponse,
} from "@/lib/types/menu";

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen bg-[#fffaf5]"
          aria-label="Đang tải thực đơn"
        />
      }
    >
      <MenuPageContent />
    </Suspense>
  );
}

function MenuPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = getGuestTableId(searchParams.get("table"));
  const tableLabel = getGuestTableLabel(tableId);
  const tableQuery = getGuestTableQuery(tableId);

  // States dữ liệu menu từ Backend
  const [menuCategories, setMenuCategories] = useState<CategoryMenuResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States lọc & tương tác
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ProductDetailResponse | null>(null);

  const { cartItems, addItem } = useGuestCart(tableId ?? "unassigned");

  // Hàm tải dữ liệu thực đơn từ Backend khi thử lại
  const loadMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenu();
      setMenuCategories(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể kết nối tới máy chủ thực đơn.";
      setError(
        `Không thể kết nối tới máy chủ Backend (http://localhost:8082/api/products/menu). Chi tiết: ${message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetchMenu()
      .then((data) => {
        if (!ignore) {
          setMenuCategories(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          const message =
            err instanceof Error
              ? err.message
              : "Không thể kết nối tới máy chủ thực đơn.";
          setError(
            `Không thể kết nối tới máy chủ Backend (http://localhost:8082/api/products/menu). Chi tiết: ${message}`
          );
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Tổng hợp tất cả sản phẩm phẳng để dễ tìm kiếm và lọc
  const allProducts = useMemo(() => {
    const list: ProductDetailResponse[] = [];
    (menuCategories || []).forEach((cat) => {
      (cat.products || []).forEach((prod) => list.push(prod));
    });
    return list;
  }, [menuCategories]);

  // Lọc sản phẩm theo danh mục và từ khóa tìm kiếm
  const visibleProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchCategory =
        activeCategoryId === "all" || product.categoryId === activeCategoryId;
      const matchSearch =
        !searchTerm.trim() ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (product.code &&
          product.code.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      return matchCategory && matchSearch;
    });
  }, [allProducts, activeCategoryId, searchTerm]);

  // Xử lý khi người dùng chọn xong Size & Topping
  const handleAddToCart = (selection: ModifierSelection) => {
    if (!selectedItem) return;

    const basePrice = selection.variant
      ? selection.variant.finalPrice
      : selectedItem.basePrice;

    const modifierTotal = selection.modifiers.reduce(
      (sum, m) => sum + m.price,
      0
    );

    // Gom nhãn các modifier đã chọn
    const modifierLabels = selection.modifiers.map((m) =>
      m.price > 0
        ? `${m.optionName} (+${m.price.toLocaleString("vi-VN")}₫)`
        : m.optionName
    );

    addItem({
      itemId: String(selectedItem.id),
      name: selectedItem.name,
      sizeName: selection.variant?.sizeName,
      variantId: selection.variant?.id,
      basePrice,
      modifierTotal,
      toppings: modifierLabels,
      sweetness: "",
      note: selection.note,
    });

    setSelectedItem(null);
  };

  return (
    <main className="min-h-screen bg-[#fffaf5] pb-32 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-[#fffdf9]/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Quay lại"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-white text-stone-700 shadow-sm transition hover:border-[#b42318] hover:bg-orange-50 hover:text-[#b42318]"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#b42318] text-white shadow-sm shadow-red-200">
                <UtensilsCrossed size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#b42318]">
                  Smart POS
                </p>
                <h1 className="text-base font-extrabold text-stone-900 leading-tight">
                  Thực đơn gọi món
                </h1>
              </div>
            </div>

            <div className="ml-auto text-right">
              <span className="inline-block rounded-lg bg-orange-100/70 px-2.5 py-1 text-xs font-bold text-orange-900">
                {tableLabel ?? "Tại quầy"}
              </span>
            </div>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative mt-3">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm món ăn, thức uống..."
              className="w-full rounded-xl border border-orange-100 bg-white py-2 pl-9 pr-4 text-xs text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#b42318] focus:ring-1 focus:ring-red-100"
            />
          </div>

          {/* Tabs Danh mục động lấy từ Backend */}
          {!loading && !error && menuCategories.length > 0 && (
            <div className="mt-3 -mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategoryId("all")}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeCategoryId === "all"
                    ? "bg-[#b42318] text-white shadow-sm shadow-red-200"
                    : "bg-white text-stone-600 border border-orange-100 hover:border-orange-200"
                }`}
              >
                Tất cả ({allProducts.length})
              </button>

              {menuCategories.map((cat) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.categoryId)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeCategoryId === cat.categoryId
                      ? "bg-[#b42318] text-white shadow-sm shadow-red-200"
                      : "bg-white text-stone-600 border border-orange-100 hover:border-orange-200"
                  }`}
                >
                  {cat.categoryName} ({cat.products.length})
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Nội dung danh sách món */}
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {/* Trạng thái 1: Đang tải (Skeleton) */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm animate-pulse"
              >
                <div className="h-24 w-24 rounded-xl bg-stone-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-stone-200" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                  <div className="h-4 w-1/3 rounded bg-stone-200 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trạng thái 2: Lỗi kết nối */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-6 sm:p-8 text-center shadow-lg shadow-red-500/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#b42318]">
              <AlertCircle size={28} />
            </div>
            <h2 className="mt-4 text-base font-bold text-stone-900">
              Không thể kết nối đến máy chủ thực đơn
            </h2>
            <div className="mt-2 rounded-xl bg-stone-50 border border-stone-200 p-3 text-left text-xs font-mono text-stone-700 break-all">
              {error}
            </div>
            <div className="mt-4 rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-left text-xs text-amber-900 space-y-1.5">
              <p className="font-bold text-amber-950">Gợi ý kiểm tra:</p>
              <p>1. Đảm bảo Docker PostgreSQL đang chạy: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">docker compose up -d postgres</code> (Cổng 5433).</p>
              <p>2. Đảm bảo ứng dụng backend <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">CatalogInventoryApplication</code> đã khởi chạy thành công trên cổng 8082.</p>
            </div>
            <button
              type="button"
              onClick={loadMenu}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#b42318] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-200 transition hover:bg-[#8f1d15] active:scale-95 cursor-pointer"
            >
              <RotateCw size={14} />
              Thử kết nối lại
            </button>
          </div>
        )}

        {/* Trạng thái 3: Danh sách rỗng */}
        {!loading && !error && visibleProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center">
            <p className="text-xs font-medium text-stone-500">
              {searchTerm
                ? `Không tìm thấy món ăn nào khớp với "${searchTerm}"`
                : "Chưa có món ăn nào trong danh mục này"}
            </p>
          </div>
        )}

        {/* Trạng thái 4: Danh sách món ăn thực tế */}
        {!loading && !error && visibleProducts.length > 0 && (
          <div className="space-y-3">
            {visibleProducts.map((product) => (
              <MenuItem
                key={product.id}
                item={product}
                onClick={() => setSelectedItem(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal tùy chỉnh Size & Topping khi bấm vào món */}
      <ModifierModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Thanh giỏ hàng nổi phía dưới */}
      <FloatingCart
        items={cartItems}
        onViewCart={() =>
          router.push(tableQuery ? `/cart${tableQuery}` : "/cart")
        }
      />
    </main>
  );
}
