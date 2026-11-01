package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.IngredientCreateRequest;
import com.smartpos.cataloginventory.dto.request.IngredientUpdateRequest;
import com.smartpos.cataloginventory.dto.response.IngredientResponse;

import java.util.List;

public interface IngredientService {
    IngredientResponse createIngredient(IngredientCreateRequest request);
    List<IngredientResponse> getAllIngredients(String search, Boolean activeOnly);
    IngredientResponse getIngredientById(Long id);
    IngredientResponse updateIngredient(Long id, IngredientUpdateRequest request);
    void toggleIngredientStatus(Long id, Boolean isActive);
    void deleteIngredient(Long id);
}
