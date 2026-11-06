package com.smartpos.sales_service.client.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeductInventoryRequest {

    @NotBlank(message = "Mã đơn hàng không được để trống")
    @Size(max = 50, message = "Mã đơn hàng tối đa 50 ký tự")
    private String orderCode;

    @NotEmpty(message = "Danh sách món không được để trống")
    @Valid
    private List<DeductItemRequest> items;
}
