package com.smartpos.sales_service.controller;

import com.smartpos.sales_service.dto.request.*;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.dto.response.PageResponse;
import com.smartpos.sales_service.dto.response.SalesStatisticsResponse;
import com.smartpos.sales_service.entity.ItemKdsStatus;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order Controller", description = "Quản lý đơn hàng POS & QR Ordering")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Tạo mới đơn hàng (từ QR Ordering hoặc POS)")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse createdOrder = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdOrder, "Tạo đơn hàng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết đơn hàng theo ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order, "Lấy thông tin đơn hàng thành công"));
    }

    @GetMapping("/code/{orderCode}")
    @Operation(summary = "Lấy chi tiết đơn hàng theo mã đơn")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(@PathVariable String orderCode) {
        OrderResponse order = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.success(order, "Lấy thông tin đơn hàng thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách đơn hàng (hỗ trợ phân trang, lọc thời gian hoặc lấy toàn bộ)")
    public ResponseEntity<ApiResponse<?>> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String tableNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size,
            @RequestParam(required = false, defaultValue = "createdAt,desc") String sort) {
        if (page != null) {
            PageResponse<OrderResponse> paged = orderService.getPagedOrders(
                    status, tableNumber, startDate, endDate, search, page, size, sort);
            return ResponseEntity.ok(ApiResponse.success(paged, "Lấy danh sách đơn hàng phân trang thành công"));
        }
        List<OrderResponse> orders = orderService.getOrders(status, tableNumber);
        return ResponseEntity.ok(ApiResponse.success(orders, "Lấy danh sách đơn hàng thành công"));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê doanh thu và báo cáo bán hàng theo kỳ (today, yesterday, week, month)")
    public ResponseEntity<ApiResponse<SalesStatisticsResponse>> getSalesStatistics(
            @RequestParam(required = false, defaultValue = "today") String period) {
        SalesStatisticsResponse statistics = orderService.getSalesStatistics(period);
        return ResponseEntity.ok(ApiResponse.success(statistics, "Lấy dữ liệu thống kê thành công"));
    }

    @PostMapping("/{id}/checkout")
    @Operation(summary = "Thanh toán đơn hàng (hỗ trợ voucher, tích điểm, trừ kho)")
    public ResponseEntity<ApiResponse<OrderResponse>> checkoutOrder(
            @PathVariable Long id,
            @Valid @RequestBody CheckoutOrderRequest request) {
        OrderResponse response = orderService.checkoutOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Thanh toán đơn hàng thành công"));
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Thêm món vào đơn hàng đang phục vụ")
    public ResponseEntity<ApiResponse<OrderResponse>> addItemsToOrder(
            @PathVariable Long id,
            @Valid @RequestBody List<CreateOrderItemRequest> newItems) {
        OrderResponse response = orderService.addItemsToOrder(id, newItems);
        return ResponseEntity.ok(ApiResponse.success(response, "Thêm món vào đơn hàng thành công"));
    }

    @PatchMapping("/{orderId}/items/{itemId}/kds-status")
    @Operation(summary = "Cập nhật trạng thái chế biến KDS của món ăn")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderItemKdsStatus(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestParam ItemKdsStatus status) {
        OrderResponse response = orderService.updateOrderItemKdsStatus(orderId, itemId, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái món thành công"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng (CONFIRMED, PREPARING, READY, COMPLETED, ...)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderResponse updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái đơn hàng thành công"));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Hoàn tất đơn hàng và tự động trừ kho nguyên liệu")
    public ResponseEntity<ApiResponse<OrderResponse>> completeOrder(@PathVariable Long id) {
        OrderResponse completed = orderService.completeOrder(id);
        return ResponseEntity.ok(ApiResponse.success(completed, "Hoàn tất đơn hàng và trừ kho thành công"));
    }

    @PatchMapping("/{id}/payment")
    @Operation(summary = "Cập nhật thông tin thanh toán cho đơn hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> updatePayment(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentRequest request) {
        OrderResponse updated = orderService.updatePayment(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thanh toán thành công"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hủy đơn hàng")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Hủy theo yêu cầu") String reason) {
        orderService.cancelOrder(id, reason);
        return ResponseEntity.ok(ApiResponse.success(null, "Hủy đơn hàng thành công"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn hàng có kèm lý do")
    public ResponseEntity<ApiResponse<Void>> cancelOrderWithBody(
            @PathVariable Long id,
            @RequestBody(required = false) CancelOrderRequest request) {
        String reason = (request != null && request.getReason() != null) ? request.getReason() : "Hủy theo yêu cầu";
        orderService.cancelOrder(id, reason);
        return ResponseEntity.ok(ApiResponse.success(null, "Hủy đơn hàng thành công"));
    }
}
