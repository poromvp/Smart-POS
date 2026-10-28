package com.smartpos.cataloginventory.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModifierGroupResponse {
    private Long id;
    private String name;
    private Boolean isMultiple;
    private Boolean isRequired;
    private List<ModifierOptionResponse> options;
}
