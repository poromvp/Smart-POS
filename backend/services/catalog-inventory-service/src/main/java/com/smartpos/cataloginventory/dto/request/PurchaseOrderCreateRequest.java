package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PurchaseOrderCreateRequest {
    @NotNull(message = "supplierId không được để trống")
    private Long supplierId;

    @NotNull(message = "staffId không được để trống")
    private Long staffId;

    private LocalDate orderDate;

    private LocalDate deliveryDate;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;

    @NotEmpty(message = "Danh sách nguyên liệu nhập không được để trống")
    @Valid
    private List<PurchaseOrderItemRequest> items;
}
