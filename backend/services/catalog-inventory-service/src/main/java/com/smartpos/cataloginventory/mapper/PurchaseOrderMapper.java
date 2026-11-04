package com.smartpos.cataloginventory.mapper;

import com.smartpos.cataloginventory.domain.PurchaseOrder;
import com.smartpos.cataloginventory.domain.PurchaseOrderItem;
import com.smartpos.cataloginventory.dto.response.PurchaseOrderItemResponse;
import com.smartpos.cataloginventory.dto.response.PurchaseOrderResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PurchaseOrderMapper {

    @Mapping(target = "supplierId", source = "supplier.id")
    @Mapping(target = "supplierName", source = "supplier.name")
    PurchaseOrderResponse toResponse(PurchaseOrder entity);

    List<PurchaseOrderResponse> toResponseList(List<PurchaseOrder> entities);

    @Mapping(target = "ingredientId", source = "ingredient.id")
    @Mapping(target = "ingredientName", source = "ingredient.name")
    @Mapping(target = "ingredientCode", source = "ingredient.code")
    @Mapping(target = "unit", source = "ingredient.unit")
    PurchaseOrderItemResponse toItemResponse(PurchaseOrderItem item);

    List<PurchaseOrderItemResponse> toItemResponseList(List<PurchaseOrderItem> items);
}
