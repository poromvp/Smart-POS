package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.Category;
import com.smartpos.cataloginventory.dto.request.CategoryCreateRequest;
import com.smartpos.cataloginventory.dto.request.CategoryUpdateRequest;
import com.smartpos.cataloginventory.dto.response.CategoryResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.CategoryMapper;
import com.smartpos.cataloginventory.repository.CategoryRepository;
import com.smartpos.cataloginventory.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Danh mục với tên '" + request.getName() + "' đã tồn tại");
        }

        Category category = categoryMapper.toEntity(request);
        category.setName(request.getName().trim());
        Category saved = categoryRepository.save(category);

        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(Boolean activeOnly) {
        List<Category> categories = Boolean.TRUE.equals(activeOnly)
                ? categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                : categoryRepository.findAllByOrderByDisplayOrderAsc();

        return categories.stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = findCategoryOrThrow(id);
        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request) {
        Category category = findCategoryOrThrow(id);

        if (request.getName() != null &&
                categoryRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new DuplicateResourceException("Tên danh mục '" + request.getName() + "' đã được sử dụng bởi danh mục khác");
        }

        categoryMapper.updateEntityFromDto(request, category);
        if (request.getName() != null) {
            category.setName(request.getName().trim());
        }

        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public void toggleCategoryStatus(Long id, Boolean isActive) {
        Category category = findCategoryOrThrow(id);
        category.setIsActive(isActive);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = findCategoryOrThrow(id);

        // Chặn xóa nếu danh mục đang chứa sản phẩm
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new InvalidOperationException("Không thể xóa danh mục đang có chứa sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước");
        }

        categoryRepository.delete(category);
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
    }
}
