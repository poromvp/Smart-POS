package com.smartpos.cataloginventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.cataloginventory.domain.InventoryTransactionType;
import com.smartpos.cataloginventory.dto.request.DeductInventoryRequest;
import com.smartpos.cataloginventory.dto.request.DeductItemRequest;
import com.smartpos.cataloginventory.dto.request.InventoryAdjustmentRequest;
import com.smartpos.cataloginventory.dto.response.DeductInventoryResponse;
import com.smartpos.cataloginventory.dto.response.InventoryAdjustmentResponse;
import com.smartpos.cataloginventory.exception.InsufficientStockException;
import com.smartpos.cataloginventory.service.InventoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@WebMvcTest(InventoryController.class)
class InventoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private InventoryService inventoryService;

    @Test
    @DisplayName("POST /api/inventory/deduct khi đủ kho trả về HTTP 200 OK")
    void testDeductInventory_SufficientStock_ReturnsOk() throws Exception {
        DeductItemRequest item = new DeductItemRequest();
        item.setProductId(101L);
        item.setQuantity(2);
        item.setModifierOptionIds(Collections.emptySet());

        DeductInventoryRequest request = new DeductInventoryRequest();
        request.setOrderCode("ORD-20261105-001");
        request.setItems(List.of(item));

        DeductInventoryResponse response = DeductInventoryResponse.builder()
                .orderCode("ORD-20261105-001")
                .deductions(List.of())
                .build();

        when(inventoryService.deductInventory(any(DeductInventoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/inventory/deduct")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Trừ kho thành công"))
                .andExpect(jsonPath("$.data.orderCode").value("ORD-20261105-001"));
    }

    @Test
    @DisplayName("POST /api/inventory/deduct khi thiếu kho trả về lỗi và thông tin nguyên liệu thiếu")
    void testDeductInventory_InsufficientStock_ReturnsConflict() throws Exception {
        DeductItemRequest item = new DeductItemRequest();
        item.setProductId(101L);
        item.setQuantity(5);
        item.setModifierOptionIds(Collections.emptySet());

        DeductInventoryRequest request = new DeductInventoryRequest();
        request.setOrderCode("ORD-20261105-002");
        request.setItems(List.of(item));

        when(inventoryService.deductInventory(any(DeductInventoryRequest.class)))
                .thenThrow(new InsufficientStockException(1L, "Thịt bò Mỹ", new BigDecimal("0.50"), new BigDecimal("1.00")));

        mockMvc.perform(post("/api/inventory/deduct")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Insufficient Inventory Stock"))
                .andExpect(jsonPath("$.ingredientName").value("Thịt bò Mỹ"));
    }

    @Test
    @DisplayName("POST /api/inventory/adjust xuất hủy hỏng hóc trả về HTTP 200 OK")
    void testAdjustInventory_Spoilage_ReturnsOk() throws Exception {
        InventoryAdjustmentRequest req = new InventoryAdjustmentRequest();
        req.setIngredientId(1L);
        req.setType(InventoryTransactionType.SPOILAGE);
        req.setQuantity(new BigDecimal("2.00"));
        req.setReason("Hết hạn");

        InventoryAdjustmentResponse res = InventoryAdjustmentResponse.builder()
                .ingredientId(1L)
                .ingredientName("Thịt bò Mỹ")
                .type(InventoryTransactionType.SPOILAGE)
                .stockBefore(new BigDecimal("10.00"))
                .stockAfter(new BigDecimal("8.00"))
                .build();

        when(inventoryService.adjustInventory(any(InventoryAdjustmentRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/inventory/adjust")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Ghi nhận xuất hủy hỏng hóc thành công"))
                .andExpect(jsonPath("$.data.stockAfter").value(8.00));
    }
}
