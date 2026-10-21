package exception;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class InsufficientStockException extends RuntimeException{
    private final Long ingredientId;
    private final String ingredientName;
    private final BigDecimal currentStock;
    private final BigDecimal requiredQuantity;

    public InsufficientStockException(Long ingredientId, String ingredientName, BigDecimal currentStock, BigDecimal requiredQuantity) {
        super(String.format("Nguyên liệu '%s' (ID: %d) không đủ tồn kho. Hiện có: %s, Yêu cầu: %s",
                ingredientName, ingredientId, currentStock, requiredQuantity));
        this.ingredientId = ingredientId;
        this.ingredientName = ingredientName;
        this.currentStock = currentStock;
        this.requiredQuantity = requiredQuantity;
    }
}
