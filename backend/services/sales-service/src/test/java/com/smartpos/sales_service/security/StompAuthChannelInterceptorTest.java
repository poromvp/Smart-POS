package com.smartpos.sales_service.security;

import com.smartpos.sales_service.exception.ForbiddenException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class StompAuthChannelInterceptorTest {

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private StompAuthChannelInterceptor interceptor;
    private SecretKey signingKey;
    private MessageChannel mockChannel;

    @BeforeEach
    void setUp() {
        interceptor = new StompAuthChannelInterceptor();
        ReflectionTestUtils.setField(interceptor, "secret", TEST_SECRET);
        interceptor.init();
        signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(TEST_SECRET));
        mockChannel = mock(MessageChannel.class);
    }

    private String generateToken(String username, String role, List<String> permissions) {
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("permissions", permissions)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(signingKey)
                .compact();
    }

    @Test
    @DisplayName("STOMP CONNECT với JWT hợp lệ gắn principal và cho phép subscribe /topic/orders, /topic/kds theo quyền")
    void shouldAuthenticateAndAuthorizeStaffSubscriptions() {
        String cashierToken = generateToken("cashier01", "CASHIER", List.of("POS_ACCESS", "ORDER_READ"));

        StompHeaderAccessor connectAccessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        connectAccessor.setLeaveMutable(true);
        connectAccessor.addNativeHeader("Authorization", "Bearer " + cashierToken);
        Message<?> connectMsg = MessageBuilder.createMessage(new byte[0], connectAccessor.getMessageHeaders());

        interceptor.preSend(connectMsg, mockChannel);
        assertThat(connectAccessor.getUser()).isInstanceOf(StompAuthChannelInterceptor.StompPrincipal.class);

        StompHeaderAccessor subOrdersAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        subOrdersAccessor.setDestination("/topic/orders");
        subOrdersAccessor.setUser(connectAccessor.getUser());
        interceptor.preSend(MessageBuilder.createMessage(new byte[0], subOrdersAccessor.getMessageHeaders()), mockChannel);

        StompHeaderAccessor subKdsAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        subKdsAccessor.setDestination("/topic/kds");
        subKdsAccessor.setUser(connectAccessor.getUser());
        assertThatThrownBy(() -> interceptor.preSend(
                MessageBuilder.createMessage(new byte[0], subKdsAccessor.getMessageHeaders()), mockChannel))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("STOMP ẩn danh được subscribe /topic/tables/{n} nhưng bị từ chối /topic/orders và /topic/kds")
    void shouldAllowTableTopicForGuestAndRejectInternalTopics() {
        StompHeaderAccessor tableSub = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        tableSub.setDestination("/topic/tables/11");
        interceptor.preSend(MessageBuilder.createMessage(new byte[0], tableSub.getMessageHeaders()), mockChannel);

        StompHeaderAccessor ordersSub = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        ordersSub.setDestination("/topic/orders");
        assertThatThrownBy(() -> interceptor.preSend(
                MessageBuilder.createMessage(new byte[0], ordersSub.getMessageHeaders()), mockChannel))
                .isInstanceOf(ForbiddenException.class);

        StompHeaderAccessor kdsSub = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        kdsSub.setDestination("/topic/kds");
        assertThatThrownBy(() -> interceptor.preSend(
                MessageBuilder.createMessage(new byte[0], kdsSub.getMessageHeaders()), mockChannel))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("STOMP CONNECT với JWT sai chữ ký bị từ chối")
    void shouldRejectInvalidJwtOnConnect() {
        StompHeaderAccessor connectAccessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        connectAccessor.addNativeHeader("Authorization", "Bearer invalid.jwt.token");

        assertThatThrownBy(() -> interceptor.preSend(
                MessageBuilder.createMessage(new byte[0], connectAccessor.getMessageHeaders()), mockChannel))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
