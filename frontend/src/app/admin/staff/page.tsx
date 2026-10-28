"use client";

import React, { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Plus,
  Save,
  QrCode,
  RefreshCw,
  Printer,
} from "lucide-react";

type StaffTab = "staff" | "branches" | "qr";

interface Employee {
  id: string;
  name: string;
  role: string;
  branch: string;
  status: string;
}

const INITIAL_STAFF: Employee[] = [
  {
    id: "emp-1",
    name: "Nguyễn An",
    role: "Quản lý",
    branch: "Chi nhánh 01",
    status: "Hoạt động",
  },
  {
    id: "emp-2",
    name: "Trần Bình",
    role: "Thu ngân",
    branch: "Chi nhánh 01",
    status: "Hoạt động",
  },
  {
    id: "emp-3",
    name: "Lê Hoàng",
    role: "Bếp trưởng",
    branch: "Chi nhánh 01",
    status: "Hoạt động",
  },
];

export default function StaffBranchesQrPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<StaffTab>("staff");
  const [searchStaff, setSearchStaff] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const [configBranch, setConfigBranch] = useState("Chi nhánh 01");
  const [branchAddress, setBranchAddress] = useState(
    "123 Nguyễn Huệ, Quận 1, TP.HCM"
  );

  const [selectedArea, setSelectedArea] = useState("Tầng 1");
  const [selectedTable, setSelectedTable] = useState("Bàn T1-02");
  const [qrVersion, setQrVersion] = useState(1);

  const filteredStaff = INITIAL_STAFF.filter((emp) => {
    const matchesName = emp.name
      .toLowerCase()
      .includes(searchStaff.toLowerCase());
    const matchesBranch =
      branchFilter === "all" || emp.branch === branchFilter;
    return matchesName && matchesBranch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "staff", label: "Nhân sự & phân quyền" },
          { id: "branches", label: "Chi nhánh" },
          { id: "qr", label: "Bàn & mã QR" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as StaffTab)}
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

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            placeholder="Tìm nhân viên..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả chi nhánh</option>
            <option value="Chi nhánh 01">Chi nhánh 01</option>
            <option value="Chi nhánh 02">Chi nhánh 02</option>
          </select>

          <button
            onClick={() =>
              toast.info(
                "Thêm nhân viên mới",
                "Đang mở biểu mẫu tạo tài khoản và gán vai trò."
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Thêm nhân viên
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
              <th className="py-3.5 px-6">Nhân viên</th>
              <th className="py-3.5 px-6">Vai trò</th>
              <th className="py-3.5 px-6">Chi nhánh</th>
              <th className="py-3.5 px-6">Trạng thái</th>
              <th className="py-3.5 px-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {filteredStaff.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-orange-50/25 transition-colors"
              >
                <td className="py-4 px-6 font-bold text-gray-900">
                  {emp.name}
                </td>
                <td className="py-4 px-6 text-gray-700 font-medium">
                  {emp.role}
                </td>
                <td className="py-4 px-6 text-gray-600 font-medium">
                  {emp.branch}
                </td>
                <td className="py-4 px-6">
                  <StatusBadge label={emp.status} variant="success" />
                </td>
                <td className="py-4 px-6">
                  <button
                    onClick={() =>
                      toast.info(
                        `Phân quyền: ${emp.name}`,
                        `Vai trò hiện tại: ${emp.role} tại ${emp.branch}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-semibold text-xs sm:text-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Sửa / Phân quyền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-5">
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

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-gray-900">
            Bàn & mã QR gọi món
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-7 space-y-4">
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
                  <option value="Bàn T1-01">Bàn T1-01</option>
                  <option value="Bàn T1-02">Bàn T1-02</option>
                  <option value="Bàn T1-03">Bàn T1-03</option>
                  <option value="Bàn VIP-01">Bàn VIP-01</option>
                </select>
              </div>

              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Mã QR đang hoạt động (v{qrVersion})
              </p>
            </div>

            <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50/50 border-2 border-dashed border-orange-200 aspect-square max-w-[160px] mx-auto w-full">
              <QrCode className="w-20 h-20 text-orange-600 mb-1.5" />
              <span className="text-xs font-bold text-gray-700">
                {selectedTable}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setQrVersion((v) => v + 1);
                toast.warning(
                  "Đã tạo lại mã QR mới",
                  `Mã QR cũ của ${selectedTable} đã bị vô hiệu hóa.`
                );
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 text-sm font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tạo lại QR
            </button>

            <button
              type="button"
              onClick={() =>
                toast.success(
                  `Đang in mã QR ${selectedTable}`,
                  `Khu vực: ${selectedArea} (${configBranch})`
                )
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In mã QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}