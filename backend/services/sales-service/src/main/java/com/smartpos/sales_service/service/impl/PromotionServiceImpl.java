package com.smartpos.sales_service.service.impl;

import com.smartpos.sales_service.dto.request.ApplyPromotionRequest;
import com.smartpos.sales_service.dto.request.PromotionRequest;
import com.smartpos.sales_service.dto.response.ApplyPromotionResponse;
import com.smartpos.sales_service.dto.response.PromotionResponse;
import com.smartpos.sales_service.entity.Promotion;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.PromotionRepository;
import com.smartpos.sales_service.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;

    @Override
    @Transactional
    public PromotionResponse createPromotion(PromotionRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        promotionRepository.findByCodeIgnoreCase(cleanCode).ifPresent(p -> {
            throw new BusinessException("Mã khuyến mãi đã tồn tại: " + cleanCode);
        });

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        Promotion promotion = Promotion.builder()
                .code(cleanCode)
                .name(request.getName().trim())
                .discountPercent(request.getDiscountPercent())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Promotion saved = promotionRepository.save(promotion);
        return mapToPromotionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getAllPromotions(Boolean activeOnly) {
        List<Promotion> list;
        if (Boolean.TRUE.equals(activeOnly)) {
            list = promotionRepository.findByIsActiveTrue();
        } else {
            list = promotionRepository.findAll();
        }

        return list.stream().map(this::mapToPromotionResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getPromotionById(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với ID: " + id));
        return mapToPromotionResponse(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getPromotionByCode(String code) {
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã khuyến mãi: " + code));
        return mapToPromotionResponse(promotion);
    }

    @Override
    @Transactional
    public PromotionResponse togglePromotionStatus(Long id, Boolean active) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với ID: " + id));
        promotion.setIsActive(active);
        Promotion updated = promotionRepository.save(promotion);
        return mapToPromotionResponse(updated);
    }

    @Override
    @Transactional
    public void deletePromotion(Long id) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khuyến mãi với ID: " + id));
        if (promotion.getUsedCount() != null && promotion.getUsedCount() > 0) {
            promotion.setIsActive(false);
            promotionRepository.save(promotion);
        } else {
            promotionRepository.delete(promotion);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ApplyPromotionResponse applyPromotion(ApplyPromotionRequest request) {
        String cleanCode = request.getCode().trim();
        Promotion promotion = promotionRepository.findByCodeIgnoreCase(cleanCode)
                .orElse(null);

        if (promotion == null) {
            return ApplyPromotionResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã khuyến mãi không tồn tại")
                    .build();
        }

        if (!Boolean.TRUE.equals(promotion.getIsActive())) {
            return ApplyPromotionResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã khuyến mãi hiện đang tạm ngưng áp dụng")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(promotion.getStartDate())) {
            return ApplyPromotionResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã khuyến mãi chưa đến thời gian áp dụng")
                    .build();
        }

        if (now.isAfter(promotion.getEndDate())) {
            return ApplyPromotionResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã khuyến mãi đã hết hạn sử dụng")
                    .build();
        }

        if (promotion.getUsageLimit() != null && promotion.getUsedCount() != null && promotion.getUsedCount() >= promotion.getUsageLimit()) {
            return ApplyPromotionResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Mã khuyến mãi đã đạt giới hạn số lượt sử dụng")
                    .build();
        }

        BigDecimal subtotal = request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO;
        if (promotion.getMinOrderAmount() != null && subtotal.compareTo(promotion.getMinOrderAmount()) < 0) {
            return ApplyPromotionResponse.builder()
                    .valid(false)
                    .code(cleanCode)
                    .message("Đơn hàng chưa đạt giá trị tối thiểu " + promotion.getMinOrderAmount() + "đ để áp dụng mã")
                    .build();
        }

        BigDecimal discountPercent = promotion.getDiscountPercent();
        BigDecimal discountAmount = subtotal.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        if (promotion.getMaxDiscountAmount() != null && discountAmount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
            discountAmount = promotion.getMaxDiscountAmount();
        }

        BigDecimal finalSubtotal = subtotal.subtract(discountAmount);
        if (finalSubtotal.compareTo(BigDecimal.ZERO) < 0) {
            finalSubtotal = BigDecimal.ZERO;
        }

        return ApplyPromotionResponse.builder()
                .valid(true)
                .code(promotion.getCode())
                .name(promotion.getName())
                .discountPercent(discountPercent)
                .discountAmount(discountAmount)
                .finalSubtotal(finalSubtotal)
                .message("Áp dụng mã khuyến mãi thành công! Giảm " + discountPercent + "%")
                .build();
    }

    private PromotionResponse mapToPromotionResponse(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .discountPercent(promotion.getDiscountPercent())
                .maxDiscountAmount(promotion.getMaxDiscountAmount())
                .minOrderAmount(promotion.getMinOrderAmount())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .usageLimit(promotion.getUsageLimit())
                .usedCount(promotion.getUsedCount() != null ? promotion.getUsedCount() : 0)
                .isActive(promotion.getIsActive())
                .build();
    }
}
