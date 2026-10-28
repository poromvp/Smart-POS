package com.smartpos.cataloginventory.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ModifierGroupCreateRequest {
    @NotBlank(message = "Tên nhóm tùy chọn không được để trống")
    @Size(max = 100, message = "Tên nhóm tùy chọn tối đa 100 ký tự")
    private String name;

    private Boolean isMultiple = false; // true: chọn nhiều, false: chọn 1

    private Boolean isRequired = false; // true: bắt buộc, false: không

    @Valid
    private List<ModifierOptionRequest> options = new ArrayList<>(); // Danh sách các tùy chọn tạo kèm
}
