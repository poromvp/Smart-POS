"use client";

export type TableStatus = "empty" | "occupied";

export interface RestaurantTable {
  id: string;
  name: string;
  status: TableStatus;
}

interface TableMapProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  onSelectTable: (
    table: RestaurantTable
  ) => void;
}

export default function TableMap({
  tables,
  selectedTableId,
  onSelectTable,
}: TableMapProps) {
  const emptyCount = tables.filter(
    (table) => table.status === "empty"
  ).length;

  const occupiedCount = tables.filter(
    (table) => table.status === "occupied"
  ).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Floor 01
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Sơ đồ bàn
            </h2>
          </div>

          <div className="flex gap-2">
            <div className="rounded-xl bg-emerald-50 px-3 py-2">
              <p className="text-[11px] font-medium text-emerald-600">
                Trống
              </p>

              <p className="text-lg font-bold text-emerald-700">
                {emptyCount}
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-3 py-2">
              <p className="text-[11px] font-medium text-orange-600">
                Có khách
              </p>

              <p className="text-lg font-bold text-orange-700">
                {occupiedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Bàn trống</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-slate-500">Đang phục vụ</span>
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const isOccupied =
              table.status === "occupied";

            const isSelected =
              selectedTableId === table.id;

            return (
              <button
                key={table.id}
                type="button"
                disabled={!isOccupied}
                onClick={() =>
                  onSelectTable(table)
                }
                className={[
                  "group relative min-h-[130px] rounded-2xl border p-4 text-left transition",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                  isOccupied
                    ? "cursor-pointer border-orange-200 bg-orange-50 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                    : "cursor-default border-slate-200 bg-slate-50",
                  isSelected
                    ? "ring-2 ring-emerald-500 ring-offset-2"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  {/* Table Icon */}
                  <div
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-xl text-xl",
                      isOccupied
                        ? "bg-orange-500 text-white"
                        : "bg-emerald-100 text-emerald-700",
                    ].join(" ")}
                  >
                    🍽
                  </div>

                  {/* Status */}
                  <span
                    className={[
                      "h-3 w-3 rounded-full",
                      isOccupied
                        ? "bg-orange-500"
                        : "bg-emerald-500",
                    ].join(" ")}
                  />
                </div>

                <div className="mt-4">
                  <p className="font-bold text-slate-900">
                    {table.name}
                  </p>

                  <p
                    className={[
                      "mt-1 text-xs font-medium",
                      isOccupied
                        ? "text-orange-600"
                        : "text-emerald-600",
                    ].join(" ")}
                  >
                    {isOccupied
                      ? "Đang phục vụ"
                      : "Bàn trống"}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute bottom-3 right-3 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                    ĐANG CHỌN
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}