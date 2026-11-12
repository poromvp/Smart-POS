package com.smartpos.sales_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartpos.sales_service.dto.request.ApplyPromotionRequest;
import com.smartpos.sales_service.dto.request.PromotionRequest;
import com.smartpos.sales_service.dto.response.ApplyPromotionResponse;
import com.smartpos.sales_service.dto.response.PromotionResponse;
import com.smartpos.sales_service.security.UserContextFilter;
import com.smartpos.sales_service.service.PromotionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@WebMvcTest(PromotionController.class)
class PromotionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private PromotionService promotionService;

    @Test
    @DisplayName("POST /api/promotions với dữ liệu hợp lệ và quyền ADMIN_DASHBOARD trả về HTTP 201 Created")
    void testCreatePromotion_ValidInput_ReturnsCreated() throws Exception {
        PromotionRequest request = PromotionRequest.builder()
                .code("SALE20")
                .name("Giảm giá 20%")
                .discountPercent(new BigDecimal("20.00"))
                .maxDiscountAmount(new BigDecimal("50000"))
                .minOrderAmount(new BigDecimal("100000"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(7))
                .build();

        PromotionResponse response = PromotionResponse.builder()
                .id(1L)
                .code("SALE20")
                .name("Giảm giá 20%")
                .discountPercent(new BigDecimal("20.00"))
                .isActive(true)
                .build();

        when(promotionService.createPromotion(any(PromotionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/promotions")
                        .header(UserContextFilter.HEADER_USER_ROLE, "MANAGER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ADMIN_DASHBOARD")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("SALE20"))
                .andExpect(jsonPath("$.data.discountPercent").value(20.00));
    }

    @Test
    @DisplayName("POST /api/promotions với discountPercent vượt quá 100% trả về HTTP 400 Bad Request")
    void testCreatePromotion_ExceedDiscountPercent_ReturnsBadRequest() throws Exception {
        PromotionRequest request = PromotionRequest.builder()
                .code("SUPERDISCOUNT")
                .name("Giảm 150%")
                .discountPercent(new BigDecimal("150.00"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(5))
                .build();

        mockMvc.perform(post("/api/promotions")
                        .header(UserContextFilter.HEADER_USER_ROLE, "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/promotions/apply (QR public) kiểm tra tính toán giảm giá trả về HTTP 200 OK")
    void testApplyPromotion_Success_ReturnsOk() throws Exception {
        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .code("SALE10")
                .subtotal(new BigDecimal("100000"))
                .build();

        ApplyPromotionResponse response = ApplyPromotionResponse.builder()
                .code("SALE10")
                .discountPercent(new BigDecimal("10.00"))
                .discountAmount(new BigDecimal("10000"))
                .finalSubtotal(new BigDecimal("90000"))
                .valid(true)
                .message("Áp dụng mã khuyến mãi thành công")
                .build();

        when(promotionService.applyPromotion(any(ApplyPromotionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/promotions/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.discountAmount").value(10000))
                .andExpect(jsonPath("$.data.finalSubtotal").value(90000))
                .andExpect(jsonPath("$.data.valid").value(true));
    }

    @Test
    @DisplayName("PUT /api/promotions/{id}/status bật/tắt khuyến mãi thành công trả về HTTP 200 OK")
    void testTogglePromotionStatus_Success_ReturnsOk() throws Exception {
        PromotionResponse response = PromotionResponse.builder()
                .id(1L)
                .code("SALE10")
                .isActive(false)
                .build();

        when(promotionService.togglePromotionStatus(eq(1L), eq(false))).thenReturn(response);

        mockMvc.perform(put("/api/promotions/1/status")
                        .header(UserContextFilter.HEADER_USER_ROLE, "MANAGER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "ADMIN_DASHBOARD")
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isActive").value(false));
    }

    @Test
    @DisplayName("Trả 403 Forbidden khi CASHIER tạo mới khuyến mãi")
    void testCreatePromotion_ForbiddenForCashier() throws Exception {
        PromotionRequest request = PromotionRequest.builder()
                .code("CASHIER10")
                .name("Không hợp lệ")
                .discountPercent(new BigDecimal("10.00"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(1))
                .build();

        mockMvc.perform(post("/api/promotions")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "POS_ACCESS,PAYMENT_PROCESS")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
