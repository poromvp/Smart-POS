export interface RestaurantTable {
  id: string;
  name: string;
  status: "empty" | "occupied";
}

interface TableMapProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelectTable: (table: RestaurantTable) => void;
}

export default function TableMap({
  tables,
  selectedTableId,
  onSelectTable,
}: TableMapProps) {
  return (
    <div className="flex h-full min-h-0 flex-col p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sơ đồ bàn</h2>
          <p className="mt-1 text-sm text-slate-500">Chọn bàn đang phục vụ</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Trống</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Có khách</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const isSelected = table.id === selectedTableId;
          const isOccupied = table.status === "occupied";

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable(table)}
              className={`flex aspect-[1.25] flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition ${
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : isOccupied
                    ? "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-400"
                    : "border-emerald-200 bg-emerald-50 text-emerald-950 hover:border-emerald-400"
              }`}
            >
              <span className="text-base font-bold">{table.name}</span>
              <span className={`mt-1 text-xs ${isSelected ? "text-slate-300" : "opacity-70"}`}>
                {isOccupied ? "Đang phục vụ" : "Bàn trống"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
