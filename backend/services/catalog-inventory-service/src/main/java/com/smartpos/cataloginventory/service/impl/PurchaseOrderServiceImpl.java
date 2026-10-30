package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.*;
import com.smartpos.cataloginventory.dto.request.PurchaseOrderCreateRequest;
import com.smartpos.cataloginventory.dto.request.PurchaseOrderItemRequest;
import com.smartpos.cataloginventory.dto.request.PurchaseOrderUpdateRequest;
import com.smartpos.cataloginventory.dto.response.PurchaseOrderResponse;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.PurchaseOrderMapper;
import com.smartpos.cataloginventory.repository.IngredientRepository;
import com.smartpos.cataloginventory.repository.InventoryTransactionRepository;
import com.smartpos.cataloginventory.repository.PurchaseOrderRepository;
import com.smartpos.cataloginventory.repository.SupplierRepository;
import com.smartpos.cataloginventory.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;

    @Override
    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderCreateRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + request.getSupplierId()));

        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new InvalidOperationException("Nhà cung cấp '" + supplier.getName() + "' đang ở trạng thái ngừng hoạt động");
        }

        Map<Long, Ingredient> ingredientMap = loadAndValidateIngredients(request.getItems());

        String poNumber = generateUniquePoNumber();

        PurchaseOrder po = PurchaseOrder.builder()
                .poNumber(poNumber)
                .supplier(supplier)
                .staffId(request.getStaffId())
                .orderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now())
                .deliveryDate(request.getDeliveryDate())
                .status(PurchaseOrderStatus.DRAFT)
                .note(request.getNote())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PurchaseOrderItem> items = new ArrayList<>();
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Ingredient ing = ingredientMap.get(itemReq.getIngredientId());
            BigDecimal lineTotal = itemReq.getQuantity().multiply(itemReq.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(lineTotal);

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .ingredient(ing)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(lineTotal)
                    .expiryDate(itemReq.getExpiryDate())
                    .build();
            items.add(item);
        }

        po.setTotalAmount(totalAmount);
        po.setItems(items);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return purchaseOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse updatePurchaseOrder(Long id, PurchaseOrderUpdateRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findWithDetailsByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new InvalidOperationException("Chỉ được chỉnh sửa phiếu nhập ở trạng thái DRAFT. Phiếu hiện tại: " + po.getStatus());
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + request.getSupplierId()));

        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new InvalidOperationException("Nhà cung cấp '" + supplier.getName() + "' đang ở trạng thái ngừng hoạt động");
        }

        Map<Long, Ingredient> ingredientMap = loadAndValidateIngredients(request.getItems());

        po.setSupplier(supplier);
        po.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : po.getOrderDate());
        po.setDeliveryDate(request.getDeliveryDate());
        po.setNote(request.getNote());

        // Thay thế danh sách mặt hàng
        po.getItems().clear();

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Ingredient ing = ingredientMap.get(itemReq.getIngredientId());
            BigDecimal lineTotal = itemReq.getQuantity().multiply(itemReq.getUnitPrice())
                    .setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(lineTotal);

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .ingredient(ing)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .totalPrice(lineTotal)
                    .expiryDate(itemReq.getExpiryDate())
                    .build();
            po.getItems().add(item);
        }

        po.setTotalAmount(totalAmount);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return purchaseOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));
        return purchaseOrderMapper.toResponse(po);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPurchaseOrders(
            PurchaseOrderStatus status, Long supplierId, LocalDate fromDate, LocalDate toDate) {
        List<PurchaseOrder> list = purchaseOrderRepository.searchPurchaseOrders(status, supplierId, fromDate, toDate);
        return purchaseOrderMapper.toResponseList(list);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse completePurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findWithDetailsByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (po.getStatus() == PurchaseOrderStatus.COMPLETED) {
            throw new InvalidOperationException("Phiếu nhập '" + po.getPoNumber() + "' đã được hoàn tất trước đó");
        }

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new InvalidOperationException("Phiếu nhập '" + po.getPoNumber() + "' đã bị hủy, không thể nhập kho");
        }

        if (po.getItems().isEmpty()) {
            throw new InvalidOperationException("Phiếu nhập không có mặt hàng nào để nhập kho");
        }

        // Lấy danh sách ID nguyên liệu sắp xếp tăng dần để khóa bi quan chống Deadlock
        List<Long> ingredientIds = po.getItems().stream()
                .map(item -> item.getIngredient().getId())
                .distinct()
                .sorted()
                .toList();

        List<Ingredient> lockedIngredients = ingredientRepository.findAllByIdWithLock(ingredientIds);
        Map<Long, Ingredient> lockedMap = lockedIngredients.stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        // Thực hiện nhập kho và cập nhật giá vốn cho từng mặt hàng
        for (PurchaseOrderItem item : po.getItems()) {
            Ingredient ing = lockedMap.get(item.getIngredient().getId());
            if (ing == null) {
                throw new ResourceNotFoundException("Không tìm thấy nguyên liệu ID " + item.getIngredient().getId());
            }

            BigDecimal currentStock = ing.getCurrentStock() != null ? ing.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal currentCost = ing.getCostPerUnit() != null ? ing.getCostPerUnit() : BigDecimal.ZERO;
            BigDecimal importQty = item.getQuantity();
            BigDecimal importPrice = item.getUnitPrice();

            // Tính Giá vốn bình quân gia quyền (Weighted Average Cost):
            // Nếu tồn cũ > 0: newCost = (currentStock * currentCost + importQty * importPrice) / (currentStock + importQty)
            BigDecimal newCost;
            if (currentStock.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentTotalValue = currentStock.multiply(currentCost);
                BigDecimal importTotalValue = importQty.multiply(importPrice);
                BigDecimal newTotalStock = currentStock.add(importQty);
                newCost = currentTotalValue.add(importTotalValue).divide(newTotalStock, 2, RoundingMode.HALF_UP);
            } else {
                newCost = importPrice.setScale(2, RoundingMode.HALF_UP);
            }

            ing.setCostPerUnit(newCost);
            ing.setCurrentStock(currentStock.add(importQty));

            // Ghi nhận biến động thẻ kho
            InventoryTransaction tx = InventoryTransaction.builder()
                    .ingredient(ing)
                    .purchaseOrderItem(item)
                    .orderCode(po.getPoNumber())
                    .quantity(importQty) // số dương đại diện cho nhập kho
                    .transactionType(InventoryTransactionType.IMPORT)
                    .build();
            inventoryTransactionRepository.save(tx);
        }

        po.setStatus(PurchaseOrderStatus.COMPLETED);
        if (po.getDeliveryDate() == null) {
            po.setDeliveryDate(LocalDate.now());
        }

        PurchaseOrder completedPo = purchaseOrderRepository.save(po);
        return purchaseOrderMapper.toResponse(completedPo);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse cancelPurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findWithDetailsByIdWithLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new InvalidOperationException("Chỉ được hủy phiếu nhập ở trạng thái DRAFT. Phiếu hiện tại: " + po.getStatus());
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);
        PurchaseOrder cancelledPo = purchaseOrderRepository.save(po);
        return purchaseOrderMapper.toResponse(cancelledPo);
    }

    private Map<Long, Ingredient> loadAndValidateIngredients(List<PurchaseOrderItemRequest> items) {
        List<Long> ids = items.stream().map(PurchaseOrderItemRequest::getIngredientId).toList();
        if (new HashSet<>(ids).size() != ids.size()) {
            throw new InvalidOperationException("Danh sách nguyên liệu trong phiếu nhập bị chọn trùng lặp");
        }

        Map<Long, Ingredient> map = ingredientRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        List<Long> missing = ids.stream().filter(id -> !map.containsKey(id)).toList();
        if (!missing.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + missing);
        }

        return map;
    }

    private String generateUniquePoNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String poNumber;
        do {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
            poNumber = "PO-" + datePart + "-" + randomNum;
        } while (purchaseOrderRepository.existsByPoNumber(poNumber));
        return poNumber;
    }
}
