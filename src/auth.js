const SESSION_KEY = "travelgo.session";
const USER_KEY = "travelgo.users";
const STAFF_OVERRIDE_KEY = "travelgo.staff";

/* ---------- Vai trò & phân quyền ---------- */

export const PERMISSIONS = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
  "bookings.assign",
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
  "guide.dashboard.view",
  "guide.tours.view",
  "guide.tours.run",
  "guide.customers.view",
];

/* Quyền dành riêng cho Tour Guide: chỉ xem tour được phân công và cập nhật
   trạng thái vận hành (sắp khởi hành → đang diễn ra → hoàn thành) */
const GUIDE_PERMISSIONS = [
  "guide.dashboard.view",
  "guide.tours.view",
  "guide.tours.run",
  "guide.customers.view",
];

const STAFF_PERMISSIONS = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
  "bookings.assign",
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
  tour_guide: {
    key: "tour_guide",
    label: "Hướng dẫn viên",
    desc: "Xem tour được phân công, danh sách khách và cập nhật tiến trình tour.",
  },
  customer: {
    key: "customer",
    label: "Khách hàng",
    desc: "Tài khoản trên website, không truy cập khu vực quản trị.",
  },
};

/* Nhóm tài khoản có thể truy cập khu vực quản trị (admin-style) */
const ADMIN_ROLES = ["admin", "manager", "staff"];

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS,
  manager: PERMISSIONS.filter(
    (key) => !["users.manage", "settings.manage", "logs.view"].includes(key)
  ),
  staff: STAFF_PERMISSIONS,
  tour_guide: GUIDE_PERMISSIONS,
  customer: [],
};

export function roleLabel(roleKey) {
  return ROLES[roleKey]?.label || ROLES.customer.label;
}

export function rolePermissions(roleKey) {
  return ROLE_PERMISSIONS[roleKey] || [];
}

export function isStaffRole(roleKey) {
  return ADMIN_ROLES.includes(roleKey) || roleKey === "tour_guide";
}

/* Admin-style = vào được toàn bộ khu vực quản trị (dùng chung layout/CSS) */
export function isAdminRole(roleKey) {
  return ADMIN_ROLES.includes(roleKey);
}

/* Tour Guide dùng chung layout nhưng không được chạm vào nghiệp vụ Admin */
export function isGuideRole(roleKey) {
  return roleKey === "tour_guide";
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
  {
    username: "khachhang",
    password: "123456",
    name: "Nguyễn Minh Anh",
    roleKey: "customer",
    title: "Khách hàng mẫu",
    email: "minhanh.nguyen@gmail.com",
    phone: "0912345001",
    status: "active",
    createdAt: "2024-06-10T03:00:00.000Z",
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

/* Danh sách hướng dẫn viên đang hoạt động - dùng cho ô phân công Tour Guide */
export function listGuides() {
  return listAccounts("tour_guide").filter((item) => item.status === "active");
}

export function getGuide(guideId) {
  if (!guideId) return null;
  const key = String(guideId).trim().toLowerCase();
  return listAccounts("tour_guide").find((item) => item.username.toLowerCase() === key) || null;
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

/* Đăng nhập bằng tài khoản hoặc email (không phân biệt hoa thường) */
export function login(username, password) {
  const key = String(username || "").trim().toLowerCase();
  const account = allAccounts().find(
    (item) =>
      (item.username.toLowerCase() === key || item.email?.toLowerCase() === key) &&
      item.password === password
  );
  if (!account) return null;
  if (account.status === "locked") return { locked: true, name: account.name };
  return startSession(account);
}

export function register({ name, username, email, phone, password }) {
  const info = {
    name: String(name || "").trim(),
    username: String(username || "").trim().toLowerCase(),
    email: String(email || "").trim().toLowerCase(),
    phone: String(phone || "").trim(),
    password: String(password || ""),
  };

  const taken = allAccounts().some(
    (item) =>
      item.username.toLowerCase() === info.username ||
      (info.email && item.email?.toLowerCase() === info.email)
  );
  if (taken) return { errors: { username: "Tài khoản hoặc email đã được sử dụng." } };

  const account = {
    username: info.username,
    password: info.password,
    name: info.name,
    email: info.email,
    phone: info.phone,
    roleKey: "customer",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  writeRaw(USER_KEY, [...readUsers(), account]);
  return { session: startSession(account) };
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* bỏ qua */
  }
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

/* Chỉ Admin/Trưởng phòng/Nhân viên mới vào được khu vực #/admin */
export function canAccessAdminArea() {
  const session = getSession();
  if (!session) return false;
  return isAdminRole(resolveRoleKey(session));
}

/* Đích đến sau khi đăng nhập theo vai trò */
export function homePathForRole(roleKey) {
  if (isGuideRole(roleKey)) return "guide";
  if (isAdminRole(roleKey)) return "admin";
  return "my-bookings";
}

export function hasAnyPermission(keys) {
  return keys.some((key) => hasPermission(key));
}
