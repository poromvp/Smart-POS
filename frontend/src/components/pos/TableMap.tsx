import { Armchair, Users } from "lucide-react";

export type TableStatus = "empty" | "occupied";

export interface RestaurantTable {
  id: string;
  name: string;
  status: TableStatus;
}

export interface TableMapProps {
  tables: RestaurantTable[];
  selectedTableId: string;
  onSelectTable: (table: RestaurantTable) => void;
}

export default function TableMap({ tables, selectedTableId, onSelectTable }: TableMapProps) {
  const occupiedCount = tables.filter((table) => table.status === "occupied").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight lg:text-lg">Sơ đồ bàn</h2>
          <p className="mt-1 text-[13px] text-slate-500 lg:text-sm">Chọn một bàn để xem và thao tác hóa đơn.</p>
        </div>
        <div className="flex gap-2 text-[11px] font-semibold lg:text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-slate-600 lg:px-3">{tables.length - occupiedCount} bàn trống</span>
          <span className="rounded-full bg-orange-50 px-2.5 py-1.5 text-orange-700 lg:px-3">{occupiedCount} đang dùng</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 content-start justify-items-center grid-cols-3 gap-3 overflow-y-auto px-1 pb-1 pr-1 sm:grid-cols-4 sm:gap-4 xl:grid-cols-4 xl:gap-4">
        {tables.map((table) => {
          const isSelected = table.id === selectedTableId;
          const isOccupied = table.status === "occupied";
          const statusLabel = isOccupied ? "Đang dùng" : "Trống";

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table)}
              aria-pressed={isSelected}
              className={`group flex aspect-square w-full max-w-31 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center transition duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 lg:max-w-37 lg:p-3 ${
                isSelected
                  ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200"
                  : isOccupied
                    ? "border-orange-200 bg-orange-50 text-orange-950 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
              }`}
            >
              <Armchair size={20} strokeWidth={2.2} aria-hidden="true" className="lg:size-5.5" />
              <span className="mt-1.5 text-[13px] font-bold lg:mt-2 lg:text-[15px]">{table.name}</span>
              <span className={`mt-0.5 flex items-center gap-1 text-[10px] font-medium lg:mt-1 lg:text-[11px] ${isSelected ? "text-orange-100" : "text-current/65"}`}>
                {isOccupied && <Users size={11} aria-hidden="true" className="lg:size-3" />}
                {statusLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
