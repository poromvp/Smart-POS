package com.smartpos.auth_service.repository;

import com.smartpos.auth_service.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);

    boolean existsByName(String name);

    Page<Role> findAllByOrderByNameAsc(Pageable pageable);
}