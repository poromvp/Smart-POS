import path from "path";

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
export const GATEWAY_URL = process.env.E2E_GATEWAY_URL || "http://localhost:8088";
export const WS_URL = process.env.E2E_WS_URL || "ws://localhost:8088/ws-pos";

export const AUTH_DIR = path.resolve(__dirname, "..", ".auth");

export type RoleKey =
  | "admin"
  | "manager"
  | "cashier"
  | "chef"
  | "waiter"
  | "parttime";

export interface UserCredential {
  username: string;
  password: string;
  expectedLanding: string;
  roleName: string;
}

export const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "12345678";

export const SEED_USERS: Record<RoleKey, UserCredential> = {
  admin: {
    username: "admin",
    password: DEFAULT_PASSWORD,
    expectedLanding: "/admin",
    roleName: "ADMIN",
  },
  manager: {
    username: "manager01",
    password: DEFAULT_PASSWORD,
    expectedLanding: "/admin",
    roleName: "MANAGER",
  },
  cashier: {
    username: "cashier01",
    password: DEFAULT_PASSWORD,
    expectedLanding: "/pos",
    roleName: "CASHIER",
  },
  chef: {
    username: "chef01",
    password: DEFAULT_PASSWORD,
    expectedLanding: "/kds",
    roleName: "CHEF",
  },
  waiter: {
    username: "waiter01",
    password: DEFAULT_PASSWORD,
    expectedLanding: "/order-taking",
    roleName: "WAITER",
  },
  parttime: {
    username: "parttime01",
    password: DEFAULT_PASSWORD,
    expectedLanding: "/order-taking",
    roleName: "PART_TIME",
  },
};

export function getAuthFilePath(role: RoleKey): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}
