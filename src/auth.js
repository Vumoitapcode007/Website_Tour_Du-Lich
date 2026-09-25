// Quản lý xác thực người dùng (Authentication Service)
const STORAGE_KEY_USERS = "travelgo_users";
const STORAGE_KEY_CURRENT = "travelgo_current_user";

// Khởi tạo danh sách người dùng mẫu nếu chưa có
function initUsers() {
  const users = localStorage.getItem(STORAGE_KEY_USERS);
  if (!users) {
    const defaultUsers = [
      {
        id: "usr_1",
        name: "Nguyễn Văn Du Lịch",
        email: "demo@travelgo.vn",
        password: "password123",
        phone: "0901234567",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
  }
}

initUsers();

export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
  } catch (e) {
    return [];
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    const SESSION_KEY = "travelgo.session";
    const USER_KEY = "travelgo.users";
    const STAFF_OVERRIDE_KEY = "travelgo.staff";

    /* ---------- Vai trò & phân quyền ---------- */
  }
}
export const PERMISSIONS = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
  "tours.view",
  "tours.manage",
  "customers.view",
  "customers.manage",
  "messages.view",
  "messages.manage",
  "reviews.view",
  "reviews.manage",
  "promotions.view",
  "promotions.manage",
  "reports.view",
  "users.view",
  "users.manage",
  "settings.view",
  "settings.manage",
  "logs.view",
];

const STAFF_PERMISSIONS = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
  "tours.view",
  "customers.view",
  "messages.view",
  "messages.manage",
  "reviews.view",
  "reviews.manage",
  "promotions.view",
  "reports.view",
];

export const ROLES = {
  admin: {
    key: "admin",
    label: "Quản trị viên",
    desc: "Toàn quyền trên hệ thống, gồm tài khoản và cấu hình.",
  },
  manager: {
    key: "manager",
    label: "Trưởng phòng",
    desc: "Điều hành nghiệp vụ, không quản lý tài khoản và nhật ký hệ thống.",
  },
  staff: {
    key: "staff",
    label: "Nhân viên",
    desc: "Xử lý đơn đặt tour, tin nhắn, đánh giá và khách hàng.",
  },
  customer: {
    key: "customer",
    label: "Khách hàng",
    desc: "Tài khoản trên website, không truy cập khu vực quản trị.",
  },
};

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS,
  manager: PERMISSIONS.filter(
    (key) => !["users.manage", "settings.manage", "logs.view"].includes(key)
  ),
  staff: STAFF_PERMISSIONS,
  customer: [],
};

export function roleLabel(roleKey) {
  return ROLES[roleKey]?.label || ROLES.customer.label;
}

export function rolePermissions(roleKey) {
  return ROLE_PERMISSIONS[roleKey] || [];
}

export function isStaffRole(roleKey) {
  return roleKey === "admin" || roleKey === "manager" || roleKey === "staff";
}

function resolveRoleKey(account) {
  if (account?.roleKey && ROLES[account.roleKey]) return account.roleKey;
  if (account?.isAdmin) return "admin";
  return "customer";
}

/* ---------- Tài khoản mẫu ---------- */

const demoAccounts = [
  {
    username: "admin",
    password: "123456",
    name: "Trịnh Minh Vũ",
    roleKey: "admin",
    title: "Giám đốc điều hành",
    email: "mvu191107@gmail.com",
    phone: "0326794336",
    status: "active",
    createdAt: "2024-01-08T02:10:00.000Z",
  },
  {
    username: "vumoitap",
    password: "123456",
    name: "Hà Quốc Việt",
    roleKey: "manager",
    title: "Trưởng phòng tư vấn",
    email: "viethq.fpt@gmail.com",
    phone: "0912345678",
    status: "active",
    createdAt: "2024-02-19T07:45:00.000Z",
  },
  {
    username: "nhanvien",
    password: "123456",
    name: "Bùi Đức Hiệp",
    roleKey: "staff",
    title: "Quản lý tour tuyến",
    email: "hiepbd.fpt@gmail.com",
    phone: "0987654321",
    status: "active",
    createdAt: "2024-05-06T01:20:00.000Z",
  },
];

export const DEMO_CREDENTIALS = demoAccounts.map(({ username, password, name, title, roleKey }) => ({
  username,
  password,
  name,
  title,
  roleKey,
}));

/* ---------- Lưu trữ tài khoản ---------- */

function readRaw(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function login(email, password) {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (!user) {
    throw new Error("Email hoặc mật khẩu không chính xác!");
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1677ff&color=fff`,
  };

  localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(sessionUser));
  document.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: sessionUser } }));
  return sessionUser;
}

export function register({ name, email, password, phone = "" }) {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (!name.trim()) {
    throw new Error("Vui lòng nhập họ và tên!");
  }
  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    throw new Error("Email không đúng định dạng!");
  }
  if (!password || password.length < 6) {
    throw new Error("Mật khẩu phải chứa ít nhất 6 ký tự!");
  }

  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error("Email này đã được sử dụng. Vui lòng chọn đăng nhập hoặc dùng email khác!");
  }

  const newUser = {
    id: "usr_" + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: password,
    phone: phone.trim(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1677ff&color=fff`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

  // Tự động đăng nhập sau khi đăng ký
  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    avatar: newUser.avatar,
  };
  localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(sessionUser));
  document.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: sessionUser } }));
  return sessionUser;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY_CURRENT);
  document.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: null } }));
}
function writeRaw(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bộ nhớ trình duyệt bị chặn - dữ liệu chỉ tồn tại trong phiên */
  }
  return value;
}

function readUsers() {
  const list = readRaw(USER_KEY);
  return Array.isArray(list) ? list : [];
}

function readStaffOverrides() {
  const list = readRaw(STAFF_OVERRIDE_KEY);
  return Array.isArray(list) ? list : [];
}

function buildAccount(base, origin) {
  const roleKey = resolveRoleKey(base);
  return {
    ...base,
    origin,
    roleKey,
    role: roleLabel(roleKey),
    status: base.status === "locked" ? "locked" : "active",
    createdAt: base.createdAt || new Date().toISOString(),
  };
}

function allAccounts() {
  const overrides = new Map(readStaffOverrides().map((item) => [item.username, item]));
  const staff = demoAccounts.map((base) =>
    buildAccount({ ...base, ...(overrides.get(base.username) || {}) }, "demo")
  );
  return [...staff, ...readUsers().map((item) => buildAccount(item, "registered"))];
}

export function getAccount(username) {
  if (!username) return null;
  const key = String(username).trim().toLowerCase();
  return allAccounts().find((item) => item.username.toLowerCase() === key) || null;
}

export function listAccounts(roleKey = "") {
  const list = allAccounts();
  return roleKey ? list.filter((item) => item.roleKey === roleKey) : list;
}

function persistAccount(record) {
  if (record.origin === "demo") {
    const overrides = readStaffOverrides().filter(
      (item) => item.username !== record.username
    );
    overrides.push({
      username: record.username,
      name: record.name,
      email: record.email,
      phone: record.phone,
      roleKey: record.roleKey,
      status: record.status,
      password: record.password,
    });
    writeRaw(STAFF_OVERRIDE_KEY, overrides);
    return;
  }
  const users = readUsers();
  const index = users.findIndex((item) => item.username === record.username);
  if (index >= 0) users[index] = record;
  else users.push(record);
  writeRaw(USER_KEY, users);
}

export function saveAccount(payload = {}) {
  const username = String(payload.username || "").trim().toLowerCase();
  if (!username) return { errors: { username: "Vui lòng nhập tài khoản." } };

  const current = getAccount(username);
  const nextPassword = String(payload.password || "");
  const record = {
    ...(current?.origin === "registered" ? current : {}),
    username,
    name: String(payload.name ?? current?.name ?? username).trim(),
    email: String(payload.email ?? current?.email ?? "").trim().toLowerCase(),
    phone: String(payload.phone ?? current?.phone ?? "").trim(),
    roleKey: ROLES[payload.roleKey] ? payload.roleKey : current?.roleKey || "customer",
    status: payload.status === "locked" ? "locked" : "active",
    password: nextPassword || current?.password || "",
    createdAt: current?.createdAt || new Date().toISOString(),
  };

  persistAccount({ ...record, origin: current?.origin || "registered" });
  return { account: getAccount(username) };
}

export function removeAccount(username) {
  const key = String(username || "").trim().toLowerCase();
  if (demoAccounts.some((item) => item.username === key)) {
    return { error: "Không thể xoá tài khoản mẫu của hệ thống." };
  }
  writeRaw(
    USER_KEY,
    readUsers().filter((item) => item.username !== key)
  );
  return { ok: true };
}

export function changePassword(username, oldPassword, newPassword) {
  const account = getAccount(username);
  if (!account) return { errors: { password: "Không tìm thấy tài khoản." } };
  if (account.password !== oldPassword) {
    return { errors: { password: "Mật khẩu hiện tại không đúng." } };
  }
  if (String(newPassword || "").length < 6) {
    return { errors: { password: "Mật khẩu mới phải có ít nhất 6 ký tự." } };
  }
  saveAccount({ ...account, password: newPassword });
  return { ok: true };
}

export function updateProfile(username, patch = {}) {
  const account = getAccount(username);
  if (!account) return { errors: { name: "Không tìm thấy tài khoản." } };

  const email = String(patch.email ?? account.email ?? "").trim().toLowerCase();
  const duplicated = allAccounts().some(
    (item) => item.username !== account.username && email && item.email?.toLowerCase() === email
  );
  if (duplicated) return { errors: { email: "Email này đã được tài khoản khác sử dụng." } };

  saveAccount({
    ...account,
    name: patch.name,
    email,
    phone: patch.phone,
  });

  const next = getAccount(account.username);
  const session = getSession();
  if (session && session.username === account.username) {
    const updated = {
      ...session,
      name: next.name,
      email: next.email || "",
      phone: next.phone || "",
    };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    } catch {
      /* bỏ qua */
    }
  }
  return { account: next };
}

/* ---------- Phiên đăng nhập ---------- */

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getSession());
}

function startSession(account) {
  const roleKey = resolveRoleKey(account);
  const session = {
    username: account.username,
    name: account.name,
    role: roleLabel(roleKey),
    roleKey,
    title: account.title || "",
    email: account.email || "",
    phone: account.phone || "",
    status: account.status || "active",
    loginAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* không lưu được phiên - vẫn cho đăng nhập tạm thời */
  }
  return session;
}

/* ---------- Kiểm tra quyền ---------- */

export function hasPermission(key) {
  const session = getSession();
  if (!session) return false;
  return rolePermissions(resolveRoleKey(session)).includes(key);
}

export function canAccessAdmin() {
  const session = getSession();
  if (!session) return false;
  return isStaffRole(resolveRoleKey(session));
}

export function hasAnyPermission(keys) {
  return keys.some((key) => hasPermission(key));
}

