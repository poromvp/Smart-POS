"use client";

export interface Ingredient {
  id: string;
  name: string;
  unit: "g" | "ml";
  stock: number;
}

interface IngredientListProps {
  ingredients: Ingredient[];
}

export default function IngredientList({
  ingredients,
}: IngredientListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="font-bold text-slate-900">
            Nguyên liệu trong kho
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Danh sách nguyên liệu có thể dùng cho
            công thức.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {ingredients.length} nguyên liệu
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="w-16 px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                #
              </th>

              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Nguyên liệu
              </th>

              <th className="w-36 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                Đơn vị
              </th>

              <th className="w-48 px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                Tồn kho
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {ingredients.map(
              (ingredient, index) => (
                <tr
                  key={ingredient.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-400">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        {ingredient.unit ===
                        "ml"
                          ? "💧"
                          : "📦"}
                      </div>

                      <span className="font-semibold text-slate-900">
                        {ingredient.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                      {ingredient.unit}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-900">
                      {ingredient.stock.toLocaleString(
                        "vi-VN"
                      )}
                    </span>

                    <span className="ml-1 text-xs text-slate-400">
                      {ingredient.unit}
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}