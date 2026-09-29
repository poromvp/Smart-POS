export interface ElapsedTime {
  totalSeconds: number;
  minutes: number;
  seconds: number;
}

export type KdsTaskStatus = "safe" | "warning" | "danger";

/**
 * Unconfirmed assumption based on the existing 5-minute warning for a
 * 10-minute target. Keep this configurable until the team confirms a rule.
 */
export const KDS_WARNING_THRESHOLD_RATIO = 0.5;

export interface KdsTaskTiming extends ElapsedTime {
  targetSeconds: number;
  remainingSeconds: number;
  status: KdsTaskStatus;
}

/**
 * Tính thời gian đã trôi qua kể từ startTime.
 */
export function getElapsedTime(
  startTime: string,
  currentTime: number = Date.now()
): ElapsedTime {
  const startTimestamp = new Date(startTime).getTime();

  const totalSeconds = Math.max(
    0,
    Math.floor((currentTime - startTimestamp) / 1000)
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    minutes,
    seconds,
  };
}

/** Derive KDS timer values and visual status from the task timestamp/target. */
export function getKdsTaskTiming(
  startTime: string,
  targetTimeMinutes: number,
  currentTime: number = Date.now()
): KdsTaskTiming {
  const elapsed = getElapsedTime(startTime, currentTime);
  const targetSeconds = Math.max(0, targetTimeMinutes * 60);
  const remainingSeconds = targetSeconds - elapsed.totalSeconds;
  const warningThresholdSeconds =
    targetSeconds * KDS_WARNING_THRESHOLD_RATIO;

  const status: KdsTaskStatus =
    elapsed.totalSeconds > targetSeconds
      ? "danger"
      : elapsed.totalSeconds >= warningThresholdSeconds
        ? "warning"
        : "safe";

  return {
    ...elapsed,
    targetSeconds,
    remainingSeconds,
    status,
  };
}

/**
 * Format thành MM:SS
 */
export function formatElapsedTime(
  totalSeconds: number
): string {
  const safeSeconds = Math.max(0, totalSeconds);

  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}
