if (localStorage.getItem("isAdmin") !== "true") {
  location.href = "login.html";
}

const table = document.getElementById("bookingTable");

function renderBookings() {
  const bookings = getBookings();

  if (!bookings.length) {
    table.innerHTML = '<div class="form empty">Chưa có đơn đặt tour.</div>';
    return;
  }

  table.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Khách hàng</th>
          <th>Tour</th>
          <th>Số người</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${bookings.map((b,index) => `
          <tr>
            <td>${b.name}<br>${b.phone}</td>
            <td>${b.tourName}</td>
            <td>${b.quantity}</td>
            <td>${formatPrice(b.total)}</td>
            <td>${b.status}</td>
            <td>
              <button onclick="confirmBooking(${index})">Xác nhận</button>
              <button onclick="deleteBooking(${index})">Xóa</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>`;
}

function confirmBooking(index) {
  const bookings = getBookings();
  bookings[index].status = "Đã xác nhận";
  saveBookings(bookings);
  renderBookings();
}

function deleteBooking(index) {
  if (!confirm("Bạn có chắc muốn xóa đơn này?")) return;
  const bookings = getBookings();
  bookings.splice(index,1);
  saveBookings(bookings);
  renderBookings();
}

function logout() {
  localStorage.removeItem("isAdmin");
  location.href = "login.html";
}

renderBookings();
