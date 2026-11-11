import { Client, type IMessage } from "@stomp/stompjs";

export type WebSocketCallback<T = unknown> = (data: T) => void;

export class WebSocketManager {
  private client: Client | null = null;
  private subscriptions: Map<string, Set<WebSocketCallback>> = new Map();
  private isConnected = false;
  private authToken: string | null = null;
  private reconnectPromise: Promise<void> | null = null;
  private pendingReconnect = false;
  private lastAppliedToken: string | null = null;

  constructor(customClient?: Client) {
    if (customClient) {
      this.client = customClient;
    } else if (typeof window !== "undefined") {
      this.initClient();
    }
  }

  private buildConnectHeaders(): Record<string, string> {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  private initClient() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Fallback URL: Nếu có NEXT_PUBLIC_WS_URL thì ưu tiên, nếu không thì dùng ws://localhost:8088/ws-pos (qua Gateway)
    // hoặc ws://localhost:8083/ws-pos khi chạy direct
    const defaultHost = window.location.port === "3000" ? "localhost:8088" : window.location.host;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${defaultHost}/ws-pos`;

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: this.buildConnectHeaders(),
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

  public setAuthToken(token: string | null) {
    const normalized = token && token.trim() ? token.trim() : null;
    if (this.authToken === normalized) {
      return;
    }
    this.authToken = normalized;

    if (!this.client) {
      return;
    }

    this.client.connectHeaders = this.buildConnectHeaders();
    void this.reconnectWithCurrentToken();
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public waitForReconnect(): Promise<void> {
    return this.reconnectPromise ?? Promise.resolve();
  }

  private async reconnectWithCurrentToken() {
    if (!this.client) return;
    if (this.reconnectPromise) {
      this.pendingReconnect = true;
      await this.reconnectPromise;
      if (this.pendingReconnect || this.lastAppliedToken !== this.authToken) {
        await this.reconnectWithCurrentToken();
      }
      return;
    }

    const client = this.client;
    this.reconnectPromise = (async () => {
      try {
        do {
          if (client.active) {
            await client.deactivate();
          }
          // Đọc token mới nhất ngay sau khi deactivate xong để không bị kẹt ở token cũ nếu setAuthToken vừa được gọi
          this.pendingReconnect = false;
          const targetToken = this.authToken;
          client.connectHeaders = targetToken
            ? { Authorization: `Bearer ${targetToken}` }
            : {};
          this.lastAppliedToken = targetToken;
          client.activate();
        } while (this.pendingReconnect || this.lastAppliedToken !== this.authToken);
      } catch (e) {
        console.warn("[WebSocket] Reconnect warning:", e);
      } finally {
        this.reconnectPromise = null;
        this.pendingReconnect = false;
      }
    })();

    await this.reconnectPromise;
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
