import assert from "node:assert/strict";
import test from "node:test";
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
