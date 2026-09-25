const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const tours = [
  {
    id: 1,
    name: "Tour Ninh Bình 2N1Đ",
    location: "Ninh Bình",
    price: 1590000,
    oldPrice: 1890000,
    time: "2 ngày 1 đêm",
    days: 2,
    rating: 4.8,
    reviews: 214,
    seatsLeft: 8,
    image: img("1528127269322-539801943592", 800),
    gallery: [img("1528127269322-539801943592"), img("1507525428034-b723cf961d3e"), img("1556012018-50c5900c1935")],
    description:
      "Khám phá Tràng An, Hang Múa và các điểm nổi bật tại Ninh Bình.",
    highlights: ["Vịnh Tràng An bằng thuyền row", "Hang Múa - Hang Bích", "Tràm miếu Văn Long"],
    itinerary: [
      {
        day: "Ngày 1",
        title: "Hà Nội - Tràng An - Tam Cốc",
        items: ["06:30 Xuất phát từ Hà Nội", "Tham quan Vịnh Tràng An bằng thuyền row", "Trả về Tam Cốc, nhận phòng khách sạn"],
      },
      {
        day: "Ngày 2",
        title: "Hang Múa - Văn Long - Hà Nội",
        items: ["Sáng tham quan Hang Múa, Hang Bích", "Trảm miếu Văn Long hoặc bãi đá Ngũ Hùng", "16:00 Về Hà Nội, kết thúc tour"],
      },
    ],
    includes: ["Xe du lịch đời mới", "Khách sạn 4 sao", "Bữa sáng, 3 bữa chính", "Hướng dẫn viên", "Bảo hiểm du lịch"],
    excludes: ["Chi phí cá nhân", "Tiền nước uống", "Quà tặng lưu niệm"],
    departures: ["2026-10-10", "2026-10-17", "2026-10-24", "2026-11-07"],
  },
  {
    id: 2,
    name: "Tour Đà Nẵng - Hội An",
    location: "Đà Nẵng",
    price: 2490000,
    oldPrice: 2890000,
    time: "3 ngày 2 đêm",
    days: 3,
    rating: 4.9,
    reviews: 168,
    seatsLeft: 5,
    image: img("1674296067534-0f9769040781", 800),
    gallery: [img("1674296067534-0f9769040781"), img("1732243395944-cb3ff9311091"), img("1507525428034-b723cf961d3e")],
    description: "Trải nghiệm biển Đà Nẵng và phố cổ Hội An.",
    highlights: ["Cầu Vàng & Bà Nà Hills", "Phố cổ Hội An đêm", "Bãi biển Mỹ Khê"],
    itinerary: [
      {
        day: "Ngày 1",
        title: "Đà Nẵng - Bà Nà Hills",
        items: ["Đón khách tại sân bay/ga", "Đi cáp treo lên đỉnh Bà Nà", "Tham quan làng Pháp và chùa Linh Ung"],
      },
      {
        day: "Ngày 2",
        title: "Đà Nẵng - Hội An",
        items: ["Buổi sáng tự do khám phá Đà Nẵng", "Chiều di chuyển sang Hội An", "Dạo phố cổ và xem biểu diễn lửa"],
      },
      {
        day: "Ngày 3",
        title: "Hội An - Đà Nẵng",
        items: ["Sáng tham quan chùa Bà Mụ và làng dện", "Trả khách tại Đà Nẵng trước 12:00", "Kết thúc tour"],
      },
    ],
    includes: ["Xe du lịch 29 chỗ", "Khách sạn 4 sao ven biển", "Vé cáp treo Bà Nà Hills", "Bữa sáng, 4 bữa chính", "Vé vào phố cổ Hội An"],
    excludes: ["Chi phí đưa đón sân bay riêng", "Món ăn ngoài lịch trình", "Chi phí cá nhân"],
    departures: ["2026-10-11", "2026-10-18", "2026-10-25", "2026-11-08", "2026-11-15"],
  },
  {
    id: 3,
    name: "Tour Hạ Long",
    location: "Quảng Ninh",
    price: 1990000,
    oldPrice: 2390000,
    time: "2 ngày 1 đêm",
    days: 2,
    rating: 4.7,
    reviews: 302,
    seatsLeft: 12,
    image: img("1528127269322-539801943592", 800),
    gallery: [img("1528127269322-539801943592"), img("1507525428034-b723cf961d3e"), img("1556012018-50c5900c1935")],
    description: "Du thuyền và khám phá Vịnh Hạ Long.",
    highlights: ["Du thuyền ngủ đêm", "Hang Sự Tiên", "Đảo Cô Đảo"],
    itinerary: [
      {
        day: "Ngày 1",
        title: "Hạ Long - Vịnh biển",
        items: ["07:00 Xuất phát từ Hà Nội", "Lên du thuyền, nhận phòng cabin", "Tham quan Hang Sự Tiên, đảo Cô Đảo"],
      },
      {
        day: "Ngày 2",
        title: "Vịnh Lan Hạ - Hà Nội",
        items: ["Sáng dâng chèo kayak khám phá", "Trả khách Hà Nội khoảng 16:00", "Kết thúc tour"],
      },
    ],
    includes: ["Du thuyền 2 ngày 1 đêm hạng phòng", "Bữa sáng, 3 bữa chính", "Hướng dẫn viên", "Bảo hiểm du lịch", "Nước uống trong tour"],
    excludes: ["Chi phí đồ uống riêng", "Quà lưu niệm", "Phí cảng nếu có"],
    departures: ["2026-10-12", "2026-10-19", "2026-10-26", "2026-11-09"],
  },
  {
    id: 4,
    name: "Tour Đà Lạt",
    location: "Đà Lạt",
    price: 2190000,
    oldPrice: 2590000,
    time: "3 ngày 2 đêm",
    days: 3,
    rating: 4.6,
    reviews: 187,
    seatsLeft: 6,
    image: img("1750021875875-c6151cf78269", 800),
    gallery: [img("1750021875875-c6151cf78269"), img("1666160416071-f760a7af9ea6"), img("1556012018-50c5900c1935")],
    description: "Khám phá thành phố ngàn hoa.",
    highlights: ["Chợ hoa Đà Lạt & Đồi Mứ", "Cầu Đà Lạt", "Thung lũng Tà Đùng"],
    itinerary: [
      {
        day: "Ngày 1",
        title: "Đà Lạt - Nhà thờ và chợ hoa",
        items: ["Bay/đi xe đến Đà Lạt", "Tham quan chợ hoa, Quảng trường Trung tâm", "Dạo Hồ Xuân Hương buổi tối"],
      },
      {
        day: "Ngày 2",
        title: "Đồi Mứ - Cầu Đà Lạt",
        items: ["Tham quan đồi Mứ và trang trại dâu", "Chiều tham quan cầu Đà Lạt", "Nghỉ ngơi tự do"],
      },
      {
        day: "Ngày 3",
        title: "Tà Đùng - Hà Nội",
        items: ["Sáng đi thung lũng Tà Đùng", "Mua sắm đặc sản", "Bay về Hà Nội / trả khách tại sân bay"],
      },
    ],
    includes: ["Vé máy bay khứ hồi Hà Nội - Đà Lạt", "Khách sạn 3 sao trung tâm", "Bữa sáng, 3 bữa chính", "Xe tham quan", "Hướng dẫn viên"],
    excludes: ["Hành lý phí cước thêm", "Chi phí tham quan thêm", "Chi phí cá nhân"],
    departures: ["2026-10-11", "2026-10-21", "2026-11-01", "2026-11-12"],
  },
  {
    id: 5,
    name: "Tour Sa Pa",
    location: "Sa Pa",
    price: 2890000,
    oldPrice: 3290000,
    time: "3 ngày 2 đêm",
    days: 3,
    rating: 4.9,
    reviews: 143,
    seatsLeft: 4,
    image: img("1666160416071-f760a7af9ea6", 800),
    gallery: [img("1666160416071-f760a7af9ea6"), img("1556012018-50c5900c1935"), img("1750021875875-c6151cf78269")],
    description: "Khám phá ruộng bậc thang và núi rừng Tây Bắc.",
    highlights: ["Ruộng bậc thang Mùa Hoa", "Đỉnh Fansipan", "Thị trấn Sa Pa mùa sương"],
    itinerary: [
      {
        day: "Ngày 1",
        title: "Hà Nội - Sa Pa",
        items: ["06:00 Xuất phát từ Hà Nội", "Ăn sáng tại thị xã Mộc Châu", "Chiều tham quan thị trấn Sa Pa"],
      },
      {
        day: "Ngày 2",
        title: "Fansipan - Mù Cang Chải",
        items: ["Tham quan khu du lịch Vân Sơn", "Chinh phục đỉnh Fansipan bằng xích đạm", "Tối dực Điệp Biên"],
      },
      {
        day: "Ngày 3",
        title: "Cát Cát - Hà Nội",
        items: ["Sáng tham quan bản Cát Cát", "Dừng chân thung lũng Mộc Châu", "Tối về Hà Nội"],
      },
    ],
    includes: ["Xe giường nghỉ 2 chiều hoặc vé máy bay", "Khách sạn 3 sao tại Sa Pa", "Bữa sáng, 4 bữa phụ", "Vé cáp treu Fansipan", "Hướng dẫn viên"],
    excludes: ["Chi phí leo núi chuyên nghiệp", "Trang phục bảo hộ", "Chi phí cá nhân"],
    departures: ["2026-10-16", "2026-10-23", "2026-10-30", "2026-11-13"],
  },
  {
    id: 6,
    name: "Tour Phú Quốc",
    location: "Phú Quốc",
    price: 3290000,
    oldPrice: 3690000,
    time: "3 ngày 2 đêm",
    days: 3,
    rating: 4.7,
    reviews: 121,
    seatsLeft: 10,
    image: img("1732243395944-cb3ff9311091", 800),
    gallery: [img("1732243395944-cb3ff9311091"), img("1507525428034-b723cf961d3e"), img("1674296067534-0f9769040781")],
    description: "Nghỉ dưỡng bờ biển và ngắm hoàng hôn tại đảo ngọc.",
    highlights: ["Bãi Sao - Bãi Trước", "VinWonders Phú Quốc", "Câu cá mực đêm"],
    itinerary: [
      {
        day: "Ngày 1",
        title: "Phú Quốc - Bãi Sao",
        items: ["Đón sân bay Cần Thơ/HCM", "Xe đưa đón khách sạn ven biển", "Chiều tắm biển Bãi Sao"],
      },
      {
        day: "Ngày 2",
        title: "VinWonders - Nam Chợ",
        items: ["Tham quan công viên VinWonders", "Chiều ghé chợ đêm Nam Chợ", "Tối lên thuyền câu cá mực"],
      },
      {
        day: "Ngày 3",
        title: "Hành trình về",
        items: ["Sáng tự do mua sắm đặc sản", "Trả sân bay, kết thúc tour", "Hỗ trợ check-in"],
      },
    ],
    includes: ["Vé máy bay khứ hồi", "Khách sạn 4 sao mặt biển", "Bữa sáng, 4 bữa chính", "Vé VinWonders", "Xe đưa đón sân bay"],
    excludes: ["Chi phí cá nhân", "Tiệc sinh nhật riêng", "Nước uống minh bạch"],
    departures: ["2026-10-10", "2026-10-20", "2026-11-05", "2026-11-20"],
  },
];

export const contactInfo = {
  hotline: "0326 794 336",
  hotlineDigits: "0326794336",
  email: "mvu191107@gmail.com",
  address: "Tòa nhà FPT Polytechnic, Trịnh Văn Bô, Xuân Phương, Hà Nội 100000, Việt Nam",
  hours: "Thứ 2 - Chủ nhật: 8:00 - 20:00",
  workingHours: "Hỗ trợ ngoài giờ: 0326 794 336",
};

export const team = [
  { name: "Trịnh Minh Vũ", initials: "TMV", role: "Giám đốc điều hành" },
  { name: "Hà Quốc Việt", initials: "HQV", role: "Trưởng phòng tư vấn" },
  { name: "Bùi Đức Hiệp", initials: "BDH", role: "Quản lý tour tuyến" },
  { name: "Nguyễn Tuấn Dương", initials: "NTD", role: "Chăm sóc khách hàng" },
];

export function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
}

export function formatDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
