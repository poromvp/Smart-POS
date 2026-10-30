"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Calculator,
  RefreshCw,
  Layers,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  ProductSummaryResponse,
  IngredientResponse,
  RecipeResponse,
  RecipeItemRequest,
} from "@/lib/types/inventory";
import {
  fetchProducts,
  fetchIngredients,
  fetchProductRecipe,
  saveProductRecipe,
} from "@/lib/api";

type RecipeScope = "base" | "variant" | "modifier";

interface LocalRecipeRow {
  ingredientId: number;
  quantityNeeded: string | number;
}

interface BomTableEditorProps {
  title: string;
  initialItems: RecipeItemRequest[];
  ingredients: IngredientResponse[];
  onSave: (items: RecipeItemRequest[]) => Promise<void>;
  onReset: () => void;
  saving: boolean;
}

function BomTableEditor({
  title,
  initialItems,
  ingredients,
  onSave,
  onReset,
  saving,
}: BomTableEditorProps) {
  const toast = useToast();
  const [items, setItems] = useState<LocalRecipeRow[]>(() =>
    initialItems.map((i) => ({
      ingredientId: i.ingredientId,
      quantityNeeded: i.quantityNeeded,
    }))
  );

  const handleAddRow = () => {
    if (ingredients.length === 0) {
      toast.warning("Chưa có dữ liệu", "Danh sách nguyên liệu trong kho đang trống hoặc chưa tải xong.");
      return;
    }

    const existingIds = new Set(items.map((i) => i.ingredientId));
    const available = ingredients.find((ing) => !existingIds.has(ing.id));

    if (!available) {
      toast.warning(
        "Đã dùng hết nguyên liệu",
        "Tất cả nguyên liệu hiện có trong kho đều đã được thêm vào công thức này."
      );
      return;
    }

    setItems((prev) => [...prev, { ingredientId: available.id, quantityNeeded: 1 }]);
  };

  const handleUpdateRow = (index: number, ingredientId: number, rawQty: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ingredientId, quantityNeeded: rawQty };
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const estimatedCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const qtyNum = parseFloat(String(item.quantityNeeded)) || 0;
      return sum + (ing ? ing.costPerUnit * qtyNum : 0);
    }, 0);
  }, [items, ingredients]);

  const handleSaveClick = () => {
    // 1. Kiểm tra nguyên liệu trùng lặp
    const ids = items.map((i) => i.ingredientId);
    if (new Set(ids).size !== ids.length) {
      toast.error("Lỗi công thức", "Có nguyên liệu bị chọn trùng lặp nhiều lần");
      return;
    }

    // 2. Kiểm tra định lượng hợp lệ
    const validatedItems: RecipeItemRequest[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const parsedQty = parseFloat(String(it.quantityNeeded));
      const ing = ingredients.find((x) => x.id === it.ingredientId);

      if (isNaN(parsedQty) || parsedQty <= 0) {
        toast.error(
          "Định lượng không hợp lệ",
          `Nguyên liệu "${ing?.name || "được chọn"}" phải có định lượng lớn hơn 0`
        );
        return;
      }

      validatedItems.push({
        ingredientId: it.ingredientId,
        quantityNeeded: parsedQty,
      });
    }

    onSave(validatedItems);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            * Khi bán món, kho sẽ cộng dồn (Món gốc + Size + Toppings) để trừ tự động.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition border border-orange-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm nguyên liệu</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
              <th className="px-6 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Nguyên liệu</th>
              <th className="px-4 py-3 w-40 text-right">Định lượng</th>
              <th className="px-4 py-3 w-28 text-center">ĐVT</th>
              <th className="px-4 py-3 w-40 text-right">Ước tính giá vốn</th>
              <th className="px-6 py-3 w-20 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Chưa có nguyên liệu nào được cấu hình cho mục này.
                  <br />
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="mt-2 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                  >
                    + Bấm vào đây để thêm nguyên liệu
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const ing = ingredients.find((i) => i.id === item.ingredientId);
                const numericQty = parseFloat(String(item.quantityNeeded)) || 0;
                const rowCost = ing ? ing.costPerUnit * numericQty : 0;

                return (
                  <tr key={`${item.ingredientId}-${index}`} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-center text-xs text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.ingredientId}
                        onChange={(e) =>
                          handleUpdateRow(index, Number(e.target.value), item.quantityNeeded)
                        }
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {ingredients.map((ingItem) => {
                          const isUsedElsewhere = items.some(
                            (it, itIdx) => itIdx !== index && it.ingredientId === ingItem.id
                          );
                          return (
                            <option
                              key={ingItem.id}
                              value={ingItem.id}
                              disabled={isUsedElsewhere}
                            >
                              {ingItem.name} ({ingItem.unit}){isUsedElsewhere ? " - [Đã chọn]" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={item.quantityNeeded}
                        onChange={(e) =>
                          handleUpdateRow(index, item.ingredientId, e.target.value)
                        }
                        placeholder="0.0"
                        className="w-28 text-right font-mono bg-white border border-gray-300 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-900 outline-none focus:border-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-bold text-gray-600">
                        {ing?.unit || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">
                      {rowCost.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                        title="Xóa nguyên liệu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/75 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Ước tính giá vốn định lượng:</div>
            <div className="text-base font-bold font-mono text-gray-900">
              {estimatedCost.toLocaleString("vi-VN")} đ
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setItems(
                initialItems.map((i) => ({
                  ingredientId: i.ingredientId,
                  quantityNeeded: i.quantityNeeded,
                }))
              );
              onReset();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hủy thay đổi</span>
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu..." : "Lưu cấu hình"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuBomPage() {
  const toast = useToast();

  const [products, setProducts] = useState<ProductSummaryResponse[]>([]);
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  // Phân vùng cấu hình: Món gốc ("base"), Size ("variant"), hoặc Topping ("modifier")
  const [activeScope, setActiveScope] = useState<RecipeScope>("base");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  // Tải danh sách món ăn và nguyên liệu ban đầu
  useEffect(() => {
    let ignore = false;
    Promise.all([fetchProducts(), fetchIngredients()])
      .then(([prods, ings]) => {
        if (!ignore) {
          setProducts(prods);
          setIngredients(ings);
          if (prods.length > 0) {
            setSelectedProductId(prods[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          toast.error("Không thể tải dữ liệu", err instanceof Error ? err.message : "Lỗi kết nối");
        }
      });
    return () => {
      ignore = true;
    };
  }, [toast]);

  // Tải công thức khi chọn món ăn (dùng cho refresh sau lưu)
  const reloadRecipe = useCallback(
    (productId: number) => {
      setLoading(true);
      fetchProductRecipe(productId)
        .then((data) => {
          setRecipeData(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariantId((prev) =>
              data.variants.some((v) => v.variantId === prev) ? prev : data.variants[0].variantId
            );
          } else {
            setSelectedVariantId(null);
          }

          if (data.modifierOptions && data.modifierOptions.length > 0) {
            setSelectedOptionId((prev) =>
              data.modifierOptions.some((o) => o.modifierOptionId === prev)
                ? prev
                : data.modifierOptions[0].modifierOptionId
            );
          } else {
            setSelectedOptionId(null);
          }

          setRevision((r) => r + 1);
          setLoading(false);
        })
        .catch((err: unknown) => {
          toast.error("Không thể tải công thức", err instanceof Error ? err.message : "Lỗi kết nối");
          setLoading(false);
        });
    },
    [toast]
  );

  // Khi người dùng đổi món ăn
  const handleSelectProduct = (newProductId: number) => {
    setSelectedProductId(newProductId);
    setSelectedVariantId(null);
    setSelectedOptionId(null);
  };

  useEffect(() => {
    if (!selectedProductId) return;
    let ignore = false;
    fetchProductRecipe(selectedProductId)
      .then((data) => {
        if (!ignore) {
          setRecipeData(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariantId((prev) =>
              data.variants.some((v) => v.variantId === prev) ? prev : data.variants[0].variantId
            );
          } else {
            setSelectedVariantId(null);
          }
          if (data.modifierOptions && data.modifierOptions.length > 0) {
            setSelectedOptionId((prev) =>
              data.modifierOptions.some((o) => o.modifierOptionId === prev)
                ? prev
                : data.modifierOptions[0].modifierOptionId
            );
          } else {
            setSelectedOptionId(null);
          }
          setRevision((r) => r + 1);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          toast.error("Không thể tải công thức", err instanceof Error ? err.message : "Lỗi kết nối");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [selectedProductId, toast]);

  // Xác định items mặc định cho scope đang chọn
  const currentScopeItems = useMemo<RecipeItemRequest[]>(() => {
    if (!recipeData) return [];
    if (activeScope === "base") {
      return recipeData.baseItems.map((i) => ({
        ingredientId: i.ingredientId,
        quantityNeeded: i.quantityNeeded,
      }));
    }
    if (activeScope === "variant") {
      if (!recipeData.variants || recipeData.variants.length === 0) return [];
      const v =
        recipeData.variants.find((item) => item.variantId === selectedVariantId) ||
        recipeData.variants[0];
      return v ? v.items.map((i) => ({ ingredientId: i.ingredientId, quantityNeeded: i.quantityNeeded })) : [];
    }
    if (activeScope === "modifier") {
      if (!recipeData.modifierOptions || recipeData.modifierOptions.length === 0) return [];
      const opt =
        recipeData.modifierOptions.find((item) => item.modifierOptionId === selectedOptionId) ||
        recipeData.modifierOptions[0];
      return opt ? opt.items.map((i) => ({ ingredientId: i.ingredientId, quantityNeeded: i.quantityNeeded })) : [];
    }
    return [];
  }, [recipeData, activeScope, selectedVariantId, selectedOptionId]);

  // Lưu công thức
  const handleSaveScope = async (itemsToSave: RecipeItemRequest[]) => {
    if (!selectedProductId) return;

    if (activeScope === "variant") {
      const targetVariantId = selectedVariantId ?? recipeData?.variants[0]?.variantId;
      if (!targetVariantId) {
        toast.error("Lỗi", "Món này không có biến thể Size để lưu");
        return;
      }
    }

    if (activeScope === "modifier") {
      const targetOptionId = selectedOptionId ?? recipeData?.modifierOptions[0]?.modifierOptionId;
      if (!targetOptionId) {
        toast.error("Lỗi", "Món này không có Topping / tùy chọn để lưu");
        return;
      }
    }

    try {
      setSaving(true);
      await saveProductRecipe(selectedProductId, {
        variantId: activeScope === "variant" ? (selectedVariantId ?? recipeData?.variants[0]?.variantId) : undefined,
        modifierOptionId: activeScope === "modifier" ? (selectedOptionId ?? recipeData?.modifierOptions[0]?.modifierOptionId) : undefined,
        items: itemsToSave,
      });
      toast.success("Thành công", "Đã lưu công thức định lượng!");
      reloadRecipe(selectedProductId);
    } catch (err: unknown) {
      toast.error("Lưu thất bại", err instanceof Error ? err.message : "Lỗi hệ thống");
    } finally {
      setSaving(false);
    }
  };

  const currentProduct = products.find((p) => p.id === selectedProductId);

  const currentTitle = useMemo(() => {
    if (activeScope === "base") return `Định lượng Món gốc: ${currentProduct?.name || ""}`;
    if (activeScope === "variant") {
      const v = recipeData?.variants?.find((item) => item.variantId === selectedVariantId) || recipeData?.variants?.[0];
      return `Định lượng cộng thêm cho Size: ${v?.sizeName || ""}`;
    }
    if (activeScope === "modifier") {
      const opt = recipeData?.modifierOptions?.find((item) => item.modifierOptionId === selectedOptionId) || recipeData?.modifierOptions?.[0];
      return `Định lượng cho Topping: ${opt ? `${opt.groupName} - ${opt.optionName}` : ""}`;
    }
    return "";
  }, [activeScope, currentProduct, recipeData, selectedVariantId, selectedOptionId]);

  const activeVariantId = selectedVariantId ?? recipeData?.variants?.[0]?.variantId ?? null;
  const activeOptionId = selectedOptionId ?? recipeData?.modifierOptions?.[0]?.modifierOptionId ?? null;

  const hasVariants = Boolean(recipeData?.variants && recipeData.variants.length > 0);
  const hasModifiers = Boolean(recipeData?.modifierOptions && recipeData.modifierOptions.length > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Chọn món */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            Cấu hình Định lượng (BOM) & Giá vốn
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập nguyên liệu tiêu hao cho từng món ăn, size cụ thể và topping gọi thêm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase text-gray-600 shrink-0">Chọn món:</label>
          <select
            value={selectedProductId || ""}
            onChange={(e) => handleSelectProduct(Number(e.target.value))}
            className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.code ? `(${p.code})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Phân Vùng Cấu hình: Món gốc / Size / Topping */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveScope("base")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeScope === "base"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Công thức Món gốc</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
            {recipeData?.baseItems.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("variant")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeScope === "variant"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span>Định lượng theo Size</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
            {recipeData?.variants.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope("modifier")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeScope === "modifier"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Định lượng Topping</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10">
            {recipeData?.modifierOptions.length || 0}
          </span>
        </button>
      </div>

      {/* Sub-selector khi chọn Size hoặc Topping */}
      {activeScope === "variant" && hasVariants && (
        <div className="flex items-center gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
          <span className="text-xs font-bold text-blue-900">Chọn biến thể Size:</span>
          <div className="flex flex-wrap gap-2">
            {recipeData?.variants.map((v) => (
              <button
                key={v.variantId}
                type="button"
                onClick={() => setSelectedVariantId(v.variantId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeVariantId === v.variantId
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-blue-800 border border-blue-200 hover:bg-blue-100/50"
                }`}
              >
                {v.sizeName} ({v.items.length} nguyên liệu)
              </button>
            ))}
          </div>
        </div>
      )}

      {activeScope === "modifier" && hasModifiers && (
        <div className="flex items-center gap-2 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
          <span className="text-xs font-bold text-amber-900">Chọn Topping/Tùy chọn:</span>
          <div className="flex flex-wrap gap-2">
            {recipeData?.modifierOptions.map((opt) => (
              <button
                key={opt.modifierOptionId}
                type="button"
                onClick={() => setSelectedOptionId(opt.modifierOptionId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeOptionId === opt.modifierOptionId
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-100/50"
                }`}
              >
                {opt.groupName}: {opt.optionName} ({opt.items.length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nội dung bảng chỉnh sửa định lượng hoặc Empty State an toàn */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
          Đang tải công thức...
        </div>
      ) : activeScope === "variant" && !hasVariants ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-gray-800 text-base">Món này không có biến thể Size</h4>
          <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Món ăn này hiện chỉ có kích thước tiêu chuẩn mặc định. Để cấu hình nguyên liệu, vui lòng chuyển sang tab{" "}
            <button
              type="button"
              onClick={() => setActiveScope("base")}
              className="text-orange-600 font-bold hover:underline cursor-pointer"
            >
              &quot;Công thức Món gốc&quot;
            </button>{" "}
            hoặc thêm Size trong trang{" "}
            <Link href="/admin/products" className="text-blue-600 font-bold hover:underline">
              Món ăn & Thực đơn
            </Link>.
          </p>
        </div>
      ) : activeScope === "modifier" && !hasModifiers ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mx-auto mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-gray-800 text-base">Món này chưa có Topping / Nhóm tùy chọn</h4>
          <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Món ăn này chưa được gán bất kỳ nhóm tùy chọn nào (Topping, Mức đá, Mức ngọt...). Bạn hãy vào trang{" "}
            <Link href="/admin/products" className="text-orange-600 font-bold hover:underline">
              Món ăn & Thực đơn
            </Link>{" "}
            để liên kết nhóm tùy chọn cho món trước khi định lượng.
          </p>
        </div>
      ) : (
        <BomTableEditor
          key={`${selectedProductId}-${activeScope}-${activeVariantId}-${activeOptionId}-rev-${revision}`}
          title={currentTitle}
          initialItems={currentScopeItems}
          ingredients={ingredients}
          onSave={handleSaveScope}
          onReset={() => selectedProductId && reloadRecipe(selectedProductId)}
          saving={saving}
        />
      )}
    </div>
  );
}
