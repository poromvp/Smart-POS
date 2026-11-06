import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTableId, formatTableLabel } from "../src/lib/utils/tableUtils.ts";

test("normalizeTableId normalizes standard inputs correctly", () => {
  assert.equal(normalizeTableId("1"), "1");
  assert.equal(normalizeTableId("01"), "1");
  assert.equal(normalizeTableId("Bàn 01"), "1");
  assert.equal(normalizeTableId("ban 2"), "2");
  assert.equal(normalizeTableId("table-1"), "1");
  assert.equal(normalizeTableId("?table=10"), "10");
  assert.equal(normalizeTableId("VIP-1"), "VIP-1");
});

test("normalizeTableId returns null for invalid inputs", () => {
  assert.equal(normalizeTableId(""), null);
  assert.equal(normalizeTableId("   "), null);
  assert.equal(normalizeTableId(null), null);
  assert.equal(normalizeTableId(undefined), null);
});

test("formatTableLabel formats table label user-friendly", () => {
  assert.equal(formatTableLabel("Bàn 05"), "Bàn 5");
  assert.equal(formatTableLabel("table-12"), "Bàn 12");
  assert.equal(formatTableLabel(null), "Chưa chọn bàn");
});
