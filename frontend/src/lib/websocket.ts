import { Client, type IMessage } from "@stomp/stompjs";

export type WebSocketCallback<T = unknown> = (data: T) => void;

export class WebSocketManager {
  private client: Client | null = null;
  private subscriptions: Map<string, Set<WebSocketCallback>> = new Map();
  private isConnected = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initClient();
    }
  }

  private initClient() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Fallback URL: Nếu có NEXT_PUBLIC_WS_URL thì ưu tiên, nếu không thì dùng ws://localhost:8080/ws-pos (qua Gateway)
    // hoặc ws://localhost:8083/ws-pos khi chạy direct
    const defaultHost = window.location.port === "3000" ? "localhost:8080" : window.location.host;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${defaultHost}/ws-pos`;

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true;
        this.resubscribeAll();
      },
      onDisconnect: () => {
        this.isConnected = false;
      },
      onStompError: (frame) => {
        console.warn("[WebSocket] STOMP Warning:", frame.headers["message"]);
      },
      onWebSocketError: (event) => {
        console.warn("[WebSocket] Connection fallback mode active", event);
      },
    });

    try {
      this.client.activate();
    } catch (e) {
      console.warn("[WebSocket] Failed to activate:", e);
    }
  }

  public dispatchMessage(topic: string, messageBody: string) {
    const callbacks = this.subscriptions.get(topic);
    if (!callbacks || callbacks.size === 0) return;

    try {
      const payload = JSON.parse(messageBody);
      callbacks.forEach((cb) => cb(payload));
    } catch {
      callbacks.forEach((cb) => cb(messageBody));
    }
  }

  private resubscribeAll() {
    if (!this.client || !this.client.connected) return;

    for (const topic of this.subscriptions.keys()) {
      this.client.subscribe(topic, (message: IMessage) => {
        this.dispatchMessage(topic, message.body);
      });
    }
  }

  public subscribe<T = unknown>(topic: string, callback: WebSocketCallback<T>): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      if (this.client && this.client.connected) {
        this.client.subscribe(topic, (message: IMessage) => {
          this.dispatchMessage(topic, message.body);
        });
      }
    }

    const callbacks = this.subscriptions.get(topic)!;
    callbacks.add(callback as WebSocketCallback);

    return () => {
      callbacks.delete(callback as WebSocketCallback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(topic);
      }
    };
  }

  public getSubscriptionCount(topic: string): number {
    return this.subscriptions.get(topic)?.size ?? 0;
  }

  public hasTopic(topic: string): boolean {
    return this.subscriptions.has(topic);
  }

  public getConnected(): boolean {
    return this.isConnected;
  }
}

export const wsManager = new WebSocketManager();
