package com.smartpos.sales_service.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartpos.sales_service.client.InventoryClient;
import com.smartpos.sales_service.dto.response.OrderItemResponse;
import com.smartpos.sales_service.dto.response.OrderResponse;
import com.smartpos.sales_service.entity.ItemKdsStatus;
import com.smartpos.sales_service.entity.OrderStatus;
import com.smartpos.sales_service.entity.PaymentStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SalesWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private InventoryClient inventoryClient;

    private WebSocketStompClient stompClient;
    private StompSession session;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);
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

    @Test
    @DisplayName("STOMP Client kết nối thành công tới endpoint /ws-pos")
    void testConnect_Success() throws Exception {
        session = stompClient.connectAsync(getWsUrl(), new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

        assertThat(session).isNotNull();
        assertThat(session.isConnected()).isTrue();
    }

    @Test
    @DisplayName("Client subscribe /topic/orders nhận được thông báo khi đơn hàng được phát sự kiện")
    void testOrderCheckoutBroadcast_TopicOrders() throws Exception {
        session = stompClient.connectAsync(getWsUrl(), new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

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

        // Chờ kết nối STOMP broker đăng ký subscription ổn định
        Thread.sleep(500);

        OrderResponse broadcastOrder = OrderResponse.builder()
                .id(100L)
                .orderCode("ORD-20261109-WS01")
                .tableNumber("T1-01")
                .status(OrderStatus.COMPLETED)
                .paymentStatus(PaymentStatus.PAID)
                .totalAmount(new BigDecimal("125000"))
                .build();

        // Gửi thông điệp vào broker
        messagingTemplate.convertAndSend("/topic/orders", broadcastOrder);

        OrderResponse received = completableFuture.get(10, TimeUnit.SECONDS);

        assertThat(received).isNotNull();
        assertThat(received.getOrderCode()).isEqualTo("ORD-20261109-WS01");
        assertThat(received.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(received.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(received.getTotalAmount()).isEqualByComparingTo("125000");
    }

    @Test
    @DisplayName("Client subscribe /topic/kds nhận được cập nhật trạng thái món ăn tức thời cho bếp")
    void testKdsItemStatusBroadcast_TopicKds() throws Exception {
        session = stompClient.connectAsync(getWsUrl(), new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

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

        // Chờ kết nối STOMP broker đăng ký subscription ổn định
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
