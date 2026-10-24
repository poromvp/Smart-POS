package com.smartpos.auth_service.repository;

import com.smartpos.auth_service.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository
        extends JpaRepository<Permission, Long> {

    List<Permission> findByModuleIgnoreCase(String module);

    List<Permission> findAllByOrderByModuleAscCodeAsc();
}
