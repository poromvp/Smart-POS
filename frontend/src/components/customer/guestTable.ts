export function getGuestTableId(value: string | null): string | null {
  const normalized = value?.trim().replace(/^bàn\s+/i, "");

  if (!normalized || !/^[a-z0-9-]{1,20}$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

export function getGuestTableLabel(tableId: string | null): string | null {
  return tableId ? `Bàn ${tableId}` : null;
}

export function getGuestTableQuery(tableId: string | null): string {
  return tableId ? `?table=${encodeURIComponent(tableId)}` : "";
}
