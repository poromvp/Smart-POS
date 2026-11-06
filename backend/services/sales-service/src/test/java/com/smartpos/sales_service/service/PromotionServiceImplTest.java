package com.smartpos.sales_service.service;

import com.smartpos.sales_service.dto.request.ApplyPromotionRequest;
import com.smartpos.sales_service.dto.request.PromotionRequest;
import com.smartpos.sales_service.dto.response.ApplyPromotionResponse;
import com.smartpos.sales_service.dto.response.PromotionResponse;
import com.smartpos.sales_service.entity.Promotion;
import com.smartpos.sales_service.exception.BusinessException;
import com.smartpos.sales_service.exception.ResourceNotFoundException;
import com.smartpos.sales_service.repository.PromotionRepository;
import com.smartpos.sales_service.service.impl.PromotionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotionServiceImplTest {

    @Mock
    private PromotionRepository promotionRepository;

    @InjectMocks
    private PromotionServiceImpl promotionService;

    private Promotion samplePromo;

    @BeforeEach
    void setUp() {
        samplePromo = Promotion.builder()
                .id(1L)
                .code("GIAM10")
                .name("Giảm 10% tối đa 30k")
                .discountPercent(new BigDecimal("10"))
                .maxDiscountAmount(new BigDecimal("30000"))
                .minOrderAmount(new BigDecimal("100000"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .usageLimit(100)
                .usedCount(5)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Tạo mã khuyến mãi thành công")
    void testCreatePromotion_Success() {
        PromotionRequest request = PromotionRequest.builder()
                .code("NEWYEAR")
                .name("Năm Mới Giảm Giá")
                .discountPercent(new BigDecimal("15"))
                .maxDiscountAmount(new BigDecimal("50000"))
                .minOrderAmount(new BigDecimal("150000"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(10))
                .usageLimit(50)
                .isActive(true)
                .build();

        when(promotionRepository.findByCodeIgnoreCase("NEWYEAR")).thenReturn(Optional.empty());
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(i -> {
            Promotion p = i.getArgument(0);
            p.setId(2L);
            return p;
        });

        PromotionResponse res = promotionService.createPromotion(request);

        assertThat(res).isNotNull();
        assertThat(res.getCode()).isEqualTo("NEWYEAR");
        assertThat(res.getDiscountPercent()).isEqualByComparingTo("15");
        verify(promotionRepository).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Tạo mã khuyến mãi thất bại khi mã đã tồn tại")
    void testCreatePromotion_DuplicateCode_ThrowsBusinessException() {
        PromotionRequest request = PromotionRequest.builder()
                .code("GIAM10")
                .name("Trùng mã")
                .discountPercent(new BigDecimal("10"))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        assertThatThrownBy(() -> promotionService.createPromotion(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Mã khuyến mãi đã tồn tại");

        verify(promotionRepository, never()).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Tạo mã khuyến mãi thất bại khi ngày kết thúc trước ngày bắt đầu")
    void testCreatePromotion_EndDateBeforeStartDate_ThrowsBusinessException() {
        PromotionRequest request = PromotionRequest.builder()
                .code("INVALIDDATE")
                .name("Ngày lỗi")
                .discountPercent(new BigDecimal("10"))
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(2))
                .build();

        when(promotionRepository.findByCodeIgnoreCase("INVALIDDATE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> promotionService.createPromotion(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ngày kết thúc phải sau ngày bắt đầu");
    }

    @Test
    @DisplayName("Áp dụng mã khuyến mãi thành công với phần trăm thông thường")
    void testApplyPromotion_ValidPercentage_Success() {
        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        ApplyPromotionRequest req = ApplyPromotionRequest.builder()
                .code("GIAM10")
                .subtotal(new BigDecimal("200000")) // 10% của 200k = 20k
                .build();

        ApplyPromotionResponse res = promotionService.applyPromotion(req);

        assertThat(res.getValid()).isTrue();
        assertThat(res.getDiscountAmount()).isEqualByComparingTo("20000");
        assertThat(res.getFinalSubtotal()).isEqualByComparingTo("180000");
    }

    @Test
    @DisplayName("Áp dụng mã khuyến mãi chạm trần giảm giá tối đa (Max Cap)")
    void testApplyPromotion_CapMaxDiscount_Success() {
        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        ApplyPromotionRequest req = ApplyPromotionRequest.builder()
                .code("GIAM10")
                .subtotal(new BigDecimal("500000")) // 10% của 500k = 50k, trần là 30k
                .build();

        ApplyPromotionResponse res = promotionService.applyPromotion(req);

        assertThat(res.getValid()).isTrue();
        assertThat(res.getDiscountAmount()).isEqualByComparingTo("30000"); // Chặn ở mức 30k
        assertThat(res.getFinalSubtotal()).isEqualByComparingTo("470000");
    }

    @Test
    @DisplayName("Áp dụng mã thất bại khi giá trị đơn chưa đạt mức tối thiểu")
    void testApplyPromotion_MinOrderAmountNotMet_ReturnsInvalid() {
        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        ApplyPromotionRequest req = ApplyPromotionRequest.builder()
                .code("GIAM10")
                .subtotal(new BigDecimal("80000")) // Tối thiểu yêu cầu 100k
                .build();

        ApplyPromotionResponse res = promotionService.applyPromotion(req);

        assertThat(res.getValid()).isFalse();
        assertThat(res.getMessage()).contains("chưa đạt giá trị tối thiểu");
    }

    @Test
    @DisplayName("Áp dụng mã thất bại khi mã đã hết hạn")
    void testApplyPromotion_ExpiredVoucher_ReturnsInvalid() {
        samplePromo.setEndDate(LocalDateTime.now().minusDays(1));
        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        ApplyPromotionRequest req = ApplyPromotionRequest.builder()
                .code("GIAM10")
                .subtotal(new BigDecimal("200000"))
                .build();

        ApplyPromotionResponse res = promotionService.applyPromotion(req);

        assertThat(res.getValid()).isFalse();
        assertThat(res.getMessage()).contains("đã hết hạn");
    }

    @Test
    @DisplayName("Áp dụng mã thất bại khi mã đang bị tạm ngưng")
    void testApplyPromotion_InactiveVoucher_ReturnsInvalid() {
        samplePromo.setIsActive(false);
        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        ApplyPromotionRequest req = ApplyPromotionRequest.builder()
                .code("GIAM10")
                .subtotal(new BigDecimal("200000"))
                .build();

        ApplyPromotionResponse res = promotionService.applyPromotion(req);

        assertThat(res.getValid()).isFalse();
        assertThat(res.getMessage()).contains("tạm ngưng");
    }

    @Test
    @DisplayName("Áp dụng mã thất bại khi vượt quá giới hạn lượt sử dụng")
    void testApplyPromotion_UsageLimitReached_ReturnsInvalid() {
        samplePromo.setUsedCount(100);
        samplePromo.setUsageLimit(100);
        when(promotionRepository.findByCodeIgnoreCase("GIAM10")).thenReturn(Optional.of(samplePromo));

        ApplyPromotionRequest req = ApplyPromotionRequest.builder()
                .code("GIAM10")
                .subtotal(new BigDecimal("200000"))
                .build();

        ApplyPromotionResponse res = promotionService.applyPromotion(req);

        assertThat(res.getValid()).isFalse();
        assertThat(res.getMessage()).contains("đạt giới hạn");
    }

    @Test
    @DisplayName("Bật tắt trạng thái khuyến mãi thành công")
    void testTogglePromotionStatus_Success() {
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromo));
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(i -> i.getArgument(0));

        PromotionResponse res = promotionService.togglePromotionStatus(1L, false);

        assertThat(res.getIsActive()).isFalse();
        verify(promotionRepository).save(samplePromo);
    }

    @Test
    @DisplayName("Xóa khuyến mãi đã có lượt dùng sẽ chuyển thành inactive (Soft Delete)")
    void testDeletePromotion_WithUsage_SoftDeletes() {
        samplePromo.setUsedCount(5);
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromo));

        promotionService.deletePromotion(1L);

        assertThat(samplePromo.getIsActive()).isFalse();
        verify(promotionRepository).save(samplePromo);
        verify(promotionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Xóa khuyến mãi chưa từng dùng sẽ xóa vĩnh viễn khỏi database")
    void testDeletePromotion_NoUsage_HardDeletes() {
        samplePromo.setUsedCount(0);
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromo));

        promotionService.deletePromotion(1L);

        verify(promotionRepository).delete(samplePromo);
    }
}
