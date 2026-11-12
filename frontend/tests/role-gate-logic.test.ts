import test from "node:test";
import assert from "node:assert/strict";
import { evaluateGateAccess } from "../src/lib/role-gate-logic.ts";

test("evaluateGateAccess redirects unauthenticated users to /login", () => {
  const status = evaluateGateAccess({
    isAuthenticated: false,
    roleName: null,
    permissions: [],
    requiredPermissions: ["POS_ACCESS"],
  });
  assert.equal(status, "redirect_login");
});

test("evaluateGateAccess always allows ADMIN regardless of requiredPermissions", () => {
  assert.equal(
    evaluateGateAccess({
      isAuthenticated: true,
      roleName: "ADMIN",
      permissions: [],
      requiredPermissions: ["POS_ACCESS"],
    }),
    "allowed"
  );

  assert.equal(
    evaluateGateAccess({
      isAuthenticated: true,
      roleName: "ROLE_ADMIN",
      permissions: [],
      requiredPermissions: ["KDS_VIEW"],
    }),
    "allowed"
  );
});

test("evaluateGateAccess allows custom role (SHIFT_LEAD) matching requiredPermissions even if not in allowedRoles", () => {
  const status = evaluateGateAccess({
    isAuthenticated: true,
    roleName: "SHIFT_LEAD",
    permissions: ["POS_ACCESS", "KDS_VIEW"],
    allowedRoles: ["cashier"],
    requiredPermissions: ["POS_ACCESS"],
  });
  assert.equal(status, "allowed");
});

test("evaluateGateAccess returns forbidden when authenticated user lacks requiredPermissions", () => {
  const status = evaluateGateAccess({
    isAuthenticated: true,
    roleName: "CASHIER",
    permissions: ["MENU_READ", "ORDER_CREATE", "REPORT_VIEW"],
    requiredPermissions: ["ADMIN_DASHBOARD", "USER_READ"],
  });
  assert.equal(status, "forbidden");
});

test("evaluateGateAccess enforces requireAllPermissions when true", () => {
  assert.equal(
    evaluateGateAccess({
      isAuthenticated: true,
      roleName: "SHIFT_LEAD",
      permissions: ["POS_ACCESS"],
      requiredPermissions: ["POS_ACCESS", "PAYMENT_PROCESS"],
      requireAllPermissions: true,
    }),
    "forbidden"
  );

  assert.equal(
    evaluateGateAccess({
      isAuthenticated: true,
      roleName: "SHIFT_LEAD",
      permissions: ["POS_ACCESS", "PAYMENT_PROCESS"],
      requiredPermissions: ["POS_ACCESS", "PAYMENT_PROCESS"],
      requireAllPermissions: true,
    }),
    "allowed"
  );
});

test("evaluateGateAccess supports legacy allowedRoles when requiredPermissions is omitted", () => {
  assert.equal(
    evaluateGateAccess({
      isAuthenticated: true,
      roleName: "WAITER",
      permissions: [],
      allowedRoles: ["waiter"],
    }),
    "allowed"
  );
  assert.equal(
    evaluateGateAccess({
      isAuthenticated: true,
      roleName: "CHEF",
      permissions: [],
      allowedRoles: ["waiter"],
    }),
    "forbidden"
  );
});
