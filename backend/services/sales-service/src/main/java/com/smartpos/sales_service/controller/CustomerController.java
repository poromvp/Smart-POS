package com.smartpos.sales_service.controller;

import com.smartpos.sales_service.dto.request.CustomerRequest;
import com.smartpos.sales_service.dto.response.ApiResponse;
import com.smartpos.sales_service.dto.response.CustomerResponse;
import com.smartpos.sales_service.dto.response.PointTransactionResponse;
import com.smartpos.sales_service.security.RequirePermissions;
import com.smartpos.sales_service.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@RequirePermissions(anyOf = {"POS_ACCESS", "PAYMENT_PROCESS", "REPORT_VIEW", "ADMIN_DASHBOARD"})
@Tag(name = "Customer Controller", description = "Quản lý khách hàng thân thiết & tích điểm")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @Operation(summary = "Đăng ký nhanh khách hàng mới")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký khách hàng thành công"));
    }

    @GetMapping("/search")
    @Operation(summary = "Tra cứu khách hàng theo số điện thoại")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerByPhone(@RequestParam String phone) {
        CustomerResponse response = customerService.getCustomerByPhone(phone);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu khách hàng thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin khách hàng theo ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin khách hàng thành công"));
    }

    @GetMapping
    @Operation(summary = "Danh sách khách hàng (hỗ trợ tìm kiếm theo SĐT hoặc tên)")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getAllCustomers(
            @RequestParam(required = false) String search) {
        List<CustomerResponse> responses = customerService.getAllCustomers(search);
        return ResponseEntity.ok(ApiResponse.success(responses, "Lấy danh sách khách hàng thành công"));
    }

    @GetMapping("/{id}/transactions")
    @Operation(summary = "Lịch sử tích/đổi điểm của khách hàng")
    public ResponseEntity<ApiResponse<List<PointTransactionResponse>>> getCustomerTransactions(@PathVariable Long id) {
        List<PointTransactionResponse> responses = customerService.getCustomerTransactions(id);
        return ResponseEntity.ok(ApiResponse.success(responses, "Lấy lịch sử giao dịch điểm thành công"));
    }
}
