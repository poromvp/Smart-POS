package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.Ingredient;
import com.smartpos.cataloginventory.domain.InventoryTransaction;
import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import com.smartpos.cataloginventory.dto.request.IngredientCreateRequest;
import com.smartpos.cataloginventory.dto.request.IngredientUpdateRequest;
import com.smartpos.cataloginventory.dto.response.IngredientResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.IngredientMapper;
import com.smartpos.cataloginventory.repository.IngredientRepository;
import com.smartpos.cataloginventory.repository.InventoryTransactionRepository;
import com.smartpos.cataloginventory.repository.PurchaseOrderItemRepository;
import com.smartpos.cataloginventory.repository.RecipeRepository;
import com.smartpos.cataloginventory.service.IngredientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientServiceImpl implements IngredientService {
    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final IngredientMapper ingredientMapper;

    @Override
    @Transactional
    public IngredientResponse createIngredient(IngredientCreateRequest request) {
        String name = request.getName().trim();
        String code = normalizeCode(request.getCode());

        if (ingredientRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Nguyên liệu với tên '" + name + "' đã tồn tại");
        }
        if (code != null && ingredientRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Mã nguyên liệu '" + code + "' đã tồn tại");
        }

        Ingredient ingredient = ingredientMapper.toEntity(request);
        ingredient.setName(name);
        ingredient.setCode(code);
        ingredient.setUnit(request.getUnit().trim());

        Ingredient saved = ingredientRepository.save(ingredient);

        // Tồn kho ban đầu phải có dấu vết trong thẻ kho để sổ kho luôn khớp với current_stock
        if (saved.getCurrentStock().compareTo(BigDecimal.ZERO) > 0) {
            inventoryTransactionRepository.save(InventoryTransaction.builder()
                    .ingredient(saved)
                    .quantity(saved.getCurrentStock())
                    .transactionType(InventoryTransactionType.AUDIT_ADJUST)
                    .build());
        }

        return ingredientMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IngredientResponse> getAllIngredients(String search) {
        List<Ingredient> ingredients = (search == null || search.isBlank())
                ? ingredientRepository.findAllByOrderByNameAsc()
                : ingredientRepository
                        .findByNameContainingIgnoreCaseOrCodeContainingIgnoreCaseOrderByNameAsc(
                                search.trim(), search.trim());

        return ingredients.stream()
                .map(ingredientMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public IngredientResponse getIngredientById(Long id) {
        return ingredientMapper.toResponse(findIngredientOrThrow(id));
    }

    @Override
    @Transactional
    public IngredientResponse updateIngredient(Long id, IngredientUpdateRequest request) {
        Ingredient ingredient = findIngredientOrThrow(id);

        String name = request.getName().trim();
        String unit = request.getUnit().trim();

        if (ingredientRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateResourceException("Tên nguyên liệu '" + name + "' đã được sử dụng bởi nguyên liệu khác");
        }

        boolean codeProvided = request.getCode() != null;
        String code = normalizeCode(request.getCode());
        if (code != null && ingredientRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new DuplicateResourceException("Mã nguyên liệu '" + code + "' đã được sử dụng bởi nguyên liệu khác");
        }

        // Đổi đơn vị khi đã phát sinh công thức/nhập kho/thẻ kho sẽ làm sai toàn bộ định lượng cũ
        if (!ingredient.getUnit().equals(unit) && isInUse(id)) {
            throw new InvalidOperationException(
                    "Không thể đổi đơn vị tính của nguyên liệu đã được dùng trong công thức, phiếu nhập hoặc thẻ kho");
        }

        ingredientMapper.updateEntityFromDto(request, ingredient);
        ingredient.setName(name);
        ingredient.setUnit(unit);
        if (codeProvided) {
            ingredient.setCode(code);
        }

        return ingredientMapper.toResponse(ingredient);
    }

    @Override
    @Transactional
    public void deleteIngredient(Long id) {
        Ingredient ingredient = findIngredientOrThrow(id);

        if (isInUse(id)) {
            throw new InvalidOperationException(
                    "Không thể xóa nguyên liệu đã được dùng trong công thức, phiếu nhập hoặc thẻ kho");
        }

        ingredientRepository.delete(ingredient);
    }

    private boolean isInUse(Long ingredientId) {
        return recipeRepository.existsByIngredientId(ingredientId)
                || purchaseOrderItemRepository.existsByIngredientId(ingredientId)
                || inventoryTransactionRepository.existsByIngredientId(ingredientId);
    }

    private String normalizeCode(String code) {
        if (code == null) return null;
        String trimmed = code.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Ingredient findIngredientOrThrow(Long id) {
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + id));
    }
}
