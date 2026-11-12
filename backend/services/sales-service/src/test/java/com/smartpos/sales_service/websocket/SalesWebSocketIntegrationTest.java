package com.smartpos.sales_service.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.dto.response.OrderItemResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.ItemKdsStatus;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.PaymentStatus;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import javax.crypto.SecretKey;
import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SalesWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private InventoryClient inventoryClient;

    private WebSocketStompClient stompClient;
    private StompSession session;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);
        signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    @AfterEach
    void tearDown() {
        if (session != null && session.isConnected()) {
            session.disconnect();
        }
        if (stompClient != null) {
            stompClient.stop();
        }
    }

    private String getWsUrl() {
        return "ws://localhost:" + port + "/ws-pos";
    }

    private String createToken(String username, String role, List<String> permissions) {
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("permissions", permissions)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(3600)))
                .signWith(signingKey)
                .compact();
    }

    private StompSession connectWithJwt(String token) throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        if (token != null) {
            connectHeaders.add("Authorization", "Bearer " + token);
        }
        return stompClient.connectAsync(getWsUrl(), (WebSocketHttpHeaders) null, connectHeaders, new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);
    }

    @Test
    @DisplayName("STOMP Client kết nối thành công tới endpoint /ws-pos (cả ẩn danh cho QR bàn lẫn có JWT)")
    void testConnect_Success() throws Exception {
        session = connectWithJwt(null);

        assertThat(session).isNotNull();
        assertThat(session.isConnected()).isTrue();
    }

    @Test
    @DisplayName("Khách QR ẩn danh subscribe /topic/tables/{tableNumber} nhận được cập nhật đơn của bàn")
    void testGuestTableSubscription_ReceivesOrderEvent() throws Exception {
        session = connectWithJwt(null);

        CompletableFuture<OrderResponse> completableFuture = new CompletableFuture<>();
        session.subscribe("/topic/tables/11", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return OrderResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                completableFuture.complete((OrderResponse) payload);
            }
        });

        Thread.sleep(500);

        OrderResponse tableOrder = OrderResponse.builder()
                .id(99L)
                .orderCode("ORD-QR-11")
                .tableNumber("11")
                .status(OrderStatus.PREPARING)
                .build();

        messagingTemplate.convertAndSend("/topic/tables/11", tableOrder);

        OrderResponse received = completableFuture.get(10, TimeUnit.SECONDS);
        assertThat(received).isNotNull();
        assertThat(received.getOrderCode()).isEqualTo("ORD-QR-11");
    }

    @Test
    @DisplayName("Staff có JWT hợp lệ subscribe /topic/orders nhận được thông báo khi đơn hàng được phát sự kiện")
    void testOrderCheckoutBroadcast_TopicOrders() throws Exception {
        String token = createToken("cashier01", "CASHIER", List.of("POS_ACCESS", "ORDER_READ"));
        session = connectWithJwt(token);

        CompletableFuture<OrderResponse> completableFuture = new CompletableFuture<>();

        session.subscribe("/topic/orders", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return OrderResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                completableFuture.complete((OrderResponse) payload);
            }
        });

        Thread.sleep(500);

        OrderResponse broadcastOrder = OrderResponse.builder()
                .id(100L)
                .orderCode("ORD-20261109-WS01")
                .tableNumber("T1-01")
                .status(OrderStatus.COMPLETED)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(new BigDecimal("125000"))
                .build();

        messagingTemplate.convertAndSend("/topic/orders", broadcastOrder);

        OrderResponse received = completableFuture.get(10, TimeUnit.SECONDS);

        assertThat(received).isNotNull();
        assertThat(received.getOrderCode()).isEqualTo("ORD-20261109-WS01");
        assertThat(received.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(received.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(received.getTotalAmount()).isEqualByComparingTo("125000");
    }

    @Test
    @DisplayName("Đầu bếp có JWT hợp lệ subscribe /topic/kds nhận được cập nhật trạng thái món ăn tức thời")
    void testKdsItemStatusBroadcast_TopicKds() throws Exception {
        String token = createToken("chef01", "CHEF", List.of("KDS_VIEW", "KDS_UPDATE"));
        session = connectWithJwt(token);

        CompletableFuture<OrderResponse> completableFuture = new CompletableFuture<>();

        session.subscribe("/topic/kds", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return OrderResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                completableFuture.complete((OrderResponse) payload);
            }
        });

        Thread.sleep(500);

        OrderItemResponse item = OrderItemResponse.builder()
                .id(50L)
                .name("Trà Đào Cam Sả")
                .quantity(2)
                .kdsStatus(ItemKdsStatus.COOKING)
                .build();

        OrderResponse kdsOrder = OrderResponse.builder()
                .id(101L)
                .orderCode("ORD-20261109-KDS02")
                .tableNumber("T2-05")
                .status(OrderStatus.PREPARING)
                .items(List.of(item))
                .build();

        messagingTemplate.convertAndSend("/topic/kds", kdsOrder);

        OrderResponse received = completableFuture.get(10, TimeUnit.SECONDS);

        assertThat(received).isNotNull();
        assertThat(received.getOrderCode()).isEqualTo("ORD-20261109-KDS02");
        assertThat(received.getStatus()).isEqualTo(OrderStatus.PREPARING);
        assertThat(received.getItems()).hasSize(1);
        assertThat(received.getItems().get(0).getKdsStatus()).isEqualTo(ItemKdsStatus.COOKING);
    }
}
