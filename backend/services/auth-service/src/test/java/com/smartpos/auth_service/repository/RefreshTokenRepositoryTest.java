package com.smartpos.auth_service.repository;

import com.smartpos.auth_service.entity.RefreshToken;
import com.smartpos.auth_service.entity.Role;
import com.smartpos.auth_service.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@DataJpaTest
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User sampleUser;
    private RefreshToken savedToken;

    @BeforeEach
    void setUp() {
        Role role = roleRepository.save(new Role("CASHIER", "Thu ngân"));

        User user = new User("user_for_token", "$2a$10$hashedPass", "Nguyễn Văn A", "0901234567");
        user.setRole(role);
        sampleUser = userRepository.save(user);

        RefreshToken token = new RefreshToken();
        token.setUser(sampleUser);
        token.setTokenHash("hash1234567890abcdef");
        token.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        savedToken = refreshTokenRepository.save(token);
    }

    @Test
    @DisplayName("findByTokenHashAndRevokedAtIsNull tìm thấy token chưa bị thu hồi")
    void testFindByTokenHashAndRevokedAtIsNull_Active() {
        Optional<RefreshToken> found = refreshTokenRepository
                .findByTokenHashAndRevokedAtIsNull("hash1234567890abcdef");

        assertThat(found).isPresent();
        assertThat(found.get().getUser().getUsername()).isEqualTo("user_for_token");
    }

    @Test
    @DisplayName("revokeAllByUserId cập nhật revokedAt cho toàn bộ token của user")
    void testRevokeAllByUserId() {
        int updated = refreshTokenRepository.revokeAllByUserId(sampleUser.getId());
        assertThat(updated).isEqualTo(1);

        Optional<RefreshToken> activeToken = refreshTokenRepository
                .findByTokenHashAndRevokedAtIsNull("hash1234567890abcdef");
        assertThat(activeToken).isEmpty();
    }
}
