package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.Category;
import com.smartpos.cataloginventory.domain.ModifierGroup;
import com.smartpos.cataloginventory.domain.Product;
import com.smartpos.cataloginventory.domain.ProductVariant;
import com.smartpos.cataloginventory.dto.request.ProductCreateRequest;
import com.smartpos.cataloginventory.dto.request.ProductUpdateRequest;
import com.smartpos.cataloginventory.dto.request.ProductVariantRequest;
import com.smartpos.cataloginventory.dto.response.CategoryMenuResponse;
import com.smartpos.cataloginventory.dto.response.ProductDetailResponse;
import com.smartpos.cataloginventory.dto.response.ProductSummaryResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.ProductMapper;
import com.smartpos.cataloginventory.repository.*;
import com.smartpos.cataloginventory.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final ModifierGroupRepository modifierGroupRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional
    public ProductDetailResponse createProduct(ProductCreateRequest request) {
        validateUniqueFieldsOnCreate(request);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));

        Product product = productMapper.toEntity(request);
        product.setName(request.getName().trim());
        if (request.getCode() != null) {
            product.setCode(request.getCode().trim().toUpperCase());
        }
        product.setCategory(category);

        // 1. Gắn các nhóm Topping/Modifier
        attachModifierGroups(product, request.getModifierGroupIds());

        // 2. Gắn danh sách biến thể Size
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ProductVariantRequest vReq : request.getVariants()) {
                validateVariantSkuOnCreate(vReq.getSku());
                ProductVariant variant = productMapper.toVariantEntity(vReq);
                variant.setSizeName(vReq.getSizeName().trim());
                if (vReq.getSku() != null) {
                    variant.setSku(vReq.getSku().trim().toUpperCase());
                }
                variant.setProduct(product);
                product.getVariants().add(variant);
            }
        }

        Product saved = productRepository.save(product);
        return productMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummaryResponse> getProducts(Long categoryId, Boolean activeOnly, String search) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Product> products = productRepository.searchProducts(categoryId, activeOnly, cleanSearch);
        return productMapper.toSummaryResponseList(products);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        return productMapper.toDetailResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryMenuResponse> getMenu() {
        // 1. Lấy tất cả danh mục đang hoạt động theo thứ tự hiển thị display_order
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();

        // 2. Lấy toàn bộ món ăn đang kinh doanh kèm chi tiết Size và Topping (đã tối ưu truy vấn)
        List<Product> activeProducts = productRepository.findActiveMenuProducts();

        // 3. Gom nhóm sản phẩm theo categoryId
        Map<Long, List<Product>> productsByCategory = activeProducts.stream()
                .collect(Collectors.groupingBy(p -> p.getCategory().getId()));

        // 4. Lắp ráp cấu trúc thực đơn trả về
        return categories.stream().map(cat -> {
            List<Product> prods = productsByCategory.getOrDefault(cat.getId(), Collections.emptyList());
            List<ProductDetailResponse> productResponses = prods.stream()
                    .map(productMapper::toDetailResponse)
                    .toList();

            return CategoryMenuResponse.builder()
                    .categoryId(cat.getId())
                    .categoryName(cat.getName())
                    .displayOrder(cat.getDisplayOrder())
                    .products(productResponses)
                    .build();
        }).toList();
    }

    @Override
    @Transactional
    public ProductDetailResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));

        validateUniqueFieldsOnUpdate(id, request);

        if (!product.getCategory().getId().equals(request.getCategoryId())) {
            Category newCategory = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + request.getCategoryId()));
            product.setCategory(newCategory);
        }

        productMapper.updateEntityFromDto(request, product);
        product.setName(request.getName().trim());
        if (request.getCode() != null) {
            product.setCode(request.getCode().trim().toUpperCase());
        }

        // Cập nhật lại Modifier Groups
        attachModifierGroups(product, request.getModifierGroupIds());

        // Cập nhật Variants (xóa cũ, nạp mới an toàn)
        product.getVariants().clear();
        if (request.getVariants() != null) {
            for (ProductVariantRequest vReq : request.getVariants()) {
                ProductVariant variant = productMapper.toVariantEntity(vReq);
                variant.setSizeName(vReq.getSizeName().trim());
                if (vReq.getSku() != null) {
                    variant.setSku(vReq.getSku().trim().toUpperCase());
                }
                variant.setProduct(product);
                product.getVariants().add(variant);
            }
        }

        Product updated = productRepository.save(product);
        return productMapper.toDetailResponse(updated);
    }

    @Override
    @Transactional
    public void toggleProductStatus(Long id, Boolean isActive) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        product.setIsActive(isActive);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        productRepository.delete(product);
    }

    private void attachModifierGroups(Product product, Set<Long> groupIds) {
        if (groupIds == null || groupIds.isEmpty()) {
            product.getModifierGroups().clear();
            return;
        }
        List<ModifierGroup> groups = modifierGroupRepository.findAllById(groupIds);
        product.setModifierGroups(new HashSet<>(groups));
    }

    private void validateUniqueFieldsOnCreate(ProductCreateRequest request) {
        if (productRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Tên món ăn '" + request.getName() + "' đã tồn tại");
        }
        if (request.getCode() != null && !request.getCode().isBlank() &&
                productRepository.existsByCodeIgnoreCase(request.getCode().trim())) {
            throw new DuplicateResourceException("Mã món ăn '" + request.getCode() + "' đã tồn tại");
        }
    }

    private void validateUniqueFieldsOnUpdate(Long id, ProductUpdateRequest request) {
        if (productRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new DuplicateResourceException("Tên món ăn '" + request.getName() + "' đã được sử dụng");
        }
        if (request.getCode() != null && !request.getCode().isBlank() &&
                productRepository.existsByCodeIgnoreCaseAndIdNot(request.getCode().trim(), id)) {
            throw new DuplicateResourceException("Mã món ăn '" + request.getCode() + "' đã được sử dụng");
        }
    }

    private void validateVariantSkuOnCreate(String sku) {
        if (sku != null && !sku.isBlank() && productVariantRepository.existsBySkuIgnoreCase(sku.trim())) {
            throw new DuplicateResourceException("Mã SKU biến thể '" + sku + "' đã tồn tại");
        }
    }
}
