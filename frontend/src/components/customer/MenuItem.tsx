"use client";

import Image from "next/image";
import { Utensils } from "lucide-react";
import type { ProductDetailResponse } from "@/lib/types/menu";

interface MenuItemProps {
  item: ProductDetailResponse;
  onClick: () => void;
}

export default function MenuItem({ item, onClick }: MenuItemProps) {
  // Tìm mức giá khởi điểm (giá thấp nhất)
  const displayPrice =
    item.variants && item.variants.length > 0
      ? Math.min(...item.variants.map((v) => v.finalPrice))
      : item.basePrice;

  const hasMultipleSizes = item.variants && item.variants.length > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md active:scale-[0.99]"
    >
      {/* Hình ảnh món ăn */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-orange-50/70 sm:h-28 sm:w-28 flex items-center justify-center">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(min-width: 640px) 112px, 96px"
            className="object-cover transition duration-300 group-hover:scale-105"
            unoptimized={item.imageUrl.startsWith("http")}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-orange-300">
            <Utensils size={32} />
          </div>
        )}

        {/* Mã món nếu có */}
        {item.code && (
          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
            {item.code}
          </div>
        )}
      </div>

      {/* Tên món, mô tả & Giá */}
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-1 text-sm font-bold text-stone-900 group-hover:text-[#b42318] transition">
          {item.name}
        </h2>

        {item.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
            {item.description}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-stone-400 italic">
            Chưa có mô tả
          </p>
        )}

        <div className="mt-2 flex items-baseline gap-1">
          {hasMultipleSizes && (
            <span className="text-[11px] text-stone-400">Từ</span>
          )}
          <span className="text-sm font-extrabold text-[#b42318]">
            {displayPrice.toLocaleString("vi-VN")}₫
          </span>
        </div>
      </div>

      {/* Nút Thêm (+) */}
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b42318] text-lg font-bold text-white shadow-sm shadow-red-200 transition group-hover:bg-[#8f1d15] group-hover:scale-105">
        +
      </span>
    </button>
  );
}
