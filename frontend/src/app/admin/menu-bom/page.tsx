"use client";

import React, { useState, useMemo } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Upload,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ImageIcon,
  Calculator,
} from "lucide-react";

interface BomRow {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number;
}

const AVAILABLE_INGREDIENTS = [
  { name: "Bánh phở tươi", unit: "g", unitCost: 30 },
  { name: "Thịt bò phi lê", unit: "g", unitCost: 180 },
  { name: "Nước dùng", unit: "ml", unitCost: 20 },
  { name: "Hành lá", unit: "g", unitCost: 25 },
  { name: "Gầu bò", unit: "g", unitCost: 160 },
  { name: "Bò viên", unit: "g", unitCost: 120 },
];

const INITIAL_BOM: BomRow[] = [
  { id: "bom-1", ingredientName: "Bánh phở tươi", quantity: 150, unit: "g", cost: 4500 },
  { id: "bom-2", ingredientName: "Thịt bò phi lê", quantity: 100, unit: "g", cost: 18000 },
  { id: "bom-3", ingredientName: "Nước dùng", quantity: 300, unit: "ml", cost: 6000 },
  { id: "bom-4", ingredientName: "Hành lá", quantity: 20, unit: "g", cost: 500 },
];

export default function MenuBomPage() {
  const toast = useToast();
  const [dishCode] = useState("MA001 (tự động)");
  const [dishName, setDishName] = useState("Phở bò đặc biệt");
  const [category, setCategory] = useState("Món nước");
  const [sellingPrice, setSellingPrice] = useState(75000);
  const [station, setStation] = useState("Trạm 1: Bếp nóng");
  const [bomList, setBomList] = useState<BomRow[]>(INITIAL_BOM);

  const totalCost = useMemo(
    () => bomList.reduce((acc, row) => acc + row.cost, 0),
    [bomList]
  );

  const handleIngredientChange = (rowId: string, newName: string) => {
    const found = AVAILABLE_INGREDIENTS.find((i) => i.name === newName);
    setBomList((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const unit = found ? found.unit : row.unit;
        const cost = found ? found.unitCost * row.quantity : row.cost;
        return { ...row, ingredientName: newName, unit, cost };
      })
    );
  };

  const handleQuantityChange = (rowId: string, newQty: number) => {
    const qty = Math.max(0, newQty);
    setBomList((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const found = AVAILABLE_INGREDIENTS.find(
          (i) => i.name === row.ingredientName
        );
        const cost = found ? found.unitCost * qty : row.cost;
        return { ...row, quantity: qty, cost };
      })
    );
  };

  const handleAddIngredient = () => {
    const defaultIng = AVAILABLE_INGREDIENTS[4];
    const newRow: BomRow = {
      id: `bom-${Date.now()}`,
      ingredientName: defaultIng.name,
      quantity: 50,
      unit: defaultIng.unit,
      cost: defaultIng.unitCost * 50,
    };
    setBomList((prev) => [...prev, newRow]);
  };

  const handleRemoveIngredient = (rowId: string) => {
    setBomList((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleReset = () => {
    setDishName("Phở bò đặc biệt");
    setCategory("Món nước");
    setSellingPrice(75000);
    setStation("Trạm 1: Bếp nóng");
    setBomList(INITIAL_BOM);
    toast.info("Đã khôi phục", "Dữ liệu món ăn đã quay về trạng thái ban đầu.");
  };

  const handleSaveBom = () => {
    toast.success(
      "Lưu công thức BOM thành công",
      `Món "${dishName}" có giá vốn ${totalCost.toLocaleString("vi-VN")}đ / phần.`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa món ăn</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Hủy bỏ
          </button>
          <button
            onClick={handleSaveBom}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-sm shadow-orange-500/25 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu công thức BOM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-gray-800">Thông tin món ăn</h3>

          <div className="h-44 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2">
            <ImageIcon className="w-8 h-8 text-orange-400" />
            <span className="text-sm font-medium">Ảnh món</span>
          </div>

          <button
            type="button"
            onClick={() =>
              toast.info("Tải ảnh món ăn", "Chọn file PNG hoặc JPG dưới 5MB.")
            }
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:border-orange-500 hover:text-orange-600 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Tải ảnh lên
          </button>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Mã món
              </label>
              <input
                type="text"
                value={dishCode}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Tên món ăn
              </label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                >
                  <option value="Món nước">Món nước</option>
                  <option value="Món khô">Món khô</option>
                  <option value="Đồ uống">Đồ uống</option>
                  <option value="Ăn vặt">Ăn vặt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Giá bán (đ)
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Trạm bếp
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
              >
                <option value="Trạm 1: Bếp nóng">Trạm 1: Bếp nóng</option>
                <option value="Trạm 2: Đồ lạnh">Trạm 2: Đồ lạnh</option>
                <option value="Trạm 3: Quầy bar">Trạm 3: Quầy bar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">
                Nguyên liệu cho 1 phần
              </h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm nguyên liệu
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                    <th className="py-3.5 px-4">Nguyên liệu</th>
                    <th className="py-3.5 px-4">Định lượng</th>
                    <th className="py-3.5 px-4">Đơn vị</th>
                    <th className="py-3.5 px-4">Giá vốn</th>
                    <th className="py-3.5 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {bomList.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-orange-50/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <select
                          value={row.ingredientName}
                          onChange={(e) =>
                            handleIngredientChange(row.id, e.target.value)
                          }
                          className="bg-transparent font-medium text-gray-800 focus:text-orange-600 outline-none cursor-pointer"
                        >
                          {AVAILABLE_INGREDIENTS.map((ing) => (
                            <option key={ing.name} value={ing.name}>
                              {ing.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) =>
                            handleQuantityChange(row.id, Number(e.target.value))
                          }
                          className="w-20 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-800 font-semibold focus:border-orange-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium">
                        {row.unit}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {row.cost.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(row.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 font-medium">
              Định lượng được trừ kho tự động khi hoàn tất món.
            </p>
          </div>

          <div className="bg-orange-50/90 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-600 text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="text-sm sm:text-base font-bold text-gray-800">
                <span>
                  Giá vốn:{" "}
                  <span className="text-orange-600">
                    {totalCost.toLocaleString("vi-VN")}đ / phần
                  </span>
                </span>
                <span className="mx-3 text-gray-300">·</span>
                <span>
                  Giá bán:{" "}
                  <span className="text-gray-900">
                    {sellingPrice.toLocaleString("vi-VN")}đ
                  </span>
                </span>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-orange-700 border border-orange-200 self-start sm:self-auto">
              Cost: {sellingPrice > 0 ? Math.round((totalCost / sellingPrice) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}