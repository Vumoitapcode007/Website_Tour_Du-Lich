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
