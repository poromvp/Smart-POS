import assert from "node:assert/strict";
import test from "node:test";
import type { Client } from "@stomp/stompjs";
import { WebSocketManager } from "../src/lib/websocket.ts";

test("WebSocketManager subscribe registers callback properly", () => {
  const manager = new WebSocketManager();
  const cb1 = () => {};
  const cb2 = () => {};

  assert.equal(manager.hasTopic("/topic/orders"), false);

  manager.subscribe("/topic/orders", cb1);
  assert.equal(manager.hasTopic("/topic/orders"), true);
  assert.equal(manager.getSubscriptionCount("/topic/orders"), 1);

  manager.subscribe("/topic/orders", cb2);
  assert.equal(manager.getSubscriptionCount("/topic/orders"), 2);
});

test("WebSocketManager unsubscribe removes callback properly and cleans up topic", () => {
  const manager = new WebSocketManager();
  const cb1 = () => {};
  const cb2 = () => {};

  const unsub1 = manager.subscribe("/topic/kds", cb1);
  const unsub2 = manager.subscribe("/topic/kds", cb2);
  assert.equal(manager.getSubscriptionCount("/topic/kds"), 2);

  unsub1();
  assert.equal(manager.getSubscriptionCount("/topic/kds"), 1);
  assert.equal(manager.hasTopic("/topic/kds"), true);

  unsub2();
  assert.equal(manager.getSubscriptionCount("/topic/kds"), 0);
  assert.equal(manager.hasTopic("/topic/kds"), false);
});

test("WebSocketManager receives valid JSON message and invokes callback with parsed object", () => {
  const manager = new WebSocketManager();
  const received: Array<{ orderCode: string; status: string }> = [];

  manager.subscribe<{ orderCode: string; status: string }>("/topic/orders", (data) => {
    received.push(data);
  });

  const payload = { orderCode: "ORD-20261109-001", status: "COMPLETED" };
  manager.dispatchMessage("/topic/orders", JSON.stringify(payload));

  assert.equal(received.length, 1);
  assert.deepEqual(received[0], payload);
});

test("WebSocketManager handles malformed JSON message gracefully with fallback string without crashing", () => {
  const manager = new WebSocketManager();
  const received: unknown[] = [];

  manager.subscribe("/topic/orders", (data) => {
    received.push(data);
  });

  const malformedMessage = "INVALID_JSON_RAW_PAYLOAD_{}";
  assert.doesNotThrow(() => {
    manager.dispatchMessage("/topic/orders", malformedMessage);
  });

  assert.equal(received.length, 1);
  assert.equal(received[0], malformedMessage);
});

test("WebSocketManager stores and clears auth token cleanly", () => {
  const manager = new WebSocketManager();
  assert.equal(manager.getAuthToken(), null);

  manager.setAuthToken("jwt-demo-token");
  assert.equal(manager.getAuthToken(), "jwt-demo-token");

  manager.setAuthToken(null);
  assert.equal(manager.getAuthToken(), null);
});

test("WebSocketManager reconnects with latest token when setAuthToken is called during in-flight reconnect", async () => {
  let resolveFirstDeactivate!: () => void;
  let deactivateCount = 0;
  const activatedHeaders: Array<Record<string, string>> = [];

  const mockClient = {
    active: true,
    connected: false,
    connectHeaders: {} as Record<string, string>,
    deactivate: () => {
      deactivateCount++;
      if (deactivateCount === 1) {
        return new Promise<void>((resolve) => {
          resolveFirstDeactivate = () => {
            mockClient.active = false;
            resolve();
          };
        });
      }
      mockClient.active = false;
      return Promise.resolve();
    },
    activate: () => {
      mockClient.active = true;
      activatedHeaders.push({ ...mockClient.connectHeaders });
    },
  };

  const manager = new WebSocketManager(mockClient as unknown as Client);

  // Lần gọi 1 bắt đầu deactivate async khi reconnect với token-1
  manager.setAuthToken("token-1");
  // Trong lúc deactivate của token-1 chưa xong, token-2 được gán (VD: silent refresh xong)
  manager.setAuthToken("token-2");

  resolveFirstDeactivate();
  await manager.waitForReconnect();

  assert.equal(manager.getAuthToken(), "token-2");
  assert.ok(activatedHeaders.length >= 1);
  assert.deepEqual(activatedHeaders[activatedHeaders.length - 1], {
    Authorization: "Bearer token-2",
  });

  // Kiểm tra trường hợp setAuthToken("token-3") xảy ra đúng lúc activate() đang chạy
  let triggerNestedUpdate = true;
  mockClient.activate = () => {
    mockClient.active = true;
    activatedHeaders.push({ ...mockClient.connectHeaders });
    if (triggerNestedUpdate && mockClient.connectHeaders.Authorization === "Bearer token-2-next") {
      triggerNestedUpdate = false;
      manager.setAuthToken("token-3");
    }
  };

  manager.setAuthToken("token-2-next");
  await manager.waitForReconnect();

  assert.equal(manager.getAuthToken(), "token-3");
  assert.deepEqual(activatedHeaders[activatedHeaders.length - 1], {
    Authorization: "Bearer token-3",
  });
});
