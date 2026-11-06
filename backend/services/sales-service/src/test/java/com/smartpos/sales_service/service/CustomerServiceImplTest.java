package com.smartpos.sales_service.service;

import com.smartpos.sales_service.dto.request.CustomerRequest;
import com.smartpos.sales_service.dto.response.CustomerResponse;
import com.smartpos.sales_service.dto.response.PointTransactionResponse;
import com.smartpos.sales_service.entity.Customer;
import com.smartpos.sales_service.entity.PointTransaction;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.CustomerRepository;
import com.smartpos.sales_service.repository.PointTransactionRepository;
import com.smartpos.sales_service.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        sampleCustomer = Customer.builder()
                .id(1L)
                .phone("0901234567")
                .fullName("Nguyễn Văn A")
                .currentPoints(15)
                .totalSpent(new BigDecimal("1500000"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Tạo khách hàng mới thành công với điểm ban đầu = 0")
    void testCreateCustomer_Success() {
        CustomerRequest request = CustomerRequest.builder()
                .phone("0987654321")
                .fullName("Trần Thị B")
                .build();

        when(customerRepository.findByPhone("0987654321")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(i -> {
            Customer c = i.getArgument(0);
            c.setId(2L);
            return c;
        });

        CustomerResponse response = customerService.createCustomer(request);

        assertThat(response).isNotNull();
        assertThat(response.getPhone()).isEqualTo("0987654321");
        assertThat(response.getFullName()).isEqualTo("Trần Thị B");
        assertThat(response.getCurrentPoints()).isEqualTo(0);
        assertThat(response.getTotalSpent()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    @DisplayName("Tạo khách hàng thất bại khi số điện thoại đã tồn tại")
    void testCreateCustomer_DuplicatePhone_ThrowsBusinessException() {
        CustomerRequest request = CustomerRequest.builder()
                .phone("0901234567")
                .fullName("Nguyễn Văn A")
                .build();

        when(customerRepository.findByPhone("0901234567")).thenReturn(Optional.of(sampleCustomer));

        assertThatThrownBy(() -> customerService.createCustomer(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Số điện thoại này đã được đăng ký");

        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    @DisplayName("Tìm khách hàng theo SĐT thành công")
    void testGetCustomerByPhone_Success() {
        when(customerRepository.findByPhone("0901234567")).thenReturn(Optional.of(sampleCustomer));

        CustomerResponse response = customerService.getCustomerByPhone("0901234567");

        assertThat(response).isNotNull();
        assertThat(response.getPhone()).isEqualTo("0901234567");
        assertThat(response.getCurrentPoints()).isEqualTo(15);
    }

    @Test
    @DisplayName("Tìm khách hàng theo SĐT thất bại khi không tồn tại")
    void testGetCustomerByPhone_NotFound_ThrowsResourceNotFoundException() {
        when(customerRepository.findByPhone("0000000000")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerByPhone("0000000000"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy khách hàng");
    }

    @Test
    @DisplayName("Tìm khách hàng theo ID thành công")
    void testGetCustomerById_Success() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));

        CustomerResponse response = customerService.getCustomerById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Lấy danh sách khách hàng có tìm kiếm theo tên hoặc SĐT")
    void testGetAllCustomers_WithSearch() {
        when(customerRepository.findByPhoneContaining("090")).thenReturn(List.of(sampleCustomer));

        List<CustomerResponse> list = customerService.getAllCustomers("090");

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getPhone()).isEqualTo("0901234567");
    }

    @Test
    @DisplayName("Lấy lịch sử giao dịch điểm tích lũy của khách hàng thành công")
    void testGetCustomerTransactions_Success() {
        PointTransaction tx = PointTransaction.builder()
                .id(10L)
                .customer(sampleCustomer)
                .pointsChange(5)
                .type("EARN")
                .createdAt(LocalDateTime.now())
                .build();

        when(customerRepository.existsById(1L)).thenReturn(true);
        when(pointTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(tx));

        List<PointTransactionResponse> history = customerService.getCustomerTransactions(1L);

        assertThat(history).hasSize(1);
        assertThat(history.get(0).getPointsChange()).isEqualTo(5);
        assertThat(history.get(0).getType()).isEqualTo("EARN");
    }

    @Test
    @DisplayName("Lấy lịch sử giao dịch điểm thất bại khi khách hàng không tồn tại")
    void testGetCustomerTransactions_NotFound_ThrowsException() {
        when(customerRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> customerService.getCustomerTransactions(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy khách hàng");
    }
}
