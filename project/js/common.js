document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");

  if (header) {
    header.innerHTML = `
      <nav class="nav">
        <a class="logo" href="../index.html">TravelGo</a>
        <ul class="menu">
          <li><a href="../index.html">Trang chủ</a></li>
          <li><a href="tours.html">Tour</a></li>
          <li><a href="booking.html">Đơn đặt tour</a></li>
          <li><a href="login.html">Quản lý</a></li>
        </ul>
      </nav>`;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <h3>TravelGo</h3>
        <p>Website đặt tour du lịch - HTML, CSS và Vanilla JavaScript.</p>
      </div>`;
  }
});

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
}

function saveBookings(bookings) {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function getBookings() {
  return JSON.parse(localStorage.getItem("bookings") || "[]");
}
