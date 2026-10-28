package com.smartpos.cataloginventory.repository;

import com.smartpos.cataloginventory.domain.ModifierOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModifierOptionRepository extends JpaRepository<ModifierOption, Long> {
    List<ModifierOption> findByGroupIdOrderByIdAsc(Long groupId);
    boolean existsByGroupIdAndNameIgnoreCase(Long groupId, String name);
}
