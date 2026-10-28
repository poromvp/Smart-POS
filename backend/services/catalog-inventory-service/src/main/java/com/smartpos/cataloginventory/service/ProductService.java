package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.ProductCreateRequest;
import com.smartpos.cataloginventory.dto.request.ProductUpdateRequest;
import com.smartpos.cataloginventory.dto.response.CategoryMenuResponse;
import com.smartpos.cataloginventory.dto.response.ProductDetailResponse;
import com.smartpos.cataloginventory.dto.response.ProductSummaryResponse;

import java.util.List;

public interface ProductService {
    ProductDetailResponse createProduct(ProductCreateRequest request);
    List<ProductSummaryResponse> getProducts(Long categoryId, Boolean activeOnly, String search);
    ProductDetailResponse getProductById(Long id);
    ProductDetailResponse updateProduct(Long id, ProductUpdateRequest request);
    void toggleProductStatus(Long id, Boolean isActive);
    void deleteProduct(Long id);

    // API thực đơn tổng hợp cho POS và QR Order
    List<CategoryMenuResponse> getMenu();
}
