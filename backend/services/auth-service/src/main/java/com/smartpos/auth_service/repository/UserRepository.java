package com.smartpos.auth_service.repository;

import com.smartpos.auth_service.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByRole_Id(Long roleId);

    Page<User> findAllByRole_Id(Long roleId, Pageable pageable);
}
