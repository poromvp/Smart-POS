package com.smartpos.sales_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointTransactionResponse {
    private Long id;
    private Long customerId;
    private Long orderId;
    private String orderCode;
    private Integer pointsChange;
    private String type;
    private LocalDateTime createdAt;
}
