import assert from "node:assert/strict";
import test from "node:test";

import {
  formatElapsedTime,
  getElapsedTime,
  getKdsTaskTiming,
  KDS_WARNING_THRESHOLD_RATIO,
} from "../src/lib/utils/timeFormat.ts";

const START_TIME = "2026-10-28T08:00:00.000Z";
const START_TIMESTAMP = Date.parse(START_TIME);

test("getElapsedTime derives elapsed time from timestamps", () => {
  const result = getElapsedTime(START_TIME, START_TIMESTAMP + 125_000);

  assert.deepEqual(result, {
    totalSeconds: 125,
    minutes: 2,
    seconds: 5,
  });
});

test("getElapsedTime clamps negative elapsed time to zero", () => {
  const result = getElapsedTime(START_TIME, START_TIMESTAMP - 1_000);

  assert.deepEqual(result, {
    totalSeconds: 0,
    minutes: 0,
    seconds: 0,
  });
});

test("getKdsTaskTiming reports safe before the configured warning threshold", () => {
  const targetMinutes = 10;
  const targetSeconds = targetMinutes * 60;
  const elapsedSeconds = Math.floor(
    targetSeconds * KDS_WARNING_THRESHOLD_RATIO
  ) - 1;

  const result = getKdsTaskTiming(
    START_TIME,
    targetMinutes,
    START_TIMESTAMP + elapsedSeconds * 1_000
  );

  assert.equal(result.status, "safe");
  assert.equal(result.remainingSeconds, targetSeconds - elapsedSeconds);
});

test("getKdsTaskTiming reports warning at the configured threshold", () => {
  const targetMinutes = 10;
  const elapsedSeconds = Math.floor(
    targetMinutes * 60 * KDS_WARNING_THRESHOLD_RATIO
  );

  const result = getKdsTaskTiming(
    START_TIME,
    targetMinutes,
    START_TIMESTAMP + elapsedSeconds * 1_000
  );

  assert.equal(result.status, "warning");
});

test("getKdsTaskTiming keeps the exact target in warning and marks later time late", () => {
  const targetMinutes = 10;
  const targetSeconds = targetMinutes * 60;

  const atTarget = getKdsTaskTiming(
    START_TIME,
    targetMinutes,
    START_TIMESTAMP + targetSeconds * 1_000
  );
  const afterTarget = getKdsTaskTiming(
    START_TIME,
    targetMinutes,
    START_TIMESTAMP + (targetSeconds + 1) * 1_000
  );

  assert.equal(atTarget.status, "warning");
  assert.equal(atTarget.remainingSeconds, 0);
  assert.equal(afterTarget.status, "danger");
  assert.equal(afterTarget.remainingSeconds, -1);
});

test("formatElapsedTime formats minutes and seconds and clamps negative input", () => {
  assert.equal(formatElapsedTime(125), "02:05");
  assert.equal(formatElapsedTime(-5), "00:00");
});
