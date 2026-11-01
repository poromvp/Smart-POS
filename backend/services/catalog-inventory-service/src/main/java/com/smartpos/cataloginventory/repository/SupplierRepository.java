package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    @Query("SELECT s FROM Supplier s WHERE " +
           "(:activeOnly IS NULL OR :activeOnly = false OR s.isActive = true) AND " +
           "(:pattern IS NULL OR LOWER(s.name) LIKE :pattern OR LOWER(s.phone) LIKE :pattern) " +
           "ORDER BY s.id DESC")
    List<Supplier> searchSuppliers(@Param("pattern") String pattern, @Param("activeOnly") Boolean activeOnly);
}
