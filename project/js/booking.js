const tourSelect = document.getElementById("tour");
const params = new URLSearchParams(location.search);
const selectedId = Number(params.get("id"));

tours.forEach(t => {
  tourSelect.innerHTML += `<option value="${t.id}" ${t.id===selectedId?"selected":""}>${t.name} - ${formatPrice(t.price)}</option>`;
});

document.getElementById("bookingForm").addEventListener("submit", e => {
  e.preventDefault();

  const tour = tours.find(t => t.id === Number(tourSelect.value));
  const quantity = Number(document.getElementById("quantity").value);

  if (quantity < 1) {
    alert("Số người phải lớn hơn 0.");
    return;
  }

  const bookings = getBookings();
  bookings.push({
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    tourId: tour.id,
    tourName: tour.name,
    quantity,
    total: tour.price * quantity,
    status: "Chờ xác nhận"
  });

  saveBookings(bookings);
  alert("Đặt tour thành công!");
  location.href = "booking.html";
});
