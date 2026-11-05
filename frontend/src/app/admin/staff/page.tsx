"use client";

import React, { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Plus,
  Save,
  RefreshCw,
  Printer,
} from "lucide-react";

type StaffTab = "staff" | "qr";

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
  const [selectedTable, setSelectedTable] = useState("Bàn 1");
  const [publicAppUrl, setPublicAppUrl] = useState(
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "")
  );

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
      toast.error("Không thể mở cửa sổ in", "Vui lòng cho phép popup rồi thử lại.");
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

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                toast.info("Mã QR đã sẵn sàng", "Mã này mở đúng menu của bàn đã chọn.");
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
              onClick={() => window.open(guestMenuUrl, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold transition-colors hover:bg-orange-100"
            >
              Mở trang gọi món
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}