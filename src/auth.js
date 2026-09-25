const SESSION_KEY = "travelgo.session";

const accounts = [
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

export function login(username, password) {
  const account = accounts.find(
    (item) => item.username === username.trim() && item.password === password
  );
  if (!account) return null;

  const session = {
    username: account.username,
    name: account.name,
    role: account.role,
    loginAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* không lưu được phiên - vẫn cho đăng nhập tạm thời */
  }
  return session;
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* bỏ qua */
  }
}
