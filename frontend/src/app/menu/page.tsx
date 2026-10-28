"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, Search, ShoppingCart, UtensilsCrossed } from "lucide-react";

import MenuItem, {
  type MenuItemData,
} from "@/components/customer/MenuItem";

import ModifierModal, {
  type ModifierSelection,
} from "@/components/customer/ModifierModal";

import FloatingCart from "@/components/customer/FloatingCart";
import { useGuestCart } from "@/components/customer/guestCartStore";
import { getGuestTableId, getGuestTableLabel, getGuestTableQuery } from "@/components/customer/guestTable";

const MENU_ITEMS: MenuItemData[] = [
  {
    id: "m1",
    name: "Cà phê sữa đá",
    price: 35000,
    image: "/menu/iced-coffee.jpg",
    stationId: "bar",
  },
  {
    id: "m2",
    name: "Trà đào cam sả",
    price: 45000,
    image: "/menu/peach-tea.jpg",
    stationId: "cold",
  },
  {
    id: "m3",
    name: "Mì xào bò",
    price: 65000,
    image: "/menu/beef-noodles.jpg",
    stationId: "hot",
  },
  {
    id: "m4",
    name: "Gà sốt cay Hàn Quốc",
    price: 89000,
    image: "/menu/spicy-chicken.jpg",
    stationId: "hot",
  },
  {
    id: "m5",
    name: "Matcha latte",
    price: 55000,
    image: "/menu/matcha-latte.jpg",
    stationId: "bar",
  },
];

const STATION_LABEL: Record<MenuItemData["stationId"], string> = {
  hot: "Món nóng",
  cold: "Đồ lạnh",
  bar: "Đồ uống",
};

export default function MenuPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fffaf5]" aria-label="Đang tải thực đơn" />}>
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
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);
  const [activeStation, setActiveStation] = useState<"all" | MenuItemData["stationId"]>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { cartItems, addItem } = useGuestCart(tableId ?? "unassigned");

  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    const matchesStation = activeStation === "all" || item.stationId === activeStation;
    const matchesSearch = item.name.toLocaleLowerCase("vi-VN").includes(
      searchTerm.trim().toLocaleLowerCase("vi-VN"),
    );

    return matchesStation && matchesSearch;
  });

  const handleAddToCart = (selection: ModifierSelection) => {
    if (!selectedItem) return;

    const modifierTotal = selection.toppings.reduce(
      (sum, topping) => sum + topping.price,
      0
    );

    addItem({
      itemId: selectedItem.id,
      name: selectedItem.name,
      basePrice: selectedItem.price,
      modifierTotal,
      toppings: selection.toppings.map((item) => item.label),
      sweetness: selection.sweetness,
      note: selection.note,
    });
    setSelectedItem(null);
  };

  return (
    <main className="min-h-screen bg-[#fffaf5] pb-32 text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-[#fffdf9]/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Quay lại"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-white text-stone-700 shadow-sm transition hover:border-[#b42318] hover:bg-orange-50 hover:text-[#b42318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42318]"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#b42318] text-white shadow-sm shadow-red-200">
                <UtensilsCrossed size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b42318]">
                  Nhà hàng Mì Cay
                </p>
                <h1 className="mt-0.5 text-xl font-extrabold text-stone-900">
                  Thực đơn
                </h1>
              </div>
            </div>

            <div className="ml-auto flex justify-end">
              <button
                type="button"
                onClick={() => router.push(`/cart${tableQuery}`)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-orange-200 bg-white px-3.5 text-sm font-bold text-stone-700 shadow-sm transition hover:border-[#b42318] hover:bg-orange-50 hover:text-[#b42318]"
              >
                <ShoppingCart size={18} aria-hidden="true" />
                Xem giỏ
              </button>
            </div>
          </div>
          <div className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tableLabel ? "bg-[#fff0e8] text-[#9f2d1d]" : "bg-amber-50 text-amber-800"}`}>
            <MapPin size={15} aria-hidden="true" />
            {tableLabel ? `Đang gọi món cho ${tableLabel}` : "Quét mã QR tại bàn để bắt đầu gọi món"}
          </div>
        </div>
      </header>

      {/* Menu */}
      <section className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm món ăn..."
              className="h-12 w-full rounded-xl border border-orange-100 bg-white py-3 pl-11 pr-4 text-sm text-stone-800 shadow-sm placeholder:text-stone-400 focus:border-[#b42318] focus:ring-4 focus:ring-red-100"
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveStation("all")}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeStation === "all" ? "border-[#b42318] bg-[#b42318] text-white" : "border-orange-100 bg-white text-stone-600 hover:border-orange-300"}`}
            >
              Tất cả
            </button>
            {(Object.keys(STATION_LABEL) as MenuItemData["stationId"][]).map((station) => (
              <button
                key={station}
                type="button"
                onClick={() => setActiveStation(station)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${activeStation === station ? "border-[#b42318] bg-[#b42318] text-white" : "border-orange-100 bg-white text-stone-600 hover:border-orange-300"}`}
              >
                {STATION_LABEL[station]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b42318]">{tableLabel ? `Gọi món tại ${tableLabel}` : "Thực đơn nhà hàng"}</p>
            <h2 className="mt-1 text-xl font-extrabold text-stone-900">{activeStation === "all" ? "Món nổi bật" : STATION_LABEL[activeStation]}</h2>
          </div>
          <span className="text-sm text-stone-500">{visibleMenuItems.length} món</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleMenuItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
        {visibleMenuItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-orange-200 bg-white px-4 py-10 text-center text-sm text-stone-500">
            Không tìm thấy món phù hợp.
          </div>
        )}
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
        onViewCart={() => router.push(`/cart${tableQuery}`)}
      />
    </main>
  );
}
