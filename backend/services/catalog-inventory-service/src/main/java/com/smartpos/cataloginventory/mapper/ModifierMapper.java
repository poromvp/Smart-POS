package com.smartpos.cataloginventory.mapper;

import com.smartpos.cataloginventory.domain.ModifierGroup;
import com.smartpos.cataloginventory.domain.ModifierOption;
import com.smartpos.cataloginventory.dto.request.ModifierGroupCreateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierGroupUpdateRequest;
import com.smartpos.cataloginventory.dto.request.ModifierOptionRequest;
import com.smartpos.cataloginventory.dto.response.ModifierGroupResponse;
import com.smartpos.cataloginventory.dto.response.ModifierOptionResponse;
import org.mapstruct.*;

import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ModifierMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "options", ignore = true) // Sẽ được xử lý trong service để gán quan hệ hai chiều
    ModifierGroup toEntity(ModifierGroupCreateRequest request);

    ModifierGroupResponse toResponse(ModifierGroup entity);

    List<ModifierGroupResponse> toResponseList(List<ModifierGroup> entities);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(ModifierGroupUpdateRequest request, @MappingTarget ModifierGroup entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "group", ignore = true)
    ModifierOption toOptionEntity(ModifierOptionRequest request);

    ModifierOptionResponse toOptionResponse(ModifierOption entity);

    List<ModifierOptionResponse> toOptionResponseList(Collection<ModifierOption> entities);
}
