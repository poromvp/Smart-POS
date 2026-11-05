"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Receipt,
  Printer,
  DollarSign,
  CheckCircle2,
  Clock,
  Ban,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge, { type StatusVariant } from "@/components/ui/StatusBadge";
import OrderDetailModal, { formatCurrency } from "@/components/pos/OrderDetailModal";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchOrders } from "@/lib/api";
import type { OrderResponse, OrderStatus, PaymentMethod } from "@/lib/types/sales";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");

  // Modal chi tiết
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toast = useToast();

  const loadData = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
      toast.error(
        "Lỗi tải dữ liệu",
        err instanceof Error ? err.message : "Không thể tải danh sách hóa đơn"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    toast.info("Đã đồng bộ", "Dữ liệu hóa đơn đã được cập nhật mới nhất");
  };

  // Lọc dữ liệu theo thời gian, trạng thái, phương thức và tìm kiếm
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((order) => {
      // 1. Lọc theo thời gian
      const orderDate = new Date(order.createdAt);
      if (periodFilter === "today" && orderDate < startOfToday) return false;
      if (periodFilter === "yesterday" && (orderDate < startOfYesterday || orderDate >= startOfToday))
        return false;
      if (periodFilter === "week" && orderDate < startOf7DaysAgo) return false;
      if (periodFilter === "month" && orderDate < startOfMonth) return false;

      // 2. Lọc theo trạng thái
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;

      // 3. Lọc theo phương thức thanh toán
      if (paymentFilter !== "ALL" && order.paymentMethod !== paymentFilter) return false;

      // 4. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = order.orderCode?.toLowerCase().includes(q);
        const matchTable = order.tableNumber?.toLowerCase().includes(q);
        const matchPhone = order.customerPhone?.includes(q);
        const matchCustomer = order.customerName?.toLowerCase().includes(q);
        if (!matchCode && !matchTable && !matchPhone && !matchCustomer) return false;
      }

      return true;
    });
  }, [orders, periodFilter, statusFilter, paymentFilter, searchQuery]);

  // Thống kê nhanh
  const kpiStats = useMemo(() => {
    const completed = filteredOrders.filter((o) => o.status === "COMPLETED");
    const cancelled = filteredOrders.filter((o) => o.status === "CANCELLED");
    const serving = filteredOrders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");

    const totalRevenue = completed.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

    return {
      revenue: totalRevenue,
      completedCount: completed.length,
      servingCount: serving.length,
      cancelledCount: cancelled.length,
      avgOrderValue,
    };
  }, [filteredOrders]);

  // Xuất file CSV / Excel
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      toast.warning("Không có dữ liệu", "Không có hóa đơn nào phù hợp với bộ lọc để xuất.");
      return;
    }

    const headers = [
      "Mã đơn hàng",
      "Số bàn",
      "Loại đơn",
      "Thời gian tạo",
      "Khách hàng",
      "SĐT",
      "Phương thức TT",
      "Tạm tính (VNĐ)",
      "Giảm voucher (VNĐ)",
      "Giảm điểm (VNĐ)",
      "Tổng thanh toán (VNĐ)",
      "Trạng thái đơn",
      "Trạng thái thanh toán",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${o.tableNumber || "Mang về"}"`,
      `"${o.orderType === "TAKE_AWAY" ? "Mang về" : "Tại bàn"}"`,
      `"${new Date(o.createdAt).toLocaleString("vi-VN")}"`,
      `"${o.customerName || "Khách vãng lai"}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.paymentMethod || "Chưa chọn"}"`,
      o.subtotal || o.totalAmount,
      o.discountAmount || 0,
      o.pointsDiscountAmount || 0,
      o.totalAmount,
      `"${o.status}"`,
      `"${o.paymentStatus}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `Bao_Cao_Hoa_Don_SmartPOS_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Xuất báo cáo thành công", `Đã tải về tệp ${fileName}`);
  };

  const getOrderStatusVariant = (status: OrderStatus): StatusVariant => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "READY":
        return "serving";
      case "PREPARING":
      case "CONFIRMED":
      case "PENDING":
        return "pending";
      case "CANCELLED":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Tiêu đề & Nút xuất báo cáo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Lịch sử hóa đơn bán hàng
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tra cứu toàn bộ lịch sử giao dịch, chi tiết từng món và trạng thái thanh toán.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold px-3.5 py-2.5 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-orange-600" : ""} />
            <span>Đồng bộ</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download size={16} />
            <span>Xuất file Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh thu thực thu"
          value={formatCurrency(kpiStats.revenue)}
          icon={DollarSign}
        />
        <StatCard
          label="Đơn hoàn tất"
          value={`${kpiStats.completedCount} đơn`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Đang phục vụ"
          value={`${kpiStats.servingCount} đơn`}
          icon={Clock}
        />
        <StatCard
          label="Đơn đã hủy"
          value={`${kpiStats.cancelledCount} đơn`}
          icon={Ban}
          isWarning={kpiStats.cancelledCount > 0}
        />
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Mã đơn, bàn, SĐT, tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
            />
          </div>

          {/* Lọc thời gian */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="all">Thời gian: Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này</option>
          </select>

          {/* Lọc trạng thái đơn */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Trạng thái: Tất cả</option>
            <option value="COMPLETED">Đã hoàn tất (Thanh toán)</option>
            <option value="PENDING">Chờ xác nhận (PENDING)</option>
            <option value="PREPARING">Bếp đang nấu (PREPARING)</option>
            <option value="READY">Món đã sẵn sàng (READY)</option>
            <option value="CANCELLED">Đã hủy đơn (CANCELLED)</option>
          </select>

          {/* Lọc phương thức thanh toán */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Phương thức: Tất cả</option>
            <option value="CASH">Tiền mặt</option>
            <option value="VIETQR">VietQR / Chuyển khoản</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>
            Tìm thấy <strong>{filteredOrders.length}</strong> hóa đơn phù hợp
          </span>
          {(searchQuery || statusFilter !== "ALL" || periodFilter !== "all" || paymentFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setPeriodFilter("all");
                setPaymentFilter("ALL");
              }}
              className="text-orange-600 font-semibold hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Danh sách Hóa đơn */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase">
                <th className="py-3.5 px-6">Mã hóa đơn</th>
                <th className="py-3.5 px-6">Bàn</th>
                <th className="py-3.5 px-6">Thời gian</th>
                <th className="py-3.5 px-6">Khách hàng</th>
                <th className="py-3.5 px-6">Phương thức</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6 text-right">Tổng tiền</th>
                <th className="py-3.5 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-900">
                    #{order.orderCode}
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    {order.tableNumber ? `Bàn ${order.tableNumber}` : "Mang về"}
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="py-4 px-6">
                    {order.customerPhone ? (
                      <span className="flex items-center gap-1.5 text-gray-800 font-medium">
                        <User size={13} className="text-orange-600 shrink-0" />
                        <span>{order.customerName ? `${order.customerName} - ` : ""}{order.customerPhone}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Khách vãng lai</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        order.paymentMethod === "VIETQR"
                          ? "bg-blue-100 text-blue-700"
                          : order.paymentMethod === "CASH"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.paymentMethod === "VIETQR"
                        ? "VietQR"
                        : order.paymentMethod === "CASH"
                        ? "Tiền mặt"
                        : "Chưa TT"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge
                      label={
                        order.status === "COMPLETED"
                          ? "Đã hoàn tất"
                          : order.status === "CANCELLED"
                          ? "Đã hủy"
                          : order.status === "READY"
                          ? "Đã nấu xong"
                          : "Đang phục vụ"
                      }
                      variant={getOrderStatusVariant(order.status)}
                    />
                  </td>
                  <td className="py-4 px-6 text-right font-extrabold text-orange-600 tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-orange-400 hover:text-orange-600 transition shadow-2xs cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Xem & In</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <Receipt size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">Không tìm thấy hóa đơn nào</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Thử điều chỉnh lại bộ lọc hoặc khoảng thời gian tra cứu.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi tiết hóa đơn & In lại */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}
