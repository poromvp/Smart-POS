export type UserRole = "chef" | "cashier" | "manager" | "waiter";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "u-001",
    name: "Bếp trưởng Lập",
    email: "chef@smartpos.vn",
    password: "123456",
    role: "chef",
  },
  {
    id: "u-002",
    name: "Thu ngân Mai",
    email: "cashier@smartpos.vn",
    password: "123456",
    role: "cashier",
  },
  {
    id: "u-003",
    name: "Quản lý Hạnh",
    email: "manager@smartpos.vn",
    password: "123456",
    role: "manager",
  },
  {
    id: "u-004",
    name: "Phục vụ Linh",
    email: "waiter@smartpos.vn",
    password: "123456",
    role: "waiter",
  },
];

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  chef: "/kds",
  cashier: "/pos",
  manager: "/admin",
  waiter: "/order-taking",
};

export async function mockLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: MockUser } | { ok: false; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = MOCK_USERS.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail &&
      candidate.password === password,
  );

  if (!user) {
    return {
      ok: false,
      message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
    };
  }

  return {
    ok: true,
    user,
  };
}
