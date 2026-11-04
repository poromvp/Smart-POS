package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Category> findAllByOrderByDisplayOrderAsc();

    List<Category> findByIsActiveTrueOrderByDisplayOrderAsc();
}
