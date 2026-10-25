package com.smartpos.cataloginventory.mapper;

import com.smartpos.cataloginventory.domain.Category;
import com.smartpos.cataloginventory.dto.request.CategoryCreateRequest;
import com.smartpos.cataloginventory.dto.request.CategoryUpdateRequest;
import com.smartpos.cataloginventory.dto.response.CategoryResponse;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    Category toEntity(CategoryCreateRequest request);

    CategoryResponse toResponse(Category entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(CategoryUpdateRequest request, @MappingTarget Category entity);
}
