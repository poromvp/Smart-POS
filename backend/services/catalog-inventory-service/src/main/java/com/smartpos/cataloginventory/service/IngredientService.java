package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.IngredientCreateRequest;
import com.smartpos.cataloginventory.dto.request.IngredientUpdateRequest;
import com.smartpos.cataloginventory.dto.response.IngredientResponse;

import java.util.List;

public interface IngredientService {
    IngredientResponse createIngredient(IngredientCreateRequest request);
    List<IngredientResponse> getAllIngredients(String search);
    IngredientResponse getIngredientById(Long id);
    IngredientResponse updateIngredient(Long id, IngredientUpdateRequest request);
    void deleteIngredient(Long id);
}
