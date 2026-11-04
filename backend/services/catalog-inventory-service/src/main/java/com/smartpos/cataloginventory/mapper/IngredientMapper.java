package com.smartpos.cataloginventory.mapper;

import com.smartpos.cataloginventory.domain.Ingredient;
import com.smartpos.cataloginventory.dto.request.IngredientCreateRequest;
import com.smartpos.cataloginventory.dto.request.IngredientUpdateRequest;
import com.smartpos.cataloginventory.dto.response.IngredientResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface IngredientMapper {

    @Mapping(target = "id", ignore = true)
    Ingredient toEntity(IngredientCreateRequest request);

    @Mapping(target = "lowStock",
            expression = "java(entity.getCurrentStock().compareTo(entity.getMinThreshold()) <= 0)")
    IngredientResponse toResponse(Ingredient entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currentStock", ignore = true)
    void updateEntityFromDto(IngredientUpdateRequest request, @MappingTarget Ingredient entity);
}
