package com.smartpos.sales_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {
    private Long id;
    private String phone;
    private String fullName;
    private Integer currentPoints;
    private BigDecimal totalSpent;
    private LocalDateTime createdAt;
}
