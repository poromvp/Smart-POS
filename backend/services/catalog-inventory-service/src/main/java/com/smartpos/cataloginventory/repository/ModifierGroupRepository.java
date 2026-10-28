package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.ModifierGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModifierGroupRepository extends JpaRepository<ModifierGroup, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    // Dùng @EntityGraph để nạp sẵn danh sách options cùng lúc, giải quyết triệt để lỗi Lazy Loading và N+1
    @EntityGraph(attributePaths = {"options"})
    List<ModifierGroup> findAllByOrderByNameAsc();

    @EntityGraph(attributePaths = {"options"})
    Optional<ModifierGroup> findById(Long id);
}
