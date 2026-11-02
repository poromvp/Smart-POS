package com.smartpos.auth_service.repository;

import com.smartpos.auth_service.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(
            String tokenHash
    );

    @Modifying
    @Query("""
            UPDATE RefreshToken rt
            SET rt.revokedAt = CURRENT_TIMESTAMP
            WHERE rt.user.id = :userId
              AND rt.revokedAt IS NULL
            """)
    int revokeAllByUserId(@Param("userId") Long userId);
}
