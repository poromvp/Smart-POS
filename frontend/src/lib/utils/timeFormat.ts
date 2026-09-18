export interface ElapsedTime {
  totalSeconds: number;
  minutes: number;
  seconds: number;
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