package com.smartpos.sales_service.service.impl;

import com.smartpos.sales_service.dto.request.CustomerRequest;
import com.smartpos.sales_service.dto.response.CustomerResponse;
import com.smartpos.sales_service.dto.response.PointTransactionResponse;
import com.smartpos.sales_service.entity.Customer;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.CustomerRepository;
import com.smartpos.sales_service.repository.PointTransactionRepository;
import com.smartpos.sales_service.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        String cleanPhone = request.getPhone().trim();
        customerRepository.findByPhone(cleanPhone).ifPresent(c -> {
            throw new BusinessException("Số điện thoại này đã được đăng ký: " + cleanPhone);
        });

        Customer customer = Customer.builder()
                .phone(cleanPhone)
                .fullName(request.getFullName() != null ? request.getFullName().trim() : null)
                .currentPoints(0)
                .totalSpent(BigDecimal.ZERO)
                .build();

        Customer saved = customerRepository.save(customer);
        return mapToCustomerResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng với SĐT: " + phone));
        return mapToCustomerResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng với ID: " + id));
        return mapToCustomerResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers(String search) {
        List<Customer> customers;
        if (search != null && !search.isBlank()) {
            String q = search.trim();
            customers = customerRepository.findByPhoneContaining(q);
            if (customers.isEmpty()) {
                customers = customerRepository.findByFullNameContainingIgnoreCase(q);
            }
        } else {
            customers = customerRepository.findAll();
        }

        return customers.stream()
                .map(this::mapToCustomerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PointTransactionResponse> getCustomerTransactions(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Không tìm thấy khách hàng với ID: " + customerId);
        }

        return pointTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(pt -> PointTransactionResponse.builder()
                        .id(pt.getId())
                        .customerId(pt.getCustomer().getId())
                        .orderId(pt.getOrder() != null ? pt.getOrder().getId() : null)
                        .orderCode(pt.getOrder() != null ? pt.getOrder().getOrderCode() : null)
                        .pointsChange(pt.getPointsChange())
                        .type(pt.getType())
                        .createdAt(pt.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private CustomerResponse mapToCustomerResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .phone(customer.getPhone())
                .fullName(customer.getFullName())
                .currentPoints(customer.getCurrentPoints() != null ? customer.getCurrentPoints() : 0)
                .totalSpent(customer.getTotalSpent() != null ? customer.getTotalSpent() : BigDecimal.ZERO)
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
