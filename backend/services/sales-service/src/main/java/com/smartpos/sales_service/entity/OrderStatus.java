package com.smartpos.sales_service.entity;

public enum OrderStatus {
    PENDING,     // Mới tạo từ QR/POS
    CONFIRMED,   // Thu ngân/bếp đã tiếp nhận
    PREPARING,   // Bếp đang chế biến
    READY,       // Món đã hoàn thành sẵn sàng phục vụ
    SERVED,      // Đã phục vụ ra bàn
    COMPLETED,   // Đã hoàn tất & thanh toán
    CANCELLED    // Đã hủy
}
