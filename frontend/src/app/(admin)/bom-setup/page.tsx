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
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-16 items-center justify-between px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              SmartPOS Admin
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Quản lý công thức định lượng
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold">
                Quản trị viên
              </p>

              <p className="text-xs text-slate-400">
                BOM Setup
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-[1600px] p-6">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <span>Admin</span>
          <span>/</span>
          <span className="font-medium text-slate-800">
            BOM Setup
          </span>
        </div>

        