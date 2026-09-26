const SESSION_KEY = "travelgo.session";
const USER_KEY = "travelgo.users";

const demoAccounts = [
  {
    username: "admin",
    password: "123456",
    name: "Trịnh Minh Vũ",
    role: "Giám đốc điều hành",
  },
  {
    username: "vumoitap",
    password: "123456",
    name: "Hà Quốc Việt",
    role: "Trưởng phòng tư vấn",
  },
];

function readUsers() {
  try {
    const list = JSON.parse(localStorage.getItem(USER_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeUsers(list) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(list));
  } catch {
    /* không lưu được - tài khoản chỉ tồn tại trong phiên */
  }
  return list;
}

function allAccounts() {
  return demoAccounts.map((account) => {
    const saved = readUsers().find((item) => item.username === account.username);
    if (!saved) return account;
    return {
      ...account,
      name: saved.name || account.name,
      email: saved.email || "",
      phone: saved.phone || "",
      password: saved.password || account.password,
    };
  }).concat(readUsers().filter((item) => !demoAccounts.some((acc) => acc.username === item.username)));
}

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
  const session = {
    username: account.username,
    name: account.name,
    role: account.role,
    email: account.email || "",
    phone: account.phone || "",
    loginAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* không lưu được phiên - vẫn cho đăng nhập tạm thời */
  }
  return session;
}

export function login(username, password) {
  const key = String(username || "").trim();
  const account = allAccounts().find(
    (item) => item.username === key && item.password === password
  );
  if (!account) return null;
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

  const users = readUsers();
  const taken = allAccounts().some(
    (item) => item.username.toLowerCase() === info.username || item.email?.toLowerCase() === info.email
  );
  if (taken) return { errors: { username: "Tài khoản hoặc email đã được sử dụng." } };

  const account = {
    username: info.username,
    password: info.password,
    name: info.name,
    email: info.email,
    phone: info.phone,
    role: "Khách hàng",
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, account]);
  return { session: startSession(account) };
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* bỏ qua */
  }
}

function findRecord(username) {
  return readUsers().find((item) => item.username === username) || null;
}

function upsertRecord(record) {
  const users = readUsers();
  const index = users.findIndex((item) => item.username === record.username);
  if (index >= 0) users[index] = { ...users[index], ...record };
  else users.push(record);
  return writeUsers(users);
}

export function updateProfile(session, { name, email, phone }) {
  const current = findRecord(session.username);
  const info = {
    name: String(name || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    phone: String(phone || "").trim(),
  };

  const duplicated = allAccounts().some(
    (item) =>
      item.username !== session.username && info.email && item.email?.toLowerCase() === info.email
  );
  if (duplicated) return { errors: { email: "Email này đã được tài khoản khác sử dụng." } };

  upsertRecord({ ...(current || {}), ...info, username: session.username });

  const updated = { ...session, ...info, loginAt: session.loginAt };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  } catch {
    /* bỏ qua */
  }
  return { session: updated };
}

export function changePassword(session, { currentPassword, newPassword }) {
  const account = allAccounts().find((item) => item.username === session.username);
  if (!account || account.password !== currentPassword) {
    return { errors: { currentPassword: "Mật khẩu hiện tại không đúng." } };
  }
  if (String(newPassword || "").length < 6) {
    return { errors: { newPassword: "Mật khẩu mới cần tối thiểu 6 ký tự." } };
  }

  upsertRecord({
    username: session.username,
    name: account.name,
    email: account.email || "",
    phone: account.phone || "",
    password: newPassword,
  });
  return { ok: true };
}
