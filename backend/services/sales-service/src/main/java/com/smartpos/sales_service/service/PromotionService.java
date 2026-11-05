package com.smartpos.sales_service.service;

import com.smartpos.sales_service.dto.request.ApplyPromotionRequest;
import com.smartpos.sales_service.dto.request.PromotionRequest;
import com.smartpos.sales_service.dto.response.ApplyPromotionResponse;
import com.smartpos.sales_service.dto.response.PromotionResponse;

import java.util.List;

public interface PromotionService {
    PromotionResponse createPromotion(PromotionRequest request);
    List<PromotionResponse> getAllPromotions(Boolean activeOnly);
    PromotionResponse getPromotionById(Long id);
    PromotionResponse getPromotionByCode(String code);
    PromotionResponse togglePromotionStatus(Long id, Boolean active);
    void deletePromotion(Long id);
    ApplyPromotionResponse applyPromotion(ApplyPromotionRequest request);
}
