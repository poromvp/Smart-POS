package com.smartpos.sales_service.controller;

import com.smartpos.sales_service.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@Tag(name = "Health Controller", description = "Kiểm tra trạng thái sales-service")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Kiểm tra trạng thái hoạt động của sales-service")
    public ResponseEntity<ApiResponse<Map<String, String>>> healthCheck() {
        Map<String, String> healthData = Map.of(
                "service", "sales-service",
                "status", "UP",
                "port", "8083"
        );
        return ResponseEntity.ok(ApiResponse.success(healthData, "Sales Service is running"));
    }
}
