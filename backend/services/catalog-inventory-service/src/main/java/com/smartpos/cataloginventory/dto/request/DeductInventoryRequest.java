package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class DeductInventoryRequest {
    @NotBlank(message = "Mã đơn hàng không được để trống")
    @Size(max = 50, message = "Mã đơn hàng tối đa 50 ký tự")
    private String orderCode;

    @NotEmpty(message = "Danh sách món không được để trống")
    @Valid
    private List<DeductItemRequest> items;
}
