package com.smartpos.cataloginventory.dto.request;

import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InventoryAdjustmentRequest {

    @NotNull(message = "Mã nguyên liệu không được để trống")
    private Long ingredientId;

    @NotNull(message = "Loại điều chỉnh không được để trống")
    private InventoryTransactionType type; // AUDIT_ADJUST hoặc SPOILAGE

    // Dùng cho AUDIT_ADJUST: nhập số lượng thực tế đếm được trong kho
    private BigDecimal actualStock;

    // Dùng cho SPOILAGE (số lượng hao hụt/xuất hủy) hoặc chênh lệch trực tiếp
    private BigDecimal quantity;

    // Lý do xuất hủy / ghi chú kiểm kê
    private String reason;
}
