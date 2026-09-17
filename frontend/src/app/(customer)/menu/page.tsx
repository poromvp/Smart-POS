"use client";

import { useState } from "react";

import MenuItem, {
  type MenuItemData,
} from "@/components/customer/MenuItem";

import ModifierModal, {
  type ModifierSelection,
} from "@/components/customer/ModifierModal";

import FloatingCart, {
  type CartItem,
} from "@/components/customer/FloatingCart";

const MENU_ITEMS: MenuItemData[] = [
  {
    id: "m1",
    name: "Cà phê sữa đá",
    price: 35000,
    image:
      "https://placehold.co/600x400/1f2937/ffffff?text=Ca+Phe+Sua+Da",
    stationId: "bar",
  },
  {
    id: "m2",
    name: "Trà đào cam sả",
    price: 45000,
    image:
      "https://placehold.co/600x400/f59e0b/ffffff?text=Tra+Dao+Cam+Sa",
    stationId: "cold",
  },
  {
    id: "m3",
    name: "Mì xào bò",
    price: 65000,
    image:
      "https://placehold.co/600x400/ef4444/ffffff?text=Mi+Xao+Bo",
    stationId: "hot",
  },
  {
    id: "m4",
    name: "Gà sốt cay Hàn Quốc",
    price: 89000,
    image:
      "https://placehold.co/600x400/dc2626/ffffff?text=Ga+Sot+Cay",
    stationId: "hot",
  },
  {
    id: "m5",
    name: "Matcha latte",
    price: 55000,
    image:
      "https://placehold.co/600x400/16a34a/ffffff?text=Matcha+Latte",
    stationId: "bar",
  },
];

const STATION_LABEL: Record<MenuItemData["stationId"], string> = {
  hot: "Món nóng",
  cold: "Đồ lạnh",
  bar: "Đồ uống",
};

export default function MenuPage() {
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleAddToCart = (selection: ModifierSelection) => {
    if (!selectedItem) return;

    const modifierTotal = selection.toppings.reduce(
      (sum, topping) => sum + topping.price,
      0
    );

    const cartItem: CartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      itemId: selectedItem.id,
      name: selectedItem.name,
      basePrice: selectedItem.price,
      modifierTotal,
      toppings: selection.toppings.map((item) => item.label),
      sweetness: selection.sweetness,
      note: selection.note,
      quantity: 1,
    };

    setCartItems((prev) => [...prev, cartItem]);
    setSelectedItem(null);
  };

  const handleSubmitOrder = () => {
    if (cartItems.length === 0) return;

    alert("Đã gửi đơn xuống bếp thành công");
    setCartItems([]);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                Nhà hàng ABC
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Thực đơn
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Bàn #A12 • Quét QR thành công
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl">
              🍽️
            </div>
          </div>
        </div>
      </header>

      {/* Menu */}
      <section className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-600">
            Chọn món bạn muốn dùng
          </p>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(STATION_LABEL) as MenuItemData["stationId"][]).map(
              (station) => (
                <span
                  key={station}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200"
                >
                  {STATION_LABEL[station]}
                </span>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      </section>

      {/* Modifier Modal */}
      <ModifierModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart */}
      <FloatingCart
        items={cartItems}
        onSubmitOrder={handleSubmitOrder}
      />
    </main>
  );
}