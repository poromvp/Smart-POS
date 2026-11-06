/**
 * Chuẩn hóa mã bàn/số bàn từ nhiều định dạng đầu vào khác nhau:
 * "Bàn 01" -> "1"
 * "table-1" -> "1"
 * "?table=1" -> "1"
 * " 05 " -> "5"
 * "" / "abc" / null / undefined -> null
 */
export function normalizeTableId(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  let str = String(value).trim();
  if (!str) return null;

  // Lấy giá trị tham số table nếu là query string "?table=..."
  if (str.startsWith("?")) {
    const params = new URLSearchParams(str);
    const tableParam = params.get("table");
    if (tableParam) {
      str = tableParam.trim();
    }
  }

  // Loại bỏ các tiền tố phổ biến: "bàn ", "ban ", "table-", "table ", "t-"
  str = str.replace(/^(bàn|ban|table|-|t)\s*[-:]?\s*/i, "");

  // Kiểm tra nếu là số hợp lệ
  const parsedNumber = parseInt(str, 10);
  if (!isNaN(parsedNumber) && parsedNumber > 0 && String(parsedNumber) === str.replace(/^0+/, "")) {
    return String(parsedNumber);
  }

  // Trường hợp là định dạng mã bàn dạng ký tự an toàn (VD: "VIP-1", "A02")
  if (/^[A-Za-z0-9_-]{1,10}$/.test(str)) {
    return str.toUpperCase();
  }

  return null;
}

/**
 * Hiển thị nhãn bàn thân thiện cho giao diện người dùng
 */
export function formatTableLabel(tableId: string | number | null | undefined): string {
  const normalized = normalizeTableId(tableId);
  return normalized ? `Bàn ${normalized}` : "Chưa chọn bàn";
}
