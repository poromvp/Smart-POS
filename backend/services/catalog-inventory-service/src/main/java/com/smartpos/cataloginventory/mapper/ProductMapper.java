package com.smartpos.cataloginventory.mapper;

import com.smartpos.cataloginventory.domain.Product;
import com.smartpos.cataloginventory.domain.ProductVariant;
import com.smartpos.cataloginventory.dto.request.ProductCreateRequest;
import com.smartpos.cataloginventory.dto.request.ProductUpdateRequest;
import com.smartpos.cataloginventory.dto.request.ProductVariantRequest;
import com.smartpos.cataloginventory.dto.response.ProductDetailResponse;
import com.smartpos.cataloginventory.dto.response.ProductSummaryResponse;
import com.smartpos.cataloginventory.dto.response.ProductVariantResponse;
import org.mapstruct.*;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring", uses = {ModifierMapper.class})
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "modifierGroups", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Product toEntity(ProductCreateRequest request);

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "variantCount", expression = "java(product.getVariants() != null ? product.getVariants().size() : 0)")
    ProductSummaryResponse toSummaryResponse(Product product);

    List<ProductSummaryResponse> toSummaryResponseList(List<Product> products);

    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "variants", expression = "java(mapVariantsWithFinalPrice(product))")
    ProductDetailResponse toDetailResponse(Product product);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "modifierGroups", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDto(ProductUpdateRequest request, @MappingTarget Product entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    ProductVariant toVariantEntity(ProductVariantRequest request);

    default List<ProductVariantResponse> mapVariantsWithFinalPrice(Product product) {
        if (product.getVariants() == null) return List.of();
        BigDecimal base = product.getBasePrice() != null ? product.getBasePrice() : BigDecimal.ZERO;
        return product.getVariants().stream().map(v -> {
            BigDecimal adj = v.getPriceAdjustment() != null ? v.getPriceAdjustment() : BigDecimal.ZERO;
            return ProductVariantResponse.builder()
                    .id(v.getId())
                    .sizeName(v.getSizeName())
                    .priceAdjustment(adj)
                    .finalPrice(base.add(adj))
                    .sku(v.getSku())
                    .build();
        }).toList();
    }
}
