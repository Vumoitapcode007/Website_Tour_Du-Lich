export const tours = [
  {
    id: 1,
    name: "Tour Ninh Bình 2N1Đ",
    location: "Ninh Bình",
    price: 1590000,
    time: "2 ngày 1 đêm",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
    description:
      "Khám phá Tràng An, Hang Múa và các điểm nổi bật tại Ninh Bình.",
  },
  {
    id: 2,
    name: "Tour Đà Nẵng - Hội An",
    location: "Đà Nẵng",
    price: 2490000,
    time: "3 ngày 2 đêm",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae0b?auto=format&fit=crop&w=800&q=80",
    description: "Trải nghiệm biển Đà Nẵng và phố cổ Hội An.",
  },
  {
    id: 3,
    name: "Tour Hạ Long",
    location: "Quảng Ninh",
    price: 1990000,
    time: "2 ngày 1 đêm",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
    description: "Du thuyền và khám phá Vịnh Hạ Long.",
  },
  {
    id: 4,
    name: "Tour Đà Lạt",
    location: "Đà Lạt",
    price: 2190000,
    time: "3 ngày 2 đêm",
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae0b?auto=format&fit=crop&w=800&q=80",
    description: "Khám phá thành phố ngàn hoa.",
  },
];

export function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
}