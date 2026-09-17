"use client";

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
    className: "bg-orange-100 text-orange-700",
  },
  cold: {
    label: "Đồ lạnh",
    className: "bg-sky-100 text-sky-700",
  },
  bar: {
    label: "Đồ uống",
    className: "bg-emerald-100 text-emerald-700",
  },
};

export default function MenuItem({ item, onClick }: MenuItemProps) {
  const station = STATION_CONFIG[item.stationId];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition active:scale-[0.98] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <div
          className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${station.className}`}
        >
          {station.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-base font-semibold text-slate-900">
              {item.name}
            </h2>

            <p className="mt-2 text-lg font-bold text-emerald-600">
              {item.price.toLocaleString("vi-VN")}₫
            </p>
          </div>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl text-white shadow-sm">
            +
          </span>
        </div>
      </div>
    </button>
  );
}