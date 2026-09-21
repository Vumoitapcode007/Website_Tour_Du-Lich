document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "123456") {
    localStorage.setItem("isAdmin", "true");
    location.href = "admin.html";
  } else {
    alert("Sai tài khoản hoặc mật khẩu.");
  }
});
