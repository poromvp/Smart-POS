"use client";

import Image from "next/image";

export type StationId = "hot" | "cold" | "bar";

export interface MenuItemData {
  id: string;
  name: string;
  price: number;
  image: string;
  stationId: StationId;
}

interface MenuItemProps {
  item: MenuItemData;
  onClick: () => void;
}

const STATION_CONFIG: Record<
  StationId,
  {
    label: string;
    className: string;
  }
> = {
  hot: {
    label: "Món nóng",
    className: "bg-red-50 text-[#a13223]",
  },
  cold: {
    label: "Đồ lạnh",
    className: "bg-orange-50 text-orange-700",
  },
  bar: {
    label: "Đồ uống",
    className: "bg-amber-50 text-amber-700",
  },
};

export default function MenuItem({ item, onClick }: MenuItemProps) {
  const station = STATION_CONFIG[item.stationId];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-3 text-left shadow-sm transition hover:border-[var(--border)] hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-28 sm:w-28">
        <Image
          src={item.image}
          alt={item.name}
          fill
          loading={item.id === "m1" ? "eager" : "lazy"}
          sizes="(min-width: 640px) 112px, 96px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />

        {/* Subtle station badge */}
        <div
          className={`absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${station.className}`}
        >
          {station.label}
        </div>
      </div>

      {/* Name + Price */}
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 text-sm font-bold text-[var(--foreground)]">
          {item.name}
        </h2>

        <p className="mt-1 text-sm font-extrabold text-[var(--brand)]">
          {item.price.toLocaleString("vi-VN")}₫
        </p>
      </div>

      {/* "+" button */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-lg font-bold text-white shadow-sm transition group-hover:bg-[var(--brand-dark)]">
        +
      </span>
    </button>
  );
}
