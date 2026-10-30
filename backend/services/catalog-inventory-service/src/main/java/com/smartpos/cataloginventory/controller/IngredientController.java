package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.dto.request.IngredientCreateRequest;
import com.smartpos.cataloginventory.dto.request.IngredientUpdateRequest;
import com.smartpos.cataloginventory.dto.response.ApiResponse;
import com.smartpos.cataloginventory.dto.response.IngredientResponse;
import com.smartpos.cataloginventory.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class IngredientController {
    private final IngredientService ingredientService;

    @PostMapping
    public ResponseEntity<ApiResponse<IngredientResponse>> createIngredient(
            @Valid @RequestBody IngredientCreateRequest request) {
        IngredientResponse response = ingredientService.createIngredient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Tạo nguyên liệu thành công"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getAllIngredients(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.getAllIngredients(search)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IngredientResponse>> getIngredientById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(ingredientService.getIngredientById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<IngredientResponse>> updateIngredient(
            @PathVariable Long id,
            @Valid @RequestBody IngredientUpdateRequest request) {
        IngredientResponse response = ingredientService.updateIngredient(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Cập nhật nguyên liệu thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIngredient(@PathVariable Long id) {
        ingredientService.deleteIngredient(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa nguyên liệu thành công"));
    }
}
