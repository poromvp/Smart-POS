package com.smartpos.cataloginventory.service.impl;

import com.smartpos.cataloginventory.domain.Supplier;
import com.smartpos.cataloginventory.dto.request.SupplierCreateRequest;
import com.smartpos.cataloginventory.dto.request.SupplierUpdateRequest;
import com.smartpos.cataloginventory.dto.response.SupplierResponse;
import com.smartpos.cataloginventory.exception.DuplicateResourceException;
import com.smartpos.cataloginventory.exception.InvalidOperationException;
import com.smartpos.cataloginventory.exception.ResourceNotFoundException;
import com.smartpos.cataloginventory.mapper.SupplierMapper;
import com.smartpos.cataloginventory.repository.PurchaseOrderRepository;
import com.smartpos.cataloginventory.repository.SupplierRepository;
import com.smartpos.cataloginventory.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierMapper supplierMapper;

    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierCreateRequest request) {
        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Nhà cung cấp '" + trimmedName + "' đã tồn tại trên hệ thống");
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String trimmedPhone = request.getPhone().trim();
            if (supplierRepository.existsByPhone(trimmedPhone)) {
                throw new DuplicateResourceException("Số điện thoại '" + trimmedPhone + "' đã được sử dụng bởi nhà cung cấp khác");
            }
            request.setPhone(trimmedPhone);
        }

        request.setName(trimmedName);
        Supplier supplier = supplierMapper.toEntity(request);
        supplier.setEmail(trimToNull(request.getEmail()));
        supplier.setAddress(trimToNull(request.getAddress()));
                return supplierMapper.toResponse(supplierRepository.save(supplier));
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierUpdateRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));

        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Tên nhà cung cấp '" + trimmedName + "' đã được sử dụng");
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String trimmedPhone = request.getPhone().trim();
            if (supplierRepository.existsByPhoneAndIdNot(trimmedPhone, id)) {
                throw new DuplicateResourceException("Số điện thoại '" + trimmedPhone + "' đã được sử dụng bởi nhà cung cấp khác");
            }
            request.setPhone(trimmedPhone);
        }

        request.setName(trimmedName);
        supplierMapper.updateEntityFromDto(request, supplier);
        supplier.setEmail(trimToNull(request.getEmail()));
        supplier.setAddress(trimToNull(request.getAddress()));
                return supplierMapper.toResponse(supplierRepository.save(supplier));
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));
        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> getSuppliers(String search, Boolean activeOnly) {
        String pattern = (search != null && !search.isBlank())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        return supplierRepository.searchSuppliers(pattern, activeOnly).stream()
                .map(supplierMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));

        if (purchaseOrderRepository.existsBySupplierId(id)) {
            throw new InvalidOperationException("Không thể xóa nhà cung cấp '" + supplier.getName() +
                    "' vì đã phát sinh phiếu nhập hàng. Bạn có thể đổi trạng thái sang 'Ngừng hoạt động'.");
        }

        supplierRepository.delete(supplier);
    }

    @Override
    @Transactional
    public void toggleSupplierStatus(Long id, Boolean isActive) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));
        supplier.setIsActive(isActive);
        supplierRepository.save(supplier);
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
