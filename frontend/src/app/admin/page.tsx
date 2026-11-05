"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import StatusBadge, { type StatusVariant } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Flame,
  Building2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { fetchOrders, fetchLowStockAlerts } from "@/lib/api";
import type { OrderResponse, OrderStatus } from "@/lib/types/sales";
import type { LowStockAlertResponse } from "@/lib/types/inventory";

const formatCurrency = (amount: number) =>
  `${amount.toLocaleString("vi-VN")}đ`;

export default function AdminOverviewPage() {
  const [period, setPeriod] = useState("today");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toast = useToast();

  const loadDashboardData = async () => {
    try {
      const [ordersData, alertsData] = await Promise.all([
        fetchOrders().catch(() => [] as OrderResponse[]),
        fetchLowStockAlerts().catch(() => [] as LowStockAlertResponse[]),
      ]);
      setOrders(ordersData || []);
      setLowStockAlerts(alertsData || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tổng quan:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    toast.info("Đã đồng bộ", "Dữ liệu tổng quan kinh doanh đã được cập nhật mới nhất");
  };

  // Lọc các đơn hoàn tất theo kỳ báo cáo
  const filteredCompletedOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((order) => {
      if (order.status !== "COMPLETED") return false;
      const orderDate = new Date(order.createdAt);
      if (period === "today" && orderDate < startOfToday) return false;
      if (period === "yesterday" && (orderDate < startOfYesterday || orderDate >= startOfToday))
        return false;
      if (period === "week" && orderDate < startOf7DaysAgo) return false;
      if (period === "month" && orderDate < startOfMonth) return false;
      return true;
    });
  }, [orders, period]);

  // 1. Tổng doanh thu theo kỳ
  const totalRevenue = useMemo(() => {
    return filteredCompletedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredCompletedOrders]);

  // 2. Tổng đơn hoàn tất theo kỳ
  const completedCount = filteredCompletedOrders.length;

  // 3. Thời gian bếp trung bình (tính từ createdAt đến updatedAt nếu có)
  const avgKitchenTimeStr = useMemo(() => {
    const ordersWithDuration = filteredCompletedOrders.filter(
      (o) => o.updatedAt && o.createdAt && new Date(o.updatedAt) > new Date(o.createdAt)
    );
    if (ordersWithDuration.length === 0) return "08:30 phút";

    const totalMinutes = ordersWithDuration.reduce((sum, o) => {
      const diffMs = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
      return sum + Math.max(1, Math.round(diffMs / 60000));
    }, 0);

    const avgMinutes = Math.round(totalMinutes / ordersWithDuration.length);
    const mins = String(avgMinutes).padStart(2, "0");
    return `${mins}:00 phút`;
  }, [filteredCompletedOrders]);

  // 4. Doanh thu theo khung giờ (0h, 4h, 8h, 12h, 16h, 20h)
  const hourlyRevenueData = useMemo(() => {
    const slots = [
      { hour: "0h", start: 0, end: 4, amount: 0 },
      { hour: "4h", start: 4, end: 8, amount: 0 },
      { hour: "8h", start: 8, end: 12, amount: 0 },
      { hour: "12h", start: 12, end: 16, amount: 0 },
      { hour: "16h", start: 16, end: 20, amount: 0 },
      { hour: "20h", start: 20, end: 24, amount: 0 },
    ];

    for (const o of filteredCompletedOrders) {
      const h = new Date(o.createdAt).getHours();
      const slot = slots.find((s) => h >= s.start && h < s.end);
      if (slot) {
        slot.amount += o.totalAmount || 0;
      }
    }

    const maxAmount = Math.max(...slots.map((s) => s.amount), 1);
    const peakSlot = slots.reduce((max, s) => (s.amount > max.amount ? s : max), slots[0]);

    return {
      slots: slots.map((s) => ({
        hour: s.hour,
        amount: formatCurrency(s.amount),
        rawAmount: s.amount,
        percent: s.amount > 0 ? Math.max(15, Math.round((s.amount / maxAmount) * 100)) : 4,
      })),
      peakHour: peakSlot.amount > 0 ? peakSlot.hour : "12h",
    };
  }, [filteredCompletedOrders]);

  // 5. Món bán chạy nhất
  const bestSellers = useMemo(() => {
    const countMap: Record<string, number> = {};

    for (const o of filteredCompletedOrders) {
      for (const item of o.items || []) {
        countMap[item.name] = (countMap[item.name] || 0) + item.quantity;
      }
    }

    const sorted = Object.entries(countMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    if (sorted.length === 0) {
      return [
        { rank: 1, name: "Phở bò đặc biệt", sold: "0 phần" },
        { rank: 2, name: "Cơm tấm sườn bì", sold: "0 phần" },
        { rank: 3, name: "Trà đào cam sả", sold: "0 phần" },
      ];
    }

    return sorted.map((item, idx) => ({
      rank: idx + 1,
      name: item.name,
      sold: `${item.qty} phần`,
    }));
  }, [filteredCompletedOrders]);

  // 6. Đơn hàng gần đây (5 đơn mới nhất)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((o) => {
        let statusText = "Đang phục vụ";
        let variant: StatusVariant = "serving";
        if (o.status === "COMPLETED") {
          statusText = "Đã thanh toán";
          variant = "success";
        } else if (o.status === "CANCELLED") {
          statusText = "Đã hủy";
          variant = "danger";
        } else if (o.status === "READY") {
          statusText = "Món sẵn sàng";
          variant = "serving";
        }

        return {
          id: o.orderCode,
          branchTable: o.tableNumber ? `Bàn ${o.tableNumber}` : "Mang về",
          total: formatCurrency(o.totalAmount),
          status: statusText,
          variant,
          createdAt: new Date(o.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      });
  }, [orders]);

  // 7. Xuất báo cáo CSV
  const handleExport = () => {
    if (filteredCompletedOrders.length === 0) {
      toast.warning("Không có dữ liệu", "Không có hóa đơn nào trong kỳ đã chọn để xuất.");
      return;
    }

    const headers = [
      "Mã hóa đơn",
      "Số bàn",
      "Loại đơn",
      "Thời gian",
      "Khách hàng",
      "SĐT",
      "Phương thức thanh toán",
      "Tổng thanh toán (VNĐ)",
    ];

    const rows = filteredCompletedOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${o.tableNumber || "Mang về"}"`,
      `"${o.orderType}"`,
      `"${new Date(o.createdAt).toLocaleString("vi-VN")}"`,
      `"${o.customerName || "Khách vãng lai"}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.paymentMethod || "Tiền mặt"}"`,
      o.totalAmount,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Doanh_Thu_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Xuất báo cáo thành công", "Báo cáo doanh thu đã được tải xuống dưới dạng file Excel/CSV.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Thanh thông tin Chi nhánh & Bộ lọc thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-orange-50/80 border border-orange-100 text-orange-800 text-sm font-bold shadow-2xs">
          <Building2 size={18} className="text-orange-600" />
          <span>Chi nhánh chính · Smart POS</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold px-3 py-2 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-orange-600" : ""} />
            <span>Cập nhật</span>
          </button>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 px-4 py-2.5 w-full sm:w-48 outline-none shadow-2xs cursor-pointer"
          >
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
      </div>

      {/* 4 Thẻ KPI chính kết nối trực tiếp với backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={
            period === "today"
              ? "Doanh thu hôm nay"
              : period === "yesterday"
              ? "Doanh thu hôm qua"
              : period === "week"
              ? "Doanh thu 7 ngày"
              : "Doanh thu tháng này"
          }
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          label="Tổng đơn hoàn tất"
          value={`${completedCount} đơn`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Thời gian bếp TB"
          value={avgKitchenTimeStr}
          icon={Clock}
        />
        <StatCard
          label="Cảnh báo tồn kho"
          value={`${lowStockAlerts.length} nguyên liệu`}
          icon={AlertTriangle}
          isWarning={lowStockAlerts.length > 0}
        />
      </div>

      {/* Biểu đồ Doanh thu theo khung giờ & Món bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-800">
              Doanh thu theo khung giờ
            </h2>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Giờ cao điểm: {hourlyRevenueData.peakHour}
            </span>
          </div>

          <div className="h-52 flex items-end justify-between gap-4 pt-6 px-3 border-b border-gray-200">
            {hourlyRevenueData.slots.map((item) => (
              <div
                key={item.hour}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-[11px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.amount}
                </span>
                <div
                  style={{ height: `${item.percent}%` }}
                  className={`w-full max-w-15 rounded-t-lg transition-all ${
                    item.percent >= 90
                      ? "bg-orange-600 shadow-sm shadow-orange-500/30"
                      : "bg-orange-200 group-hover:bg-orange-400"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4 pt-3 px-3">
            {hourlyRevenueData.slots.map((item) => (
              <div
                key={item.hour}
                className="flex-1 text-center text-xs font-semibold text-gray-500"
              >
                {item.hour}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-800">Món bán chạy</h2>
          </div>

          <ul className="space-y-3">
            {bestSellers.map((dish) => (
              <li
                key={dish.rank}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-orange-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      dish.rank === 1
                        ? "bg-orange-600 text-white"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {dish.rank}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {dish.name}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {dish.sold}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Đơn hàng gần đây & Nút xem toàn bộ lịch sử */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-800">Đơn hàng gần đây</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Xem toàn bộ lịch sử</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-300 hover:border-orange-300 text-sm font-semibold px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="py-3.5 px-6">Mã hóa đơn</th>
                <th className="py-3.5 px-6">Bàn</th>
                <th className="py-3.5 px-6">Thời gian</th>
                <th className="py-3.5 px-6">Tổng tiền</th>
                <th className="py-3.5 px-6">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-orange-50/30 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-gray-900">
                    #{order.id}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-medium">
                    {order.branchTable}
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-xs">
                    {order.createdAt}
                  </td>
                  <td className="py-4 px-6 font-bold text-gray-800 tabular-nums">
                    {order.total}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge label={order.status} variant={order.variant} />
                  </td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Chưa có đơn hàng nào được ghi nhận trên hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
