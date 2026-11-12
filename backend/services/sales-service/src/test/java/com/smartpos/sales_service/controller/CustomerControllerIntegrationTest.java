package com.smartpos.sales_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.sales_service.dto.request.CustomerRequest;
import com.smartpos.sales_service.dto.response.CustomerResponse;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.security.UserContextFilter;
import com.smartpos.sales_service.service.CustomerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@WebMvcTest(CustomerController.class)
class CustomerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private CustomerService customerService;

    @Test
    @DisplayName("POST /api/customers với dữ liệu hợp lệ và quyền POS_ACCESS trả về HTTP 201 Created")
    void testCreateCustomer_ValidInput_ReturnsCreated() throws Exception {
        CustomerRequest request = CustomerRequest.builder()
                .phone("0901234567")
                .fullName("Nguyễn Văn A")
                .build();

        CustomerResponse response = CustomerResponse.builder()
                .id(1L)
                .phone("0901234567")
                .fullName("Nguyễn Văn A")
                .currentPoints(0)
                .totalSpent(BigDecimal.ZERO)
                .build();

        when(customerService.createCustomer(any(CustomerRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/customers")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "POS_ACCESS,PAYMENT_PROCESS")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.phone").value("0901234567"))
                .andExpect(jsonPath("$.data.fullName").value("Nguyễn Văn A"));
    }

    @Test
    @DisplayName("POST /api/customers thiếu số điện thoại trả về HTTP 400 Bad Request")
    void testCreateCustomer_BlankPhone_ReturnsBadRequest() throws Exception {
        CustomerRequest request = CustomerRequest.builder()
                .phone("")
                .fullName("Nguyễn Văn A")
                .build();

        mockMvc.perform(post("/api/customers")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "POS_ACCESS")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /api/customers/search tra cứu khách hàng theo SĐT trả về HTTP 200 OK")
    void testGetCustomerByPhone_Found_ReturnsOk() throws Exception {
        CustomerResponse response = CustomerResponse.builder()
                .id(2L)
                .phone("0909999888")
                .fullName("Trần Thị B")
                .currentPoints(15)
                .totalSpent(new BigDecimal("1500000"))
                .build();

        when(customerService.getCustomerByPhone("0909999888")).thenReturn(response);

        mockMvc.perform(get("/api/customers/search")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CASHIER")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "POS_ACCESS")
                        .param("phone", "0909999888"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("0909999888"))
                .andExpect(jsonPath("$.data.currentPoints").value(15));
    }

    @Test
    @DisplayName("GET /api/customers/{id} khi khách hàng không tồn tại trả về HTTP 404 Not Found")
    void testGetCustomerById_NotFound_ReturnsNotFound() throws Exception {
        when(customerService.getCustomerById(999L))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy khách hàng với ID: 999"));

        mockMvc.perform(get("/api/customers/999")
                        .header(UserContextFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không tìm thấy khách hàng với ID: 999"));
    }

    @Test
    @DisplayName("Trả 403 Forbidden khi CHEF hoặc GUEST gọi API khách hàng")
    void testCustomers_ForbiddenForUnauthorizedRole() throws Exception {
        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/customers/search")
                        .header(UserContextFilter.HEADER_USER_ROLE, "CHEF")
                        .header(UserContextFilter.HEADER_USER_PERMISSIONS, "KDS_VIEW,KDS_UPDATE")
                        .param("phone", "0909999888"))
                .andExpect(status().isForbidden());
    }
}
