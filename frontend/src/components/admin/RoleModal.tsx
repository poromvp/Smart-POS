"use client";

import React, { useMemo, useState } from "react";
import {
  CheckSquare,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  Square,
  X,
} from "lucide-react";
import type { PermissionItem, RoleItem } from "@/lib/api";

const MODULE_LABELS: Record<string, string> = {
  USER: "Quản lý Nhân sự",
  ROLE: "Quản lý Vai trò",
  PERMISSION: "Danh mục Quyền",
  MENU: "Thực đơn & Món ăn",
  ORDER: "Đơn hàng, POS & Phục vụ",
  KDS: "Điều phối Bếp (KDS)",
  INVENTORY: "Kho & Nguyên liệu",
  REPORT: "Báo cáo & Quản trị (/admin)",
};

interface RoleFormModalProps {
  isOpen: boolean;
  roleToEdit: RoleItem | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
}

export function RoleFormModal({
  isOpen,
  roleToEdit,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  if (!isOpen) return null;
  return (
    <RoleFormInner
      key={roleToEdit?.id ?? "new-role"}
      roleToEdit={roleToEdit}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function RoleFormInner({
  roleToEdit,
  onClose,
  onSubmit,
}: {
  roleToEdit: RoleItem | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState(roleToEdit?.name || "");
  const [description, setDescription] = useState(roleToEdit?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedPreview = name.trim().toUpperCase().replace(/\s+/g, "_");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!normalizedPreview) {
      setError("Vui lòng nhập mã vai trò (VD: SHIFT_LEAD).");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: normalizedPreview,
        description: description.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu thông tin vai trò."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {roleToEdit ? "Chỉnh sửa vai trò" : "Tạo vai trò tùy chỉnh"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Mã vai trò * (tự động viết hoa)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: SHIFT_LEAD, BARISTA, KITCHEN_LEAD"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            {normalizedPreview && (
              <p className="mt-1 text-[11px] text-gray-500">
                Mã lưu hệ thống:{" "}
                <span className="font-mono font-bold text-orange-700">
                  {normalizedPreview}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Mô tả vai trò
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Trưởng ca kiêm thu ngân và điều phối bếp"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? "Đang lưu..."
                : roleToEdit
                ? "Cập nhật"
                : "Tạo vai trò"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RolePermissionsModalProps {
  isOpen: boolean;
  role: RoleItem | null;
  allPermissions: PermissionItem[];
  assignedPermissions: PermissionItem[];
  canEdit: boolean;
  loadingData: boolean;
  onClose: () => void;
  onSave: (roleId: number, permissionIds: number[]) => Promise<void>;
}

export function RolePermissionsModal({
  isOpen,
  role,
  allPermissions,
  assignedPermissions,
  canEdit,
  loadingData,
  onClose,
  onSave,
}: RolePermissionsModalProps) {
  if (!isOpen || !role) return null;

  const selectionSignature = loadingData
    ? "loading"
    : assignedPermissions
        .map((p) => p.id)
        .sort((a, b) => a - b)
        .join(",");

  return (
    <RolePermissionsInner
      key={`${role.id}:${selectionSignature}`}
      role={role}
      allPermissions={allPermissions}
      assignedPermissions={assignedPermissions}
      canEdit={canEdit}
      loadingData={loadingData}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function RolePermissionsInner({
  role,
  allPermissions,
  assignedPermissions,
  canEdit,
  loadingData,
  onClose,
  onSave,
}: {
  role: RoleItem;
  allPermissions: PermissionItem[];
  assignedPermissions: PermissionItem[];
  canEdit: boolean;
  loadingData: boolean;
  onClose: () => void;
  onSave: (roleId: number, permissionIds: number[]) => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(assignedPermissions.map((p) => p.id))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdminRole = role.name?.toUpperCase() === "ADMIN";
  const effectiveCanEdit = canEdit && !isAdminRole;

  const catalogToDisplay = useMemo(() => {
    const source =
      allPermissions.length > 0 ? allPermissions : assignedPermissions;
    const term = searchQuery.trim().toLowerCase();
    if (!term) return source;
    return source.filter(
      (p) =>
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.module.toLowerCase().includes(term)
    );
  }, [allPermissions, assignedPermissions, searchQuery]);

  const groupedByModule = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const perm of catalogToDisplay) {
      const mod = perm.module || "OTHER";
      const list = map.get(mod) || [];
      list.push(perm);
      map.set(mod, list);
    }
    return Array.from(map.entries());
  }, [catalogToDisplay]);

  const togglePermission = (id: number) => {
    if (!effectiveCanEdit) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleModuleAll = (items: PermissionItem[]) => {
    if (!effectiveCanEdit) return;
    const allChecked = items.every((item) => selectedIds.has(item.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (allChecked) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!effectiveCanEdit) {
      onClose();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(role.id, Array.from(selectedIds));
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lưu danh sách quyền cho vai trò này."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Phân quyền động: {role.name}
                </h2>
                {role.isSystem ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    Hệ thống
                  </span>
                ) : (
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
                    Tùy chỉnh
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {role.description || "Chọn các quyền nghiệp vụ cho vai trò này"} •
                Đã chọn{" "}
                <strong className="text-orange-600">{selectedIds.size}</strong>{" "}
                quyền
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-3 shrink-0 space-y-2.5">
          {isAdminRole && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800">
              <Lock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Vai trò Quản trị viên (ADMIN) luôn giữ toàn quyền hệ thống để đảm bảo an toàn vận hành (chế độ chỉ xem).
              </span>
            </div>
          )}

          {!canEdit && !isAdminRole && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700">
              <Lock className="h-4 w-4 shrink-0 text-slate-500" />
              <span>
                Bạn đang xem danh sách quyền ở chế độ chỉ đọc (yêu cầu quyền ROLE_MANAGE_PERMISSIONS để chỉnh sửa).
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã quyền hoặc mô tả (VD: POS_ACCESS, KDS_VIEW, ORDER_CREATE...)"
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loadingData ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <span>Đang tải ma trận phân quyền...</span>
            </div>
          ) : groupedByModule.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Không tìm thấy quyền phù hợp.
            </div>
          ) : (
            groupedByModule.map(([mod, items]) => {
              const allChecked =
                items.length > 0 && items.every((p) => selectedIds.has(p.id));
              return (
                <div
                  key={mod}
                  className="rounded-2xl border border-gray-200 overflow-hidden"
                >
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                        {MODULE_LABELS[mod] || mod}
                      </span>
                      <span className="ml-2 text-[11px] font-mono text-gray-400">
                        ({mod})
                      </span>
                    </div>

                    {effectiveCanEdit && (
                      <button
                        type="button"
                        onClick={() => toggleModuleAll(items)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                      >
                        {allChecked ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        <span>{allChecked ? "Bỏ chọn nhóm" : "Chọn cả nhóm"}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 bg-white">
                    {items.map((perm) => {
                      const checked = selectedIds.has(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2.5 rounded-xl border p-3 transition-all ${
                            checked
                              ? "border-orange-300 bg-orange-50/50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          } ${
                            effectiveCanEdit
                              ? "cursor-pointer"
                              : "cursor-default opacity-90"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!effectiveCanEdit}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-600 accent-orange-600 focus:ring-orange-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs font-bold text-gray-900 truncate">
                              {perm.code}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                              {perm.name}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/60 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Đóng
          </button>

          {effectiveCanEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingData}
              className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Đang lưu phân quyền..." : "Lưu phân quyền"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
