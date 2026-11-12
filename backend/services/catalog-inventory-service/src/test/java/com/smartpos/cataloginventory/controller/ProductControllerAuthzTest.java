package com.smartpos.cataloginventory.controller;

import com.smartpos.cataloginventory.security.CorrelationIdFilter;
import com.smartpos.cataloginventory.security.UserContextFilter;
import com.smartpos.cataloginventory.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@WebMvcTest(ProductController.class)
class ProductControllerAuthzTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/products/menu cho phép ẩn danh và giữ X-Correlation-Id")
    void shouldAllowPublicMenuAndForwardCorrelationId() throws Exception {
        when(productService.getMenu()).thenReturn(List.of());

        mockMvc.perform(get("/api/products/menu")
                        .header(CorrelationIdFilter.HEADER_CORRELATION_ID, "cid-menu-01"))
                .andExpect(status().isOk())
                .andExpect(header().string(CorrelationIdFilter.HEADER_CORRELATION_ID, "cid-menu-01"));
    }

    @Test
    @DisplayName("Kiểm tra 403 Forbidden trên ProductController khi thiếu quyền MENU_READ hoặc MENU_DELETE")
    void shouldEnforceMenuPermissions() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/products/1")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "MENU_READ,POS_ACCESS"))
                .andExpect(status().isForbidden());

        when(productService.getProducts(null, null, null)).thenReturn(List.of());
        mockMvc.perform(get("/api/products")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "MENU_READ,POS_ACCESS"))
                .andExpect(status().isOk());
    }
}
