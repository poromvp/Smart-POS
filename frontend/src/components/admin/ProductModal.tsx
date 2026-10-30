"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Upload, Plus, Trash2, LoaderCircle, AlertCircle, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ProductDetailResponse,
  CategoryResponse,
  ModifierGroupResponse,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductVariantRequest,
} from "@/lib/types/menu";
import { createProduct, updateProduct, uploadProductImage } from "@/lib/api";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductDetailResponse | null;
  categories: CategoryResponse[];
  modifierGroups: ModifierGroupResponse[];
  onSaved: () => void;
}

export default function ProductModal({
  open,
  onClose,
  product,
  categories,
  modifierGroups,
  onSaved,
}: ProductModalProps) {
  if (!open) return null;

  return (
    <ProductModalDialog
      key={product?.id ?? "new"}
      product={product}
      categories={categories}
      modifierGroups={modifierGroups}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface DialogProps {
  product: ProductDetailResponse | null;
  categories: CategoryResponse[];
  modifierGroups: ModifierGroupResponse[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductModalDialog({
  product,
  categories,
  modifierGroups,
  onClose,
  onSaved,
}: DialogProps) {
  const toast = useToast();
  const isEdit = Boolean(product);

  const [categoryId, setCategoryId] = useState<number>(
    product?.categoryId ?? (categories[0]?.id ?? 0)
  );
  const [name, setName] = useState(product?.name ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [basePrice, setBasePrice] = useState<number>(product?.basePrice ?? 0);
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  // Danh sách biến thể size
  const [variants, setVariants] = useState<ProductVariantRequest[]>(
    product?.variants.map((v) => ({
      id: v.id,
      sizeName: v.sizeName,
      priceAdjustment: v.priceAdjustment,
      sku: v.sku ?? "",
    })) ?? []
  );

  // Danh sách ID nhóm tùy chọn đã chọn
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(
    new Set(product?.modifierGroups.map((g) => g.id) ?? [])
  );

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Xử lý upload ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn tệp hình ảnh (.jpg, .png, .webp)");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
      toast.success("Tải ảnh thành công", "Hình ảnh món ăn đã được lưu.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  // Thêm / sửa / xóa dòng size
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sizeName: "",
        priceAdjustment: 0,
        sku: code ? `${code}-S${variants.length + 1}` : "",
      },
    ]);
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariantRequest,
    val: string | number
  ) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: val };
    setVariants(next);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Toggle nhóm Modifier
  const handleToggleGroup = (groupId: number) => {
    const next = new Set(selectedGroupIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedGroupIds(next);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên món ăn không được để trống");
      return;
    }
    if (!categoryId) {
      setError("Vui lòng chọn danh mục cho món");
      return;
    }

    // Validate size names
    for (const v of variants) {
      if (!v.sizeName.trim()) {
        setError("Tên biến thể size không được để trống");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const payload: ProductCreateRequest | ProductUpdateRequest = {
      categoryId,
      name: name.trim(),
      code: code.trim() ? code.trim().toUpperCase() : undefined,
      basePrice,
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      isActive,
      variants: variants.map((v) => ({
        id: v.id,
        sizeName: v.sizeName.trim(),
        priceAdjustment: Number(v.priceAdjustment) || 0,
        sku: v.sku?.trim() ? v.sku.trim().toUpperCase() : undefined,
      })),
      modifierGroupIds: Array.from(selectedGroupIds),
    };

    try {
      if (isEdit && product) {
        await updateProduct(product.id, payload as ProductUpdateRequest);
        toast.success("Cập nhật thành công", `Món '${name}' đã được lưu.`);
      } else {
        await createProduct(payload as ProductCreateRequest);
        toast.success("Tạo món thành công", `Món '${name}' đã được thêm vào thực đơn.`);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi lưu thông tin món");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? `Chỉnh sửa: ${product?.name}` : "Thêm món ăn mới"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cấu hình thông tin cơ bản, biến thể size và các nhóm topping đi kèm
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Hàng 1: Ảnh đại diện + Thông tin chính */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cột tải ảnh */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Hình ảnh món
              </label>
              <div className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center group hover:border-orange-400 transition-colors">
                {imageUrl ? (
                  <>
                    <Image
                      src={imageUrl}
                      alt="Ảnh món"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="px-3 py-1.5 bg-white text-gray-800 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-gray-50">
                        Đổi ảnh
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 cursor-pointer text-center">
                    {uploading ? (
                      <LoaderCircle className="w-8 h-8 text-orange-500 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2 group-hover:text-orange-500 transition-colors" />
                        <span className="text-xs font-semibold text-gray-600">Tải ảnh lên</span>
                        <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP tối đa 10MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Cột thông tin cơ bản */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Danh mục món <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Mã món ăn (SKU)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: MC-BO, NU-TRA-DAO"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium uppercase focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Tên món ăn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Mì Cay Bò Mỹ, Trà Đào Cam Sả"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Giá bán gốc (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="relative flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      {isActive ? "Đang kinh doanh" : "Tạm ngưng phục vụ"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Mô tả món ăn
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thành phần nổi bật, hương vị đặc trưng..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Phần 2: Biến thể Size */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Biến thể Size / Khẩu phần</h3>
                <p className="text-xs text-gray-400">
                  Thêm các size (Size M, Size L) hoặc cấp độ cay đi kèm phụ thu giá.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Size</span>
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-xs text-gray-400">
                Món ăn này chưa có biến thể size (mặc định bán theo giá gốc).
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={v.sizeName}
                        onChange={(e) => handleUpdateVariant(idx, "sizeName", e.target.value)}
                        placeholder="Tên size (VD: Size L, Cấp 7)"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div className="w-36">
                      <div className="relative">
                        <input
                          type="number"
                          step="1000"
                          value={v.priceAdjustment}
                          onChange={(e) =>
                            handleUpdateVariant(idx, "priceAdjustment", Number(e.target.value))
                          }
                          placeholder="+0"
                          className="w-full pl-3 pr-7 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none text-right"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-semibold">
                          đ
                        </span>
                      </div>
                    </div>
                    <div className="w-32">
                      <input
                        type="text"
                        value={v.sku ?? ""}
                        onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                        placeholder="SKU size"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium uppercase focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Xóa size"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phần 3: Gắn nhóm Topping / Tùy chọn */}
          <div className="pt-4 border-t border-gray-100">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-gray-800">Nhóm Tùy Chọn & Topping Áp Dụng</h3>
              <p className="text-xs text-gray-400">
                Chọn các nhóm topping khách hàng được phép gọi kèm khi chọn món ăn này.
              </p>
            </div>

            {modifierGroups.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-xs text-gray-400">
                Chưa có nhóm tùy chọn nào trong hệ thống.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modifierGroups.map((g) => {
                  const isChecked = selectedGroupIds.has(g.id);
                  return (
                    <label
                      key={g.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-orange-50/60 border-orange-300"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleGroup(g.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900">{g.name}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {g.options.map((o) => o.name).join(", ") || "(chưa có options)"}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-gray-400">
                          {g.isMultiple ? "Chọn nhiều" : "Chọn 1"} •{" "}
                          {g.isRequired ? "Bắt buộc" : "Không bắt buộc"}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs shadow-orange-500/25 disabled:opacity-50 cursor-pointer"
          >
            {submitting && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
            <span>{submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo món ăn"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
