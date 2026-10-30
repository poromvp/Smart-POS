package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.request.DeductItemRequest;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.InsufficientStockException;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.repository.*;
import com.smartpos.cataloginventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ModifierOptionRepository modifierOptionRepository;

    @Override
    @Transactional
    public DeductInventoryResponse deductInventory(DeductInventoryRequest request) {
        String orderCode = request.getOrderCode().trim();
        List<DeductItemRequest> items = request.getItems();

        validateItems(items);

        // 1. Tổng nguyên liệu cần = Σ (định lượng công thức × số lượng món)
        Map<Long, BigDecimal> required = calculateRequiredIngredients(items);
        if (required.isEmpty()) {
            // Các món trong đơn đều chưa có công thức: không có gì để trừ
            return DeductInventoryResponse.builder().orderCode(orderCode).deductions(List.of()).build();
        }

        // 2. Khóa bi quan các dòng nguyên liệu (đã sắp xếp theo id để tránh deadlock)
        Map<Long, Ingredient> locked = ingredientRepository.findAllByIdWithLock(required.keySet()).stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        // Kiểm tra trùng đơn SAU khi đã giữ khóa: hai request cùng orderCode sẽ bị tuần tự hóa
        if (inventoryTransactionRepository.existsByOrderCodeAndTransactionType(
                orderCode, InventoryTransactionType.SALE_DEDUCT)) {
            throw new DuplicateResourceException("Đơn hàng '" + orderCode + "' đã được trừ kho trước đó");
        }

        // 3. Kiểm tra đủ tồn kho cho toàn bộ nguyên liệu trước khi trừ bất kỳ thứ gì
        for (Map.Entry<Long, BigDecimal> entry : required.entrySet()) {
            Ingredient ingredient = locked.get(entry.getKey());
            if (ingredient == null) {
                throw new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + entry.getKey());
            }
            if (ingredient.getCurrentStock().compareTo(entry.getValue()) < 0) {
                throw new InsufficientStockException(
                        ingredient.getId(), ingredient.getName(), ingredient.getCurrentStock(), entry.getValue());
            }
        }

        // 4 + 5. Trừ kho và ghi thẻ kho SALE_DEDUCT (số lượng âm)
        List<InventoryTransaction> transactions = new ArrayList<>();
        List<DeductInventoryResponse.IngredientDeduction> deductions = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> entry : required.entrySet()) {
            Ingredient ingredient = locked.get(entry.getKey());
            BigDecimal needed = entry.getValue();
            BigDecimal before = ingredient.getCurrentStock();
            BigDecimal after = before.subtract(needed);

            ingredient.setCurrentStock(after);

            transactions.add(InventoryTransaction.builder()
                    .ingredient(ingredient)
                    .orderCode(orderCode)
                    .quantity(needed.negate())
                    .transactionType(InventoryTransactionType.SALE_DEDUCT)
                    .build());

            deductions.add(DeductInventoryResponse.IngredientDeduction.builder()
                    .ingredientId(ingredient.getId())
                    .ingredientName(ingredient.getName())
                    .unit(ingredient.getUnit())
                    .quantityDeducted(needed)
                    .stockBefore(before)
                    .stockAfter(after)
                    .build());
        }
        inventoryTransactionRepository.saveAll(transactions);

        return DeductInventoryResponse.builder().orderCode(orderCode).deductions(deductions).build();
    }

    private Map<Long, BigDecimal> calculateRequiredIngredients(List<DeductItemRequest> items) {
        Set<Long> productIds = new HashSet<>();
        Set<Long> variantIds = new HashSet<>();
        Set<Long> optionIds = new HashSet<>();
        for (DeductItemRequest item : items) {
            productIds.add(item.getProductId());
            if (item.getVariantId() != null) variantIds.add(item.getVariantId());
            optionIds.addAll(item.getModifierOptionIds());
        }

        List<Recipe> recipes = recipeRepository.findApplicableRecipes(
                nonEmpty(productIds), nonEmpty(variantIds), nonEmpty(optionIds));

        // TreeMap: duyệt theo id tăng dần, thông báo thiếu hàng ổn định
        Map<Long, BigDecimal> required = new TreeMap<>();
        for (DeductItemRequest item : items) {
            BigDecimal quantity = BigDecimal.valueOf(item.getQuantity());
            for (Recipe recipe : recipes) {
                if (appliesTo(recipe, item)) {
                    required.merge(recipe.getIngredient().getId(),
                            recipe.getQuantityNeeded().multiply(quantity),
                            BigDecimal::add);
                }
            }
        }
        return required;
    }

    // Mỗi dòng Recipe chỉ thuộc đúng một đích (món / size / topping)
    private boolean appliesTo(Recipe recipe, DeductItemRequest item) {
        if (recipe.getProduct() != null) {
            return recipe.getProduct().getId().equals(item.getProductId());
        }
        if (recipe.getVariant() != null) {
            return recipe.getVariant().getId().equals(item.getVariantId());
        }
        if (recipe.getModifierOption() != null) {
            return item.getModifierOptionIds().contains(recipe.getModifierOption().getId());
        }
        return false;
    }

    private void validateItems(List<DeductItemRequest> items) {
        Set<Long> productIds = items.stream().map(DeductItemRequest::getProductId).collect(Collectors.toSet());
        Set<Long> variantIds = items.stream().map(DeductItemRequest::getVariantId)
                .filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> optionIds = items.stream().flatMap(i -> i.getModifierOptionIds().stream())
                .collect(Collectors.toSet());

        Map<Long, Product> products = productRepository.findAllWithModifiersById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<Long, ProductVariant> variants = productVariantRepository.findAllById(variantIds).stream()
                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
        Set<Long> existingOptionIds = modifierOptionRepository.findAllById(optionIds).stream()
                .map(ModifierOption::getId).collect(Collectors.toSet());

        for (DeductItemRequest item : items) {
            Product product = products.get(item.getProductId());
            if (product == null) {
                throw new ResourceNotFoundException("Không tìm thấy món với ID: " + item.getProductId());
            }
            if (item.getVariantId() != null) {
                ProductVariant variant = variants.get(item.getVariantId());
                if (variant == null || !variant.getProduct().getId().equals(item.getProductId())) {
                    throw new InvalidOperationException(
                            "Size ID " + item.getVariantId() + " không thuộc món ID " + item.getProductId());
                }
            }

            // Tập hợp toàn bộ optionId hợp lệ thuộc các nhóm tùy chọn được gắn trên món này
            Set<Long> allowedOptionIds = product.getModifierGroups().stream()
                    .flatMap(g -> g.getOptions().stream())
                    .map(ModifierOption::getId)
                    .collect(Collectors.toSet());

            for (Long optionId : item.getModifierOptionIds()) {
                if (!existingOptionIds.contains(optionId)) {
                    throw new ResourceNotFoundException("Không tìm thấy tùy chọn với ID: " + optionId);
                }
                if (!allowedOptionIds.contains(optionId)) {
                    throw new InvalidOperationException(
                            "Tùy chọn ID " + optionId + " không thuộc nhóm tùy chọn của món '" + product.getName() + "'");
                }
            }
        }
    }

    // Tránh mệnh đề "IN ()" rỗng gây lỗi SQL trên PostgreSQL
    private Collection<Long> nonEmpty(Set<Long> ids) {
        return ids.isEmpty() ? List.of(-1L) : ids;
    }
}
