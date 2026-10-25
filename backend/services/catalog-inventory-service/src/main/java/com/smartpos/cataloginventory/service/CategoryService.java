package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.CategoryCreateRequest;
import com.smartpos.cataloginventory.dto.request.CategoryUpdateRequest;
import com.smartpos.cataloginventory.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {
    CategoryResponse createCategory(CategoryCreateRequest request);
    List<CategoryResponse> getAllCategories(Boolean activeOnly);
    CategoryResponse getCategoryById(Long id);
    CategoryResponse updateCategory(Long id, CategoryUpdateRequest request);
    void toggleCategoryStatus(Long id, Boolean isActive);
    void deleteCategory(Long id);
}
