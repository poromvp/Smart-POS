package com.smartpos.cataloginventory.mapper;

import com.smartpos.cataloginventory.domain.Supplier;
import com.smartpos.cataloginventory.dto.request.SupplierCreateRequest;
import com.smartpos.cataloginventory.dto.request.SupplierUpdateRequest;
import com.smartpos.cataloginventory.dto.response.SupplierResponse;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface SupplierMapper {

    @Mapping(target = "id", ignore = true)
    Supplier toEntity(SupplierCreateRequest request);

    SupplierResponse toResponse(Supplier entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    void updateEntityFromDto(SupplierUpdateRequest request, @MappingTarget Supplier entity);
}
