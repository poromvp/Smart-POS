"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  Tag,
  Sliders,
  CheckCircle2,
  XCircle,
  ImageIcon,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import StatCard from "@/components/ui/StatCard";
import ProductModal from "@/components/admin/ProductModal";
import CategoryModal from "@/components/admin/CategoryModal";
import ModifierGroupModal from "@/components/admin/ModifierGroupModal";
import {
  CategoryResponse,
  ModifierGroupResponse,
  ProductDetailResponse,
} from "@/lib/types/menu";
import { ProductSummaryResponse } from "@/lib/types/inventory";
import {
  fetchProducts,
  fetchProductDetail,
  fetchCategories,
  fetchModifierGroups,
  toggleProductStatus,
  deleteProduct,
} from "@/lib/api";

export default function AdminProductsPage() {
  const toast = useToast();

  const [products, setProducts] = useState<ProductSummaryResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Tải dữ liệu từ backend khi thao tác lại
  const reloadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, groups] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchModifierGroups(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setModifierGroups(groups);
    } catch (err: unknown) {
      toast.error("Lỗi tải dữ liệu", err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Nạp dữ liệu ban đầu
  useEffect(() => {
    let ignore = false;
    Promise.all([fetchProducts(), fetchCategories(), fetchModifierGroups()])
      .then(([prods, cats, groups]) => {
        if (!ignore) {
          setProducts(prods);
          setCategories(cats);
          setModifierGroups(groups);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          toast.error("Lỗi tải dữ liệu", err instanceof Error ? err.message : "Lỗi kết nối");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [toast]);

  // Thống kê nhanh
  const totalCount = products.length;
  const activeCount = useMemo(() => products.filter((p) => p.isActive).length, [products]);
  const inactiveCount = totalCount - activeCount;

  // Lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Tìm kiếm theo tên hoặc mã
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchCode = p.code ? p.code.toLowerCase().includes(query) : false;
        if (!matchName && !matchCode) return false;
      }

      // Lọc danh mục
      if (selectedCategoryId !== "all" && p.categoryId !== selectedCategoryId) {
        return false;
      }

      // Lọc trạng thái
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;

      return true;
    });
  }, [products, searchTerm, selectedCategoryId, statusFilter]);

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Mở modal sửa món
  const handleOpenEdit = async (productId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await fetchProductDetail(productId);
      setEditingProduct(detail);
      setIsProductModalOpen(true);
    } catch (err: unknown) {
      toast.error("Không thể tải chi tiết món", err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Toggle trạng thái
  const handleToggleStatus = async (p: ProductSummaryResponse) => {
    const nextStatus = !p.isActive;
    try {
      await toggleProductStatus(p.id, nextStatus);
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, isActive: nextStatus } : item))
      );
      toast.success(
        nextStatus ? "Đã mở kinh doanh" : "Đã tạm ngưng món",
        `Món '${p.name}' ${nextStatus ? "đang phục vụ" : "tạm ngưng"}.`
      );
    } catch (err: unknown) {
      toast.error("Cập nhật trạng thái thất bại", err instanceof Error ? err.message : "Lỗi");
    }
  };

  // Xóa món ăn
  const handleDeleteProduct = async (p: ProductSummaryResponse) => {
    if (!window.confirm(`Bạn có chắc muốn xóa món '${p.name}' khỏi thực đơn?`)) return;

    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      toast.success("Xóa thành công", `Món '${p.name}' đã được xóa.`);
    } catch (err: unknown) {
      toast.error("Không thể xóa món ăn", err instanceof Error ? err.message : "Lỗi ràng buộc");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header & Thống kê */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
                <span>Quản Lý Món Ăn & Thực Đơn</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Tạo mới, chỉnh sửa thông tin, giá bán, biến thể size và nhóm tùy chọn
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-gray-500" />
                <span>Danh mục ({categories.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModifierModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-gray-500" />
                <span>Topping ({modifierGroups.length})</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition shadow-xs shadow-orange-500/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Món Mới</span>
              </button>
            </div>
          </div>

          {/* Cards Thống kê */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Tổng số món ăn" value={String(totalCount)} icon={UtensilsCrossed} />
            <StatCard label="Đang phục vụ" value={String(activeCount)} icon={CheckCircle2} />
            <StatCard
              label="Tạm ngưng bán"
              value={String(inactiveCount)}
              icon={XCircle}
              isWarning={inactiveCount > 0}
            />
          </div>

          {/* Thanh lọc & tìm kiếm */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên món hoặc mã SKU..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang kinh doanh</option>
                  <option value="inactive">Tạm ngưng phục vụ</option>
                </select>
              </div>
            </div>

            {/* Pills danh mục */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategoryId === "all"
                    ? "bg-orange-600 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Tất cả ({products.length})
              </button>
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                const isSelected = selectedCategoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(c.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-orange-600 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bảng danh sách món ăn */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                <LoaderCircle className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-xs font-medium">Đang tải danh sách món ăn...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <UtensilsCrossed className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">Không tìm thấy món ăn nào</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc danh mục</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                      <th className="px-6 py-3.5 w-16 text-center">Ảnh</th>
                      <th className="px-4 py-3.5">Món ăn</th>
                      <th className="px-4 py-3.5">Danh mục</th>
                      <th className="px-4 py-3.5 text-right">Giá gốc</th>
                      <th className="px-4 py-3.5 text-center">Trạng thái</th>
                      <th className="px-6 py-3.5 text-right w-44">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((p) => {
                      return (
                        <tr key={p.id} className="hover:bg-orange-50/20 transition-colors">
                          {/* Cột ảnh */}
                          <td className="px-6 py-3 text-center">
                            <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 mx-auto flex items-center justify-center">
                              {p.imageUrl ? (
                                <Image
                                  src={p.imageUrl}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </td>

                          {/* Cột tên & SKU */}
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                            {p.code && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 mt-0.5">
                                {p.code}
                              </span>
                            )}
                          </td>

                          {/* Cột danh mục */}
                          <td className="px-4 py-3">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                              {p.categoryName}
                            </span>
                          </td>

                          {/* Cột giá gốc */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-gray-900 text-sm">
                              {p.basePrice.toLocaleString("vi-VN")} đ
                            </span>
                          </td>

                          {/* Cột Switch trạng thái */}
                          <td className="px-4 py-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={p.isActive}
                                onChange={() => handleToggleStatus(p)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                            </label>
                          </td>

                          {/* Cột hành động */}
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Shortcut sang Định lượng BOM */}
                              <Link
                                href={`/admin/menu-bom`}
                                title="Cấu hình công thức định lượng (BOM)"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition border border-orange-200"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>BOM</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(p.id)}
                                disabled={loadingDetail}
                                title="Chỉnh sửa món ăn"
                                className="p-1.5 text-gray-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                title="Xóa món ăn"
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {/* Modals */}
      <ProductModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        categories={categories}
        modifierGroups={modifierGroups}
        onSaved={reloadData}
      />

      <CategoryModal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onChanged={reloadData}
      />

      <ModifierGroupModal
        open={isModifierModalOpen}
        onClose={() => setIsModifierModalOpen(false)}
        groups={modifierGroups}
        onChanged={reloadData}
      />
    </div>
  );
}
