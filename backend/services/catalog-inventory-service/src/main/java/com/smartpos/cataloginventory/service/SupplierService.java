package com.smartpos.cataloginventory.service;

import com.smartpos.cataloginventory.dto.request.SupplierCreateRequest;
import com.smartpos.cataloginventory.dto.request.SupplierUpdateRequest;
import com.smartpos.cataloginventory.dto.response.SupplierResponse;

import java.util.List;

public interface SupplierService {

    SupplierResponse createSupplier(SupplierCreateRequest request);

    SupplierResponse updateSupplier(Long id, SupplierUpdateRequest request);

    SupplierResponse getSupplierById(Long id);

    List<SupplierResponse> getSuppliers(String search, Boolean activeOnly);

    void deleteSupplier(Long id);

    void toggleSupplierStatus(Long id, Boolean isActive);
}
