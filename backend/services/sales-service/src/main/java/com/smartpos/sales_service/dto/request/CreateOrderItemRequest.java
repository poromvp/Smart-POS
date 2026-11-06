package com.smartpos.sales_service.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderItemRequest {

    // 1. Mã số món ăn (tham chiếu sang catalog-inventory-service)
    @NotNull(message = "ID món ăn (productId) không được để trống")
    private Long productId;

    // 2. Mã biến thể Size (nếu có)
    private Long variantId;

    // 3. Danh sách ID tùy chọn topping, đường, đá
    @Builder.Default
    private List<Long> modifierOptionIds = new ArrayList<>();

    // Cột itemId chuỗi cũ (hỗ trợ tương thích ngược)
    private String itemId;

    @NotBlank(message = "Tên món ăn không được để trống")
    private String name;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotNull(message = "Đơn giá không được để trống")
    private BigDecimal basePrice;

    private BigDecimal modifierTotal;

    private List<String> toppings;

    private String sweetness;

    private String note;
}
