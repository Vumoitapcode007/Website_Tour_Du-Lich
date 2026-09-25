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
  return [...demoAccounts, ...readUsers()];
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
