"use client";

import { useState } from "react";

import RecipeEditor, {
  type RecipeItem,
} from "@/components/admin/RecipeEditor";

import IngredientList, {
  type Ingredient,
} from "@/components/admin/IngredientList";

interface Product {
  id: string;
  name: string;
  category: string;
}

const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: "ing-001",
    name: "Mì",
    unit: "g",
    stock: 2500,
  },
  {
    id: "ing-002",
    name: "Thịt bò",
    unit: "g",
    stock: 5000,
  },
  {
    id: "ing-003",
    name: "Nước dùng",
    unit: "ml",
    stock: 10000,
  },
];

const PRODUCTS: Product[] = [
  {
    id: "product-001",
    name: "Tô Ramen",
    category: "Món chính",
  },
];

const INITIAL_RECIPES: Record<string, RecipeItem[]> = {
  "product-001": [
    {
      ingredientId: "ing-001",
      ingredientName: "Mì",
      quantity: 200,
      unit: "g",
    },
    {
      ingredientId: "ing-002",
      ingredientName: "Thịt bò",
      quantity: 100,
      unit: "g",
    },
    {
      ingredientId: "ing-003",
      ingredientName: "Nước dùng",
      quantity: 500,
      unit: "ml",
    },
  ],
};

export default function BomSetupPage() {
  const [selectedProductId, setSelectedProductId] =
    useState(PRODUCTS[0].id);

  const [recipes, setRecipes] =
    useState<Record<string, RecipeItem[]>>(
      INITIAL_RECIPES
    );

  const [saved, setSaved] = useState(false);

  const selectedProduct = PRODUCTS.find(
    (product) =>
      product.id === selectedProductId
  );

  const currentRecipe =
    recipes[selectedProductId] ?? [];

  const handleRecipeChange = (
    nextRecipe: RecipeItem[]
  ) => {
    setRecipes((prev) => ({
      ...prev,
      [selectedProductId]: nextRecipe,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    console.log("BOM DATA:", {
      productId: selectedProductId,
      recipe: currentRecipe,
    });

    setSaved(true);

    alert(
      `Đã lưu BOM cho ${selectedProduct?.name ?? "món ăn"} thành công`
    );
  };

  return (
    

        {/* Main workspace */}
        <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-5">
          {/* LEFT */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-bold text-slate-900">
                Danh sách món
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Chọn món để cấu hình BOM
              </p>
            </div>

            <div className="p-3">
              {PRODUCTS.map((product) => {
                const selected =
                  selectedProductId ===
                  product.id;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(
                        product.id
                      );
                      setSaved(false);
                    }}
                    className={[
                      "w-full rounded-xl p-4 text-left transition",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                      selected
                        ? "bg-emerald-50 ring-1 ring-emerald-200"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          selected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        🍜
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT */}
          <section className="min-w-0">
            <RecipeEditor
              product={selectedProduct ?? null}
              ingredients={INITIAL_INGREDIENTS}
              recipe={currentRecipe}
              onRecipeChange={
                handleRecipeChange
              }
              onSave={handleSave}
              saved={saved}
            />

            <div className="mt-5">
              <IngredientList
                ingredients={INITIAL_INGREDIENTS}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}