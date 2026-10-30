"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Printer,
  CalendarClock,
  ThermometerSnowflake,
  UserCheck,
  QrCode,
  Plus,
  Minus,
  Sparkles,
  Check,
} from "lucide-react";

export interface PrepPreset {
  id: string;
  name: string;
  category: "hot" | "cold" | "bar";
  shelfLifeHours: number;
  storage: string;
  batchPrefix: string;
}

const PREP_PRESETS: PrepPreset[] = [
  {
    id: "prep-1",
    name: "Nước dùng xương bò cô đặc",
    category: "hot",
    shelfLifeHours: 24,
    storage: "Tủ mát (2°C - 4°C)",
    batchPrefix: "ND-BO",
  },
  {
    id: "prep-2",
    name: "Thịt bò Mỹ thái lát",
    category: "hot",
    shelfLifeHours: 12,
    storage: "Tủ mát (0°C - 2°C)",
    batchPrefix: "BO-MY",
  },
  {
    id: "prep-3",
    name: "Sốt cay Hàn Quốc pha sẵn",
    category: "hot",
    shelfLifeHours: 72,
    storage: "Tủ mát (2°C - 4°C)",
    batchPrefix: "SOT-HQ",
  },
  {
    id: "prep-4",
    name: "Cá ngừ ngâm dầu đã khui",
    category: "cold",
    shelfLifeHours: 48,
    storage: "Tủ mát (2°C - 4°C)",
    batchPrefix: "CA-NGU",
  },
  {
    id: "prep-5",
    name: "Rau xà lách & Cà chua bi rửa sạch",
    category: "cold",
    shelfLifeHours: 8,
    storage: "Ngăn mát rau củ (4°C - 6°C)",
    batchPrefix: "RAU-SL",
  },
  {
    id: "prep-6",
    name: "Cốt trà đào cam sả ủ lạnh",
    category: "bar",
    shelfLifeHours: 6,
    storage: "Bình giữ lạnh (4°C)",
    batchPrefix: "TRA-DAO",
  },
  {
    id: "prep-7",
    name: "Trân châu đường đen đã luộc",
    category: "bar",
    shelfLifeHours: 4,
    storage: "Nhiệt độ phòng (25°C)",
    batchPrefix: "TC-DEN",
  },
];

const SHELF_LIFE_OPTIONS = [
  { label: "4 giờ", hours: 4 },
  { label: "6 giờ", hours: 6 },
  { label: "8 giờ", hours: 8 },
  { label: "12 giờ", hours: 12 },
  { label: "24 giờ (1 ngày)", hours: 24 },
  { label: "48 giờ (2 ngày)", hours: 48 },
  { label: "72 giờ (3 ngày)", hours: 72 },
];

const STORAGE_OPTIONS = [
  "Tủ mát (2°C - 4°C)",
  "Tủ mát (0°C - 2°C)",
  "Tủ đông (-18°C)",
  "Nhiệt độ phòng (25°C)",
  "Bình giữ lạnh (4°C)",
];

const getRandomSuffix = (min = 100, max = 999) =>
  Math.floor(min + Math.random() * (max - min + 1));

interface ExpiryPrintModalProps {
  isOpen: boolean;
  initialItemName?: string;
  onClose: () => void;
  onPrintSuccess: (itemName: string, copies: number, expiryStr: string) => void;
}

export default function ExpiryPrintModal({
  isOpen,
  initialItemName,
  onClose,
  onPrintSuccess,
}: ExpiryPrintModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PREP_PRESETS[0].id);
  const [customName, setCustomName] = useState<string>(PREP_PRESETS[0].name);
  const [shelfLifeHours, setShelfLifeHours] = useState<number>(
    PREP_PRESETS[0].shelfLifeHours
  );
  const [storageCondition, setStorageCondition] = useState<string>(
    PREP_PRESETS[0].storage
  );
  const [staffName, setStaffName] = useState<string>("Bếp trưởng");
  const [copies, setCopies] = useState<number>(2);
  const [batchCode, setBatchCode] = useState<string>("ND-BO-1019");

  useEffect(() => {
    if (initialItemName) {
      const timer = window.setTimeout(() => {
        setCustomName(initialItemName);
        setSelectedPresetId("custom");
        setShelfLifeHours(6);
        setStorageCondition("Tủ mát (2°C - 4°C)");
        setBatchCode(`LOT-${getRandomSuffix(1000, 9999)}`);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [initialItemName]);

  const handleSelectPreset = (preset: PrepPreset) => {
    setSelectedPresetId(preset.id);
    setCustomName(preset.name);
    setShelfLifeHours(preset.shelfLifeHours);
    setStorageCondition(preset.storage);
    const randomSuffix = getRandomSuffix(100, 999);
    setBatchCode(`${preset.batchPrefix}-${randomSuffix}`);
  };

  const { prepTimeStr, expiryTimeStr, dayDiffLabel } = useMemo(() => {
    const now = new Date();
    const expiry = new Date(now.getTime() + shelfLifeHours * 60 * 60 * 1000);

    const formatDateTime = (d: Date) => {
      const time = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const date = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `${time} - ${date}`;
    };

    const days = Math.floor(shelfLifeHours / 24);
    const remHours = shelfLifeHours % 24;
    const label =
      days > 0
        ? `+${days} ngày${remHours > 0 ? ` ${remHours}h` : ""}`
        : `+${shelfLifeHours} giờ`;

    return {
      prepTimeStr: formatDateTime(now),
      expiryTimeStr: formatDateTime(expiry),
      dayDiffLabel: label,
    };
  }, [shelfLifeHours]);

  if (!isOpen) return null;

  const handleConfirmPrint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onPrintSuccess(customName.trim(), copies, expiryTimeStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-stone-100 bg-orange-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
                In tem hạn sử dụng (Prep & Shelf-Life Label)
              </h2>
              <p className="text-xs text-stone-500">
                Tự động tính thời gian hủy và xuất mẫu tem nhiệt tiêu chuẩn an toàn thực phẩm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmPrint} className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-stone-100">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Chọn nhanh bán thành phẩm / nguyên liệu
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {PREP_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:border-orange-300 hover:bg-orange-50/50"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{preset.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-stone-200/80 text-stone-600"
                        }`}
                      >
                        {preset.shelfLifeHours}h
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Tên nguyên liệu / Bán thành phẩm
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    setSelectedPresetId("custom");
                  }}
                  placeholder="Nhập tên món hoặc nguyên liệu..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Mã lô (Batch)
                </label>
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono font-bold text-stone-800 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Thời hạn sử dụng (Tính từ lúc in)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {SHELF_LIFE_OPTIONS.map((opt) => {
                  const active = shelfLifeHours === opt.hours;
                  return (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setShelfLifeHours(opt.hours)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        active
                          ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500"
                          : "bg-white border-stone-200 text-stone-600 hover:border-orange-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Điều kiện bảo quản
                </label>
                <select
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-medium text-stone-800 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {STORAGE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Người sơ chế / đóng gói
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium text-stone-800 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-sm font-bold text-stone-700">
                Số lượng tem cần in:
              </span>
              <div className="flex items-center gap-3 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-white text-stone-700 hover:text-orange-600 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-extrabold text-stone-900">
                  {copies}
                </span>
                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.min(20, c + 1))}
                  className="w-8 h-8 rounded-lg bg-white text-stone-700 hover:text-orange-600 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-stone-50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Xem trước tem nhiệt (60x40mm)
                </span>
                <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  {dayDiffLabel}
                </span>
              </div>

              <div className="bg-white rounded-2xl border-2 border-stone-800 p-4 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">
                      SMARTPOS KITCHEN
                    </span>
                    <span className="text-xs font-extrabold text-stone-900">
                      TEM HẠN SỬ DỤNG
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-stone-900 text-white px-2 py-0.5 rounded">
                    {batchCode}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase text-stone-400">
                    Bán thành phẩm / Món:
                  </div>
                  <div className="text-base font-black text-stone-900 leading-snug break-words">
                    {customName || "Chưa nhập tên"}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-y border-dashed border-stone-300 py-2.5 my-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-500 flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Giờ sơ chế:
                    </span>
                    <span className="font-mono font-bold text-stone-800">
                      {prepTimeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5">
                    <span className="font-extrabold text-orange-800 uppercase text-[11px]">
                      HẾT HẠN (HỦY):
                    </span>
                    <span className="font-mono font-black text-orange-600 text-xs sm:text-sm">
                      {expiryTimeStr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="space-y-1 text-[11px] text-stone-600">
                    <div className="flex items-center gap-1 font-semibold">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>{storageCondition}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>NV: {staffName}</span>
                    </div>
                  </div>

                  <div className="p-1.5 border border-stone-200 rounded-lg bg-stone-50 shrink-0">
                    <QrCode className="w-9 h-9 text-stone-800" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-sm font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="flex-2 py-3 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In {copies} tem ngay</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}