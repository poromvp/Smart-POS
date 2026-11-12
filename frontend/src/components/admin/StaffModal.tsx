"use client";

import React, { useState } from "react";
import { X, UserPlus, KeyRound, Shield } from "lucide-react";
import { RoleItem, UserSummary } from "@/lib/api";

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleItem[];
  onSubmit: (data: {
    username: string;
    password: string;
    fullName: string;
    phone: string;
    roleId: number;
  }) => Promise<void>;
}

export function CreateStaffModal({
  isOpen,
  onClose,
  roles,
  onSubmit,
}: CreateStaffModalProps) {
  if (!isOpen) return null;
  return (
    <CreateStaffModalInner
      roles={roles}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function CreateStaffModalInner({
  onClose,
  roles,
  onSubmit,
}: Omit<CreateStaffModalProps, "isOpen">) {
  const defaultRoleId =
    roles.find((r) => r.name !== "ADMIN")?.id || roles[0]?.id || 1;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<number>(defaultRoleId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password.trim() || !fullName.trim() || !phone.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu khởi tạo phải có tối thiểu 8 ký tự.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        roleId: Number(roleId),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Thêm nhân viên mới</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: cashier03, chef03, shiftlead01"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mật khẩu khởi tạo * (tối thiểu 8 ký tự)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu khởi tạo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Số điện thoại * (10 số, bắt đầu bằng 0)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="VD: 0912345678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Vai trò chính *
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} - {r.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang tạo..." : "Tạo nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditRoleModalProps {
  user: UserSummary | null;
  isOpen: boolean;
  onClose: () => void;
  roles: RoleItem[];
  onSubmit: (userId: number, roleId: number) => Promise<void>;
}

export function EditRoleModal({
  user,
  isOpen,
  onClose,
  roles,
  onSubmit,
}: EditRoleModalProps) {
  if (!isOpen || !user) return null;
  return (
    <EditRoleModalInner
      key={user.id}
      user={user}
      roles={roles}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function EditRoleModalInner({
  user,
  onClose,
  roles,
  onSubmit,
}: {
  user: UserSummary;
  onClose: () => void;
  roles: RoleItem[];
  onSubmit: (userId: number, roleId: number) => Promise<void>;
}) {
  const matchedRoleId =
    roles.find((r) => r.name === user.roleName)?.id ||
    roles.find((r) => r.name !== "ADMIN")?.id ||
    roles[0]?.id ||
    1;

  const [selectedRoleId, setSelectedRoleId] = useState<number>(matchedRoleId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTargetAdmin = user.roleName?.toUpperCase() === "ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(user.id, Number(selectedRoleId));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật vai trò.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Đổi vai trò</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Thay đổi vai trò cho tài khoản{" "}
            <strong className="text-gray-900">{user.fullName}</strong> ({user.username}):
          </p>

          {isTargetAdmin ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
              Tài khoản Quản trị viên (ADMIN) được bảo vệ, không thể chuyển sang vai trò khác.
            </div>
          ) : (
            <div>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                {roles
                  .filter((r) => r.name.toUpperCase() !== "ADMIN")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Đóng
            </button>
            {!isTargetAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang lưu..." : "Cập nhật"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResetPasswordModalProps {
  user: UserSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: number, newPassword: string) => Promise<void>;
}

export function ResetPasswordModal({
  user,
  isOpen,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  if (!isOpen || !user) return null;
  return (
    <ResetPasswordModalInner
      key={user.id}
      user={user}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function ResetPasswordModalInner({
  user,
  onClose,
  onSubmit,
}: {
  user: UserSummary;
  onClose: () => void;
  onSubmit: (userId: number, newPassword: string) => Promise<void>;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(user.id, newPassword);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Đặt lại mật khẩu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Đặt lại mật khẩu cho tài khoản{" "}
            <strong className="text-gray-900">{user.username}</strong>:
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đặt lại"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
