package com.smartpos.sales_service.security;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserContextFilterTest {

    private UserContextFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new UserContextFilter();
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = new MockFilterChain();
        UserContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        UserContextHolder.clear();
    }

    @Test
    @DisplayName("Trích xuất đầy đủ 4 header và lưu chuẩn vào UserContextHolder trong filter chain")
    void testFilter_WithFullHeaders() throws ServletException, IOException {
        request.addHeader(UserContextFilter.HEADER_USER_ID, "101");
        request.addHeader(UserContextFilter.HEADER_USER_ROLE, "CASHIER");
        request.addHeader(UserContextFilter.HEADER_USER_PERMISSIONS, "ORDER_CREATE,ORDER_CANCEL");
        request.addHeader(UserContextFilter.HEADER_USER_NAME, "Thu ngân Mai");

        filter.doFilter(request, response, (req, res) -> {
            UserContext ctx = UserContextHolder.getContext();
            assertThat(ctx).isNotNull();
            assertThat(ctx.getUserId()).isEqualTo("101");
            assertThat(ctx.getRole()).isEqualTo("CASHIER");
            assertThat(ctx.getUsername()).isEqualTo("Thu ngân Mai");
            assertThat(ctx.getPermissions()).containsExactly("ORDER_CREATE", "ORDER_CANCEL");
        });

        // Xác nhận sau filter chain, context đã được xóa chống rò rỉ bộ nhớ ThreadPool
        assertThat(UserContextHolder.getContext()).isNull();
    }

    @Test
    @DisplayName("Không có header tự động gán fallback an toàn userId=anonymous và role=GUEST")
    void testFilter_WithoutHeaders_AppliesFallback() throws ServletException, IOException {
        filter.doFilter(request, response, (req, res) -> {
            UserContext ctx = UserContextHolder.getContext();
            assertThat(ctx).isNotNull();
            assertThat(ctx.getUserId()).isEqualTo("anonymous");
            assertThat(ctx.getRole()).isEqualTo("GUEST");
            assertThat(ctx.getUsername()).isEqualTo("Guest User");
            assertThat(ctx.getPermissions()).isEmpty();
        });

        assertThat(UserContextHolder.getContext()).isNull();
    }

    @Test
    @DisplayName("Header permissions có nhiều giá trị phân tách dấu phẩy được parse thành List<String> đã loại bỏ khoảng trắng")
    void testFilter_WithCommaSeparatedPermissions_ParsesListCorrectly() throws ServletException, IOException {
        request.addHeader(UserContextFilter.HEADER_USER_ID, "102");
        request.addHeader(UserContextFilter.HEADER_USER_ROLE, "MANAGER");
        request.addHeader(UserContextFilter.HEADER_USER_PERMISSIONS, "  ORDER_VIEW , ORDER_UPDATE ,  DISCOUNT_APPLY  ");

        filter.doFilter(request, response, (req, res) -> {
            UserContext ctx = UserContextHolder.getContext();
            assertThat(ctx).isNotNull();
            assertThat(ctx.getPermissions()).containsExactly("ORDER_VIEW", "ORDER_UPDATE", "DISCOUNT_APPLY");
        });

        assertThat(UserContextHolder.getContext()).isNull();
    }

    @Test
    @DisplayName("Khối finally luôn dọn dẹp UserContextHolder.clear() ngay cả khi filterChain ném ngoại lệ")
    void testFilter_CleansUpContextInFinally_EvenOnException() {
        request.addHeader(UserContextFilter.HEADER_USER_ID, "103");
        request.addHeader(UserContextFilter.HEADER_USER_ROLE, "ADMIN");

        assertThatThrownBy(() -> filter.doFilter(request, response, (req, res) -> {
            assertThat(UserContextHolder.getContext()).isNotNull();
            throw new RuntimeException("Lỗi xảy ra trong filter chain");
        })).isInstanceOf(RuntimeException.class).hasMessage("Lỗi xảy ra trong filter chain");

        // Đảm bảo context luôn được giải phóng trong finally
        assertThat(UserContextHolder.getContext()).isNull();
    }
}
