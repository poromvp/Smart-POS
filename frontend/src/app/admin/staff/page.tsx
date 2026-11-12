"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Plus,
  Save,
  RefreshCw,
  Printer,
  KeyRound,
  Lock,
  Unlock,
  Shield,
  Pencil,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import {
  fetchUsers,
  fetchRoles,
  fetchPermissions,
  fetchRolePermissions,
  createUser,
  updateUserRole,
  updateUserStatus,
  adminResetPassword,
  createRole,
  updateRole,
  deleteRole,
  replaceRolePermissions,
  UserSummary,
  RoleItem,
  PermissionItem,
} from "@/lib/api";
import {
  CreateStaffModal,
  EditRoleModal,
  ResetPasswordModal,
} from "@/components/admin/StaffModal";
import {
  RoleFormModal,
  RolePermissionsModal,
} from "@/components/admin/RoleModal";

type StaffTab = "staff" | "roles" | "branches" | "qr";

export default function StaffBranchesQrPage() {
  const toast = useToast();
  const { hasRole, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<StaffTab>("staff");
  const [searchStaff, setSearchStaff] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Real backend staff, roles & permissions state
  const [staffList, setStaffList] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] =
    useState<UserSummary | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] =
    useState<UserSummary | null>(null);

  // Role & Permissions Modals state
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleItem | null>(null);
  const [roleForPermissions, setRoleForPermissions] =
    useState<RoleItem | null>(null);
  const [assignedRolePermissions, setAssignedRolePermissions] = useState<
    PermissionItem[]
  >([]);
  const [loadingPermissionsModal, setLoadingPermissionsModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // Branch & QR configurations
  const [configBranch, setConfigBranch] = useState("Chi nhánh 01");
  const [branchAddress, setBranchAddress] = useState(
    "123 Nguyễn Huệ, Quận 1, TP.HCM"
  );
  const [selectedArea, setSelectedArea] = useState("Tầng 1");
  const [selectedTable, setSelectedTable] = useState("Bàn 1");
  const [publicAppUrl, setPublicAppUrl] = useState(
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "")
  );

  // Permission capabilities
  const canCreateUser = hasRole("ADMIN") || hasPermission("USER_CREATE");
  const canAssignRole = hasRole("ADMIN") || hasPermission("USER_ASSIGN_ROLE");
  const canResetPassword =
    hasRole("ADMIN") || hasPermission("USER_RESET_PASSWORD");
  const canManageStatus =
    hasRole("ADMIN") || hasPermission("USER_MANAGE_STATUS");

  const canViewRolesTab = hasRole("ADMIN") || hasPermission("ROLE_READ");
  const canCreateRole = hasRole("ADMIN") || hasPermission("ROLE_CREATE");
  const canUpdateRole = hasRole("ADMIN") || hasPermission("ROLE_UPDATE");
  const canDeleteRole = hasRole("ADMIN") || hasPermission("ROLE_DELETE");
  const canReadCatalogPerms =
    hasRole("ADMIN") || hasPermission("PERMISSION_READ");
  const canManageRolePerms =
    hasRole("ADMIN") ||
    (hasPermission("ROLE_MANAGE_PERMISSIONS") && canReadCatalogPerms);

  const fetchStaffAndRoles = useCallback(async () => {
    const usersPromise =
      hasRole("ADMIN") || hasPermission("USER_READ")
        ? fetchUsers(0, 100)
        : Promise.resolve({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 100,
            number: 0,
          });
    const rolesPromise =
      hasRole("ADMIN") || hasPermission("ROLE_READ")
        ? fetchRoles(0, 50)
        : Promise.resolve({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 50,
            number: 0,
          });
    const permsPromise = canReadCatalogPerms
      ? fetchPermissions()
      : Promise.resolve([]);

    return Promise.all([usersPromise, rolesPromise, permsPromise]);
  }, [hasRole, hasPermission, canReadCatalogPerms]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersPage, rolesPage, permsList] = await fetchStaffAndRoles();

      setStaffList(usersPage.content || []);
      setRoles(rolesPage.content || []);
      setAllPermissions(permsList || []);
    } catch (err: unknown) {
      toast.error(
        "Lỗi tải dữ liệu nhân viên",
        err instanceof Error ? err.message : "Không thể kết nối đến máy chủ"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchStaffAndRoles, toast]);

  useEffect(() => {
    let active = true;
    fetchStaffAndRoles()
      .then(([usersPage, rolesPage, permsList]) => {
        if (!active) return;
        setStaffList(usersPage.content || []);
        setRoles(rolesPage.content || []);
        setAllPermissions(permsList || []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        toast.error(
          "Lỗi tải dữ liệu nhân viên",
          err instanceof Error ? err.message : "Không thể kết nối đến máy chủ"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchStaffAndRoles, toast]);

  // ==================== STAFF HANDLERS ====================
  const handleCreateStaff = async (data: {
    username: string;
    password: string;
    fullName: string;
    phone: string;
    roleId: number;
  }) => {
    await createUser(data);
    toast.success("Thành công", `Đã tạo tài khoản nhân viên ${data.username}`);
    await loadData();
  };

  const handleUpdateRole = async (userId: number, roleId: number) => {
    await updateUserRole(userId, roleId);
    toast.success("Thành công", "Đã cập nhật vai trò mới cho nhân viên");
    await loadData();
  };

  const handleToggleStatus = async (user: UserSummary) => {
    try {
      const newStatus = !user.active;
      await updateUserStatus(user.id, newStatus);
      toast.success(
        "Thành công",
        `Đã ${newStatus ? "kích hoạt" : "tạm khóa"} tài khoản ${user.username}`
      );
      await loadData();
    } catch (err: unknown) {
      toast.error(
        "Lỗi thay đổi trạng thái",
        err instanceof Error ? err.message : "Thao tác thất bại"
      );
    }
  };

  const handleResetPassword = async (userId: number, newPass: string) => {
    await adminResetPassword(userId, newPass);
    toast.success("Thành công", "Đã đặt lại mật khẩu mới cho nhân viên");
  };

  // ==================== ROLE & PERMISSION HANDLERS ====================
  const handleSubmitRoleForm = async (data: {
    name: string;
    description: string;
  }) => {
    if (roleToEdit) {
      await updateRole(roleToEdit.id, data);
      toast.success("Thành công", `Đã cập nhật vai trò ${data.name}`);
    } else {
      await createRole(data);
      toast.success("Thành công", `Đã tạo vai trò mới ${data.name}`);
    }
    await loadData();
  };

  const handleOpenPermissionsModal = async (role: RoleItem) => {
    setRoleForPermissions(role);
    setLoadingPermissionsModal(true);
    setAssignedRolePermissions([]);
    try {
      const [rolePerms, catalogPerms] = await Promise.all([
        fetchRolePermissions(role.id),
        allPermissions.length === 0 && canReadCatalogPerms
          ? fetchPermissions()
          : Promise.resolve(allPermissions),
      ]);
      setAssignedRolePermissions(rolePerms || []);
      if (catalogPerms && catalogPerms.length > 0 && allPermissions.length === 0) {
        setAllPermissions(catalogPerms);
      }
    } catch (err: unknown) {
      toast.error(
        "Lỗi tải phân quyền",
        err instanceof Error ? err.message : "Không thể tải danh sách quyền của vai trò"
      );
    } finally {
      setLoadingPermissionsModal(false);
    }
  };

  const handleSaveRolePermissions = async (
    roleId: number,
    permissionIds: number[]
  ) => {
    await replaceRolePermissions(roleId, permissionIds);
    toast.success(
      "Đã lưu phân quyền động",
      "Các tài khoản giữ vai trò này sẽ áp dụng quyền mới khi đăng nhập hoặc làm mới token."
    );
    await loadData();
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeletingRole(true);
    try {
      await deleteRole(roleToDelete.id);
      toast.success("Đã xóa vai trò", `Vai trò ${roleToDelete.name} đã bị xóa.`);
      setRoleToDelete(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(
        "Không thể xóa vai trò",
        err instanceof Error ? err.message : "Thao tác thất bại"
      );
    } finally {
      setDeletingRole(false);
    }
  };

  // ==================== QR HELPERS ====================
  const guestMenuUrl = useMemo(() => {
    const appUrl = (
      publicAppUrl ||
      (typeof window !== "undefined" ? window.location.origin : "")
    ).replace(/\/$/, "");
    const tableId = selectedTable.replace(/^bàn\s+/i, "").trim();

    return appUrl
      ? `${appUrl}/menu?table=${encodeURIComponent(tableId)}`
      : "";
  }, [publicAppUrl, selectedTable]);

  const handlePrintQr = () => {
    if (!guestMenuUrl) {
      toast.error(
        "Thiếu địa chỉ frontend",
        "Nhập URL dạng http://192.168.x.x:3000 trước khi in mã QR."
      );
      return;
    }

    const printWindow = window.open("", "_blank", "width=600,height=720");
    if (!printWindow) {
      toast.error(
        "Không thể mở cửa sổ in",
        "Vui lòng cho phép popup rồi thử lại."
      );
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <title>Mã QR ${selectedTable}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 32px; }
            svg { width: 280px; height: 280px; }
            h1 { margin-bottom: 8px; }
            p { color: #555; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>Smart POS</h1>
          <h2>${selectedTable}</h2>
          <div id="qr"></div>
          <p>${guestMenuUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();

    const qrElement = document.querySelector("[data-qr-preview]");
    const printQrContainer = printWindow.document.getElementById("qr");
    if (qrElement && printQrContainer) {
      printQrContainer.innerHTML = qrElement.innerHTML;
    }
    printWindow.focus();
    printWindow.print();
  };

  const filteredStaff = staffList.filter((emp) => {
    const term = searchStaff.toLowerCase();
    const matchesName =
      emp.fullName?.toLowerCase().includes(term) ||
      emp.username?.toLowerCase().includes(term) ||
      emp.phone?.includes(term);
    const matchesRole =
      roleFilter === "all" ||
      emp.roleName?.toUpperCase().replace(/^ROLE_/, "") ===
        roleFilter.toUpperCase().replace(/^ROLE_/, "");
    return matchesName && matchesRole;
  });

  const tabs: { id: StaffTab; label: string; visible: boolean }[] = [
    { id: "staff", label: "Nhân sự", visible: true },
    {
      id: "roles",
      label: "Vai trò & Phân quyền",
      visible: canViewRolesTab,
    },
    { id: "branches", label: "Chi nhánh", visible: true },
    { id: "qr", label: "Bàn & mã QR", visible: true },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {tabs
          .filter((tab) => tab.visible)
          .map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? "bg-orange-600 text-white border-orange-600 shadow-xs shadow-orange-500/20"
                    : "bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
      </div>

      {activeTab === "staff" && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                placeholder="Tìm nhân viên theo tên, username hoặc số điện thoại..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tất cả vai trò</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.description})
                  </option>
                ))}
              </select>

              {canCreateUser && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Thêm nhân viên</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                  <th className="py-3.5 px-6">Nhân viên</th>
                  <th className="py-3.5 px-6">Tài khoản</th>
                  <th className="py-3.5 px-6">Vai trò</th>
                  <th className="py-3.5 px-6">Số điện thoại</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                        <span>Đang nạp danh sách nhân viên từ CSDL...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Không tìm thấy nhân viên nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-orange-50/25 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {emp.fullName}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-600">
                        {emp.username}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                          {emp.roleName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-medium">
                        {emp.phone || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge
                          label={emp.active ? "Hoạt động" : "Tạm khóa"}
                          variant={emp.active ? "success" : "danger"}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {canAssignRole && (
                            <button
                              type="button"
                              onClick={() => setSelectedUserForRole(emp)}
                              title="Đổi vai trò"
                              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold text-xs cursor-pointer p-1.5 rounded-lg hover:bg-orange-50"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>Vai trò</span>
                            </button>
                          )}

                          {canResetPassword && (
                            <button
                              type="button"
                              onClick={() => setSelectedUserForPassword(emp)}
                              title="Đặt lại mật khẩu"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs cursor-pointer p-1.5 rounded-lg hover:bg-blue-50"
                            >
                              <KeyRound className="w-4 h-4" />
                              <span>Mật khẩu</span>
                            </button>
                          )}

                          {canManageStatus && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(emp)}
                              title={
                                emp.active
                                  ? "Khóa tài khoản"
                                  : "Mở khóa tài khoản"
                              }
                              className={`inline-flex items-center gap-1 font-semibold text-xs cursor-pointer p-1.5 rounded-lg ${
                                emp.active
                                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {emp.active ? (
                                <>
                                  <Lock className="w-4 h-4" />
                                  <span>Khóa</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4" />
                                  <span>Mở</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "roles" && canViewRolesTab && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Danh sách Vai trò &amp; Ma trận Phân quyền Động
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tạo vai trò tùy chỉnh (VD:{" "}
                <span className="font-mono font-semibold">SHIFT_LEAD</span>) và
                chọn các quyền hạt nhân cho từng vai trò.
              </p>
            </div>

            {canCreateRole && (
              <button
                type="button"
                onClick={() => {
                  setRoleToEdit(null);
                  setIsRoleFormOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo vai trò mới</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                  <th className="py-3.5 px-6">Mã vai trò</th>
                  <th className="py-3.5 px-6">Mô tả</th>
                  <th className="py-3.5 px-6">Phân loại</th>
                  <th className="py-3.5 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      Đang tải danh sách vai trò...
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      Chưa có vai trò nào.
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-orange-50/25 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-orange-600" />
                          <span className="font-mono font-bold text-gray-900">
                            {role.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {role.description || "—"}
                      </td>
                      <td className="py-4 px-6">
                        {role.isSystem ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            Hệ thống
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            Tùy chỉnh
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(role)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>
                              {canManageRolePerms && role.name !== "ADMIN"
                                ? "Cấu hình quyền"
                                : "Xem quyền"}
                            </span>
                          </button>

                          {!role.isSystem && canUpdateRole && (
                            <button
                              type="button"
                              onClick={() => {
                                setRoleToEdit(role);
                                setIsRoleFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                          )}

                          {!role.isSystem && canDeleteRole && (
                            <button
                              type="button"
                              onClick={() => setRoleToDelete(role)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "branches" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-5 max-w-2xl">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Cấu hình chi nhánh
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Chi nhánh
              </label>
              <select
                value={configBranch}
                onChange={(e) => setConfigBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                <option value="Chi nhánh 01">Chi nhánh 01</option>
                <option value="Chi nhánh 02">Chi nhánh 02</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Địa chỉ
              </label>
              <input
                type="text"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
                placeholder="Địa chỉ chi nhánh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                toast.info("Thêm chi nhánh", "Nhập thông tin chi nhánh mới.")
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm chi nhánh
            </button>

            <button
              type="button"
              onClick={() =>
                toast.success(
                  "Đã lưu cấu hình chi nhánh",
                  `${configBranch} - ${branchAddress}`
                )
              }
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu
            </button>
          </div>
        </div>
      )}

      {activeTab === "qr" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5 max-w-3xl">
          <h3 className="text-base font-bold text-gray-900">
            Bàn &amp; mã QR gọi món
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Địa chỉ frontend cho điện thoại
                </label>
                <input
                  type="url"
                  value={publicAppUrl}
                  onChange={(event) => setPublicAppUrl(event.target.value)}
                  placeholder="http://192.168.1.10:3000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Không dùng localhost khi quét bằng điện thoại. Hai thiết bị phải cùng Wi-Fi.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Khu vực
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  <option value="Tầng 1">Tầng 1</option>
                  <option value="Tầng 2">Tầng 2</option>
                  <option value="Khu VIP">Khu VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Bàn
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  {Array.from({ length: 20 }, (_, i) => {
                    const num = i + 1;
                    return (
                      <option key={num} value={`Bàn ${num}`}>
                        Bàn {num}
                      </option>
                    );
                  })}
                </select>
              </div>

              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Mã QR hoạt động - quét để gọi món
              </p>
            </div>

            <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50/50 border-2 border-dashed border-orange-200 aspect-square max-w-[160px] mx-auto w-full">
              {guestMenuUrl ? (
                <div data-qr-preview className="rounded-lg bg-white p-2">
                  <QRCodeSVG
                    value={guestMenuUrl}
                    size={128}
                    level="M"
                    includeMargin
                    title={`Mã QR gọi món ${selectedTable}`}
                  />
                </div>
              ) : (
                <div className="flex h-[144px] w-[144px] items-center justify-center rounded-lg bg-amber-50 p-3 text-center text-xs font-semibold text-amber-700">
                  Nhập địa chỉ frontend để tạo QR
                </div>
              )}
              <span className="text-xs font-bold text-gray-700">
                {selectedTable}
              </span>
              <span className="mt-1 max-w-full truncate text-[10px] text-gray-500">
                {guestMenuUrl}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                toast.info(
                  "Mã QR đã sẵn sàng",
                  "Mã này mở đúng menu của bàn đã chọn."
                );
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 text-sm font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới QR
            </button>

            <button
              type="button"
              onClick={handlePrintQr}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In mã QR
            </button>
            <button
              type="button"
              onClick={() =>
                window.open(guestMenuUrl, "_blank", "noopener,noreferrer")
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold transition-colors hover:bg-orange-100 cursor-pointer"
            >
              Mở trang gọi món
            </button>
          </div>
        </div>
      )}

      {/* Staff Modals */}
      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        roles={roles}
        onSubmit={handleCreateStaff}
      />

      <EditRoleModal
        user={selectedUserForRole}
        isOpen={selectedUserForRole !== null}
        onClose={() => setSelectedUserForRole(null)}
        roles={roles}
        onSubmit={handleUpdateRole}
      />

      <ResetPasswordModal
        user={selectedUserForPassword}
        isOpen={selectedUserForPassword !== null}
        onClose={() => setSelectedUserForPassword(null)}
        onSubmit={handleResetPassword}
      />

      {/* Role & Dynamic Permissions Modals */}
      <RoleFormModal
        isOpen={isRoleFormOpen}
        roleToEdit={roleToEdit}
        onClose={() => {
          setIsRoleFormOpen(false);
          setRoleToEdit(null);
        }}
        onSubmit={handleSubmitRoleForm}
      />

      <RolePermissionsModal
        isOpen={roleForPermissions !== null}
        role={roleForPermissions}
        allPermissions={allPermissions}
        assignedPermissions={assignedRolePermissions}
        canEdit={canManageRolePerms}
        loadingData={loadingPermissionsModal}
        onClose={() => setRoleForPermissions(null)}
        onSave={handleSaveRolePermissions}
      />

      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Xác nhận xóa vai trò
            </h3>
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa vai trò{" "}
              <strong className="font-mono text-gray-900">
                {roleToDelete.name}
              </strong>
              ? (Chỉ xóa được khi không còn nhân viên nào giữ vai trò này).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRole}
                disabled={deletingRole}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deletingRole ? "Đang xóa..." : "Xóa vai trò"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
