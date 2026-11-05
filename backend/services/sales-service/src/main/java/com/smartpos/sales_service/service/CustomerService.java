package com.smartpos.sales_service.service;

import com.smartpos.sales_service.dto.request.CustomerRequest;
import com.smartpos.sales_service.dto.response.CustomerResponse;
import com.smartpos.sales_service.dto.response.PointTransactionResponse;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerRequest request);
    CustomerResponse getCustomerByPhone(String phone);
    CustomerResponse getCustomerById(Long id);
    List<CustomerResponse> getAllCustomers(String search);
    List<PointTransactionResponse> getCustomerTransactions(Long customerId);
}
