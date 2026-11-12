import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveLandingRoute,
  getAccessibleWorkspaces,
} from "../src/lib/auth-routing.ts";

test("resolveLandingRoute routes user with only KDS_VIEW to /kds", () => {
  const route = resolveLandingRoute({
    roleName: "CHEF",
    permissions: ["MENU_READ", "KDS_VIEW", "KDS_UPDATE", "ORDER_READ"],
  });
  assert.equal(route, "/kds");
});

test("resolveLandingRoute routes user with only POS_ACCESS to /pos", () => {
  const route = resolveLandingRoute({
    roleName: "CASHIER",
    permissions: ["MENU_READ", "POS_ACCESS", "PAYMENT_PROCESS", "REPORT_VIEW"],
  });
  assert.equal(route, "/pos");
});

test("resolveLandingRoute routes user with only ORDER_TAKING_ACCESS to /order-taking", () => {
  const route = resolveLandingRoute({
    roleName: "WAITER",
    permissions: ["MENU_READ", "ORDER_TAKING_ACCESS", "ORDER_CREATE"],
  });
  assert.equal(route, "/order-taking");
});

test("resolveLandingRoute routes custom multi-workspace role (SHIFT_LEAD) to / Portal", () => {
  const route = resolveLandingRoute({
    roleName: "SHIFT_LEAD",
    permissions: ["POS_ACCESS", "PAYMENT_PROCESS", "KDS_VIEW", "KDS_UPDATE"],
  });
  assert.equal(route, "/");

  const workspaces = getAccessibleWorkspaces({
    roleName: "SHIFT_LEAD",
    permissions: ["POS_ACCESS", "KDS_VIEW"],
  });
  assert.equal(workspaces.pos, true);
  assert.equal(workspaces.kds, true);
  assert.equal(workspaces.admin, false);
  assert.equal(workspaces.orderTaking, false);
  assert.equal(workspaces.count, 2);
});

test("resolveLandingRoute routes ADMIN and MANAGER with ADMIN_DASHBOARD to /admin", () => {
  assert.equal(
    resolveLandingRoute({ roleName: "ADMIN", permissions: [] }),
    "/admin"
  );
  assert.equal(
    resolveLandingRoute({
      roleName: "MANAGER",
      permissions: ["ADMIN_DASHBOARD", "POS_ACCESS", "KDS_VIEW", "USER_READ"],
    }),
    "/admin"
  );
});

test("resolveLandingRoute routes user with zero operational workspaces to / Portal", () => {
  const route = resolveLandingRoute({
    roleName: "INTERN",
    permissions: ["MENU_READ"],
  });
  assert.equal(route, "/");
});
