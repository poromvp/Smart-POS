package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ModifierGroupUpdateRequest {
    @NotBlank(message = "Tên nhóm tùy chọn không được để trống")
    @Size(max = 100, message = "Tên nhóm tùy chọn tối đa 100 ký tự")
    private String name;

    private Boolean isMultiple;

    private Boolean isRequired;
}
