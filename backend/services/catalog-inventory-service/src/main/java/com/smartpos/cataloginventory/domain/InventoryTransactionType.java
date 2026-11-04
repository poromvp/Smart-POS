package com.smartpos.cataloginventory.domain;

public enum InventoryTransactionType {
    SALE_DEDUCT,   // Trừ kho khi bán món
    IMPORT,        // Tăng kho khi nhập hàng
    SPOILAGE,      // Xuất hủy hỏng hóc, hết hạn
    AUDIT_ADJUST   // Điều chỉnh sau kiểm kê thực tế
}
