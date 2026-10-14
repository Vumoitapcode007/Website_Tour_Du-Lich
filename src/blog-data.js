import { tours } from "./data.js";

export const BLOG_CATEGORIES = [
  { id: "all", label: "Tất cả bài viết" },
  { id: "kinh-nghiem", label: "Kinh nghiệm du lịch" },
  { id: "am-thuc", label: "Ẩm thực & Đặc sản" },
  { id: "check-in", label: "Điểm sống ảo" },
  { id: "meo-hay", label: "Mẹo chuẩn bị" },
];

export const blogArticles = [
  {
    id: 1,
    slug: "cam-nang-du-lich-da-nang-hoi-an-tu-a-z",
    title: "Cẩm nang du lịch Đà Nẵng - Hội An từ A đến Z: Đi mùa nào đẹp, ăn gì, chơi đâu?",
    category: "kinh-nghiem",
    categoryLabel: "Kinh nghiệm du lịch",
    coverImage: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
    summary: "Tổng hợp toàn bộ kinh nghiệm vi vu Đà Nẵng - Hội An 3N2Đ: thời điểm lý tưởng, lịch trình chi tiết, các điểm check-in triệu view như Cầu Vàng, phố cổ đèn lồng và đặc sản không thể bỏ lỡ.",
    author: {
      name: "Trần Mai Anh",
      role: "Blogger Du Lịch TravelGo",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    publishedAt: "2026-10-05",
    readTime: "6 phút đọc",
    views: 3420,
    relatedTourId: 2, // Tour Đà Nẵng - Hội An
    tags: ["Đà Nẵng", "Hội An", "Cầu Vàng", "Bà Nà Hills", "Du lịch miền Trung"],
    sections: [
      {
        heading: "1. Thời điểm vàng để đi du lịch Đà Nẵng - Hội An",
        content: `Đà Nẵng và Hội An nằm ở vùng khí hậu nhiệt đới gió mùa miền Trung, có hai mùa rõ rệt là mùa khô (từ tháng 2 đến tháng 8) và mùa mưa (từ tháng 9 đến tháng 1 năm sau). 
        
        Thời gian lý tưởng nhất để bạn xách balo lên và đi là từ tháng 3 đến tháng 8. Lúc này trời trong xanh, ít mưa, nắng rực rỡ rất thuận tiện cho các hoạt động tắm biển Mỹ Khê, tham quan Bà Nà Hills và dạo thuyền ngắm đèn lồng sông Hoài về đêm.`
      },
      {
        heading: "2. Những tọa độ check-in 'cháy máy' không thể bỏ qua",
        content: `• <strong>Cầu Vàng (Bà Nà Hills):</strong> Kỳ quan được truyền thông quốc tế ca ngợi với hai bàn tay khổng lồ nâng đỡ dải lụa vàng giữa mây ngàn. Bạn nên đi cáp treo chuyến sớm nhất lúc 7h30 sáng để chụp ảnh vắng người.
        
• <strong>Phố cổ Hội An:</strong> Khi hoàng hôn buông xuống, những dãy nhà cổ sơn vàng rực lên dưới ánh đèn lồng rực rỡ. Đừng quên thử đi thuyền thả hoa đăng trên sông Hoài với giá chỉ khoảng 50.000đ - 100.000đ/thuyền.

• <strong>Bán đảo Sơn Trà & Chùa Linh Ứng:</strong> Nơi có tượng Phật Bà Quan Âm cao 67m hướng ra biển Đông, không khí thanh tịnh và tầm nhìn bao quát toàn cảnh vịnh Đà Nẵng.`
      },
      {
        heading: "3. Ẩm thực xứ Quảng ăn là ghiền",
        content: `Đến miền Trung mà không thưởng thức mì Quảng ếch, bánh tráng cuốn thịt heo hai đầu da chấm mắm nêm, hay cơm gà bà Buội Hội An thì coi như chưa trọn vẹn chuyến đi. Mức giá ẩm thực tại đây cực kỳ dễ chịu, chỉ từ 35.000đ - 65.000đ/phần ăn no nê.`
      },
      {
        heading: "4. Mẹo tiết kiệm chi phí & Lời khuyên hữu ích",
        tip: "Nếu đi theo nhóm hoặc gia đình có người lớn tuổi và trẻ nhỏ, việc đặt Tour trọn gói đã bao gồm xe đưa đón, vé cáp treo Bà Nà và phòng khách sạn 4 sao ven biển sẽ tiết kiệm hơn 25-30% so với tự đặt lẻ từng dịch vụ.",
        content: `Hãy chuẩn bị kem chống nắng, mũ rộng vành và giày thể thao êm chân vì bạn sẽ đi bộ khá nhiều khi dạo quanh phố cổ Hội An và khuôn viên Làng Pháp Bà Nà Hills.`
      }
    ]
  },
  {
    id: 2,
    slug: "kinh-nghiem-du-lich-ninh-binh-2n1d",
    title: "Kinh nghiệm du lịch Ninh Bình 2 ngày 1 đêm: Lịch trình chi tiết và chi phí tối ưu",
    category: "kinh-nghiem",
    categoryLabel: "Kinh nghiệm du lịch",
    coverImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
    summary: "Hành trình khám phá cố đô Hoa Lư, ngồi thuyền len lỏi qua các hang động Tràng An và chinh phục gần 500 bậc đá Hang Múa ngắm trọn thung lũng Tam Cốc.",
    author: {
      name: "Nguyễn Tuấn Kiệt",
      role: "Hướng dẫn viên kỳ cựu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    publishedAt: "2026-10-08",
    readTime: "5 phút đọc",
    views: 2890,
    relatedTourId: 1, // Tour Ninh Bình 2N1Đ
    tags: ["Ninh Bình", "Tràng An", "Hang Múa", "Tam Cốc", "Cố đô Hoa Lư"],
    sections: [
      {
        heading: "1. Tại sao Ninh Bình là điểm đến 'chữa lành' số 1 miền Bắc?",
        content: `Chỉ cách thủ đô Hà Nội hơn 1h30 phút di chuyển trên đường cao tốc, Ninh Bình sở hữu vẻ đẹp non nước hữu tình được UNESCO công nhận là Di sản kép Văn hóa và Thiên nhiên Thế giới. Nơi đây phù hợp cho cả chuyến đi cuối tuần ngắn ngày lẫn kỳ nghỉ gia đình.`
      },
      {
        heading: "2. Chọn tuyến thuyền nào tại Quần thể Tràng An?",
        content: `Tràng An hiện có 3 tuyến thuyền chính:
        
• <strong>Tuyến 1:</strong> Thích hợp cho người mê khám phá hang động (đi qua 9 hang động tự nhiên dài nhất).
• <strong>Tuyến 2 (Được chọn nhiều nhất):</strong> Cân bằng giữa hang động, thung lũng và phim trường King Kong (Skull Island) cùng đền Suối Tiên.
• <strong>Tuyến 3:</strong> Tham quan Hang Mây dài 1.000m kỳ ảo và đền Trần linh thiêng.`
      },
      {
        heading: "3. Chinh phục Hang Múa - 'Vạn Lý Trường Thành' thu nhỏ",
        content: `Thời gian leo Hang Múa đẹp nhất là sáng sớm (7h00) hoặc lúc hoàng hôn (16h30). Đỉnh ngọn núi Ngọa Long với tượng Rồng uốn lượn sẽ mở ra bức tranh toàn cảnh dòng sông Ngô Đồng uốn khúc giữa những rặng núi đá vôi sừng sững.`
      },
      {
        heading: "4. Thưởng thức đặc sản Ninh Bình",
        tip: "Đừng quên thử món Cơm cháy sốt thịt dê núi tại các nhà hàng gần bến thuyền Tràng An. Dê núi Ninh Bình được chăn thả tự nhiên nên thịt rất săn chắc và thơm ngọt.",
        content: `Chi phí ăn uống tại Ninh Bình khá hợp lý, trung bình từ 150.000đ - 200.000đ/người cho một bữa ăn đặc sản no nê.`
      }
    ]
  },
  {
    id: 3,
    slug: "du-thuyen-ha-long-ngu-dem-review-chan-thuc",
    title: "Du thuyền Hạ Long ngủ đêm: Review chân thực & Những điều cần biết trước khi đi",
    category: "check-in",
    categoryLabel: "Điểm sống ảo",
    coverImage: "https://live.staticflickr.com/3836/33523114580_bb89d2cc22_b.jpg",
    summary: "Trải nghiệm ngắm bình minh trên vịnh di sản, chèo thuyền kayak qua Hang Sử Sốt và thưởng thức tiệc BBQ hải sản 5 sao sang trọng giữa biển khơi.",
    author: {
      name: "Lê Hoàng Phúc",
      role: "Reviewer Du Lịch",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    publishedAt: "2026-10-10",
    readTime: "7 phút đọc",
    views: 4120,
    relatedTourId: 3, // Tour Hạ Long
    tags: ["Hạ Long", "Du thuyền 5 sao", "Hang Sử Sốt", "Kayak", "Quảng Ninh"],
    sections: [
      {
        heading: "1. Ngủ đêm trên du thuyền khác gì so với đi tàu tiếng ban ngày?",
        content: `Khác với những chuyến tàu tiếng chỉ vội vã ghé qua vài điểm tham quan, du thuyền ngủ đêm 2 ngày 1 đêm mang đến cảm giác nghỉ dưỡng cao cấp chuẩn khách sạn nổi trên mặt biển. 
        
        Bạn sẽ được đắm mình trong không gian hoàng hôn tĩnh lặng khi các tàu tiếng đã về đất liền, thưởng thức tiệc trà chiều Sunset Party trên boong sundeck và tham gia câu mực đêm cực kỳ thú vị.`
      },
      {
        heading: "2. Các hoạt động nổi bật trong lịch trình",
        content: `• <strong>Chèo thuyền Kayak hoặc thuyền nan:</strong> Tự tay khua mái chèo len lỏi qua các hang luồn và chân đảo đá vôi kỳ vĩ.
        
• <strong>Khám phá Hang Sử Sốt & Đảo Titop:</strong> Leo lên đài quan sát đảo Titop ngắm trọn 360 độ vịnh Hạ Long kỳ ảo hoặc đắm mình dưới làn nước biển mát lạnh.
        
• <strong>Tập Thái Cực Quyền (Tai Chi) đón bình minh:</strong> Bắt đầu ngày mới trên sundeck với bài tập nhẹ nhàng giữa không gian tĩnh mịch của biển cả.`
      },
      {
        heading: "3. Chuẩn bị hành lý & Lưu ý",
        tip: "Bắt buộc mang theo Căn cước công dân hoặc Hộ chiếu gốc để ban quản lý cảng vịnh đối soát an ninh trước khi lên tàu. Du thuyền có trang bị wifi nhưng sóng biển ở vùng lõi vịnh có thể chập chờn, đây là cơ hội tuyệt vời để digital detox!",
        content: `Hãy mang theo đồ bơi, kính râm, máy ảnh hoặc túi chống nước cho điện thoại để thoải mái chụp hình khi chèo kayak.`
      }
    ]
  },
  {
    id: 4,
    slug: "oanh-tac-da-lat-3n2d-top-quan-cafe-va-san-may",
    title: "Oanh tạc Đà Lạt 3 ngày 2 đêm: Top quán cafe sống ảo & Điểm săn mây đẹp ngỡ ngàng",
    category: "check-in",
    categoryLabel: "Điểm sống ảo",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    summary: "Đà Lạt chưa bao giờ làm người ta thất vọng! Cập nhật tọa độ săn mây Cầu Đất, những quán cafe view thung lũng thông reo và các món ngon ấm bụng lúc trời trở lạnh.",
    author: {
      name: "Trần Mai Anh",
      role: "Blogger Du Lịch TravelGo",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    publishedAt: "2026-10-11",
    readTime: "5 phút đọc",
    views: 5210,
    relatedTourId: 4, // Tour Đà Lạt
    tags: ["Đà Lạt", "Săn mây", "Cafe sống ảo", "Cầu Đất", "Lẩu gà lá é"],
    sections: [
      {
        heading: "1. Săn biển mây Cầu Đất - Trải nghiệm phải thử 1 lần trong đời",
        content: `Để bắt trọn khoảnh khắc biển mây bồng bềnh cuồn cuộn dưới thung lũng đồi chè Cầu Đất, bạn cần dậy từ 4h30 sáng và xuất phát từ trung tâm thành phố lúc 5h00. Thời điểm mây đẹp nhất là từ 5h45 đến 6h30 khi những tia nắng đầu tiên xuyên qua làn sương mờ ảo.`
      },
      {
        heading: "2. Bản đồ quán ăn ấm sực lòng người đêm Đà Lạt",
        content: `Nhiệt độ buổi tối tại Đà Lạt thường hạ xuống 14 - 17 độ C, cực kỳ lý tưởng để tụ họp quanh nồi lẩu bốc khói:
        
• <strong>Lẩu gà lá é Tao Ngộ:</strong> Nước dùng ngọt thanh đậm đà cùng vị the the ấm nồng của lá é.
• <strong>Lẩu bò Ba Toa quán Gỗ:</strong> Thịt bò mềm ngọt ngập tràn gân và đuôi bò béo ngậy.
• <strong>Bánh tráng nướng & Sữa đậu nành nóng:</strong> Ngay khu vực chợ đêm hoặc quanh hồ Xuân Hương.`
      },
      {
        heading: "3. Mẹo phối đồ chụp ảnh tại Đà Lạt",
        tip: "Hãy ưu tiên các trang phục tông màu ấm như be, nâu camel, trắng kem hoặc đỏ đô để tạo sự tương phản nổi bật với sắc xanh của rừng thông và đồi cỏ hồng.",
        content: `Đừng quên mang theo áo khoác ấm, khăn choàng cổ và găng tay vì buổi tối và sáng sớm Đà Lạt đón gió lạnh buốt.`
      }
    ]
  },
  {
    id: 5,
    slug: "bi-kip-san-may-sa-pa-va-chinh-phuc-fansipan",
    title: "Bí kíp săn mây Sa Pa & Chinh phục Nóc nhà Đông Dương Fansipan không mệt mỏi",
    category: "meo-hay",
    categoryLabel: "Mẹo chuẩn bị",
    coverImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    summary: "Hướng dẫn chi tiết từ việc chọn toa tàu hỏa leo núi Mường Hoa, đi cáp treo vượt thung lũng mây Fansipan đến việc khám phá bản Cát Cát thơ mộng.",
    author: {
      name: "Nguyễn Tuấn Kiệt",
      role: "Hướng dẫn viên kỳ cựu",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    publishedAt: "2026-10-12",
    readTime: "6 phút đọc",
    views: 3150,
    relatedTourId: 1, // Sa Pa hoặc miền Bắc
    tags: ["Sa Pa", "Fansipan", "Mường Hoa", "Cát Cát", "Săn mây Tây Bắc"],
    sections: [
      {
        heading: "1. Chạm tay vào cột mốc 3.143m Fansipan dễ dàng",
        content: `Nhờ hệ thống cáp treo Sun World Fansipan Legend hiện đại đạt nhiều kỷ lục thế giới, việc đặt chân lên đỉnh Fansipan giờ đây chỉ mất khoảng 20 phút di chuyển trên không trung thay vì 2 ngày leo bộ đường rừng hiểm trở. Từ cabin cáp treo, bạn sẽ được phóng tầm mắt chiêm ngưỡng toàn cảnh thung lũng Mường Hoa với những thửa ruộng bậc thang kỳ vĩ.`
      },
      {
        heading: "2. Lưu ý sức khỏe khi lên độ cao trên 3.000m",
        tip: "Trên đỉnh Fansipan không khí loãng và lạnh hơn ở thị trấn từ 8-10 độ C. Hãy đi lại chậm rãi, hít thở sâu đều đặn và chuẩn bị sẵn miếng dán giữ nhiệt cùng áo khoác cản gió chống nước.",
        content: `Nếu bạn đi cùng người lớn tuổi hoặc trẻ nhỏ, hãy mua thêm vé tàu hỏa leo núi lên đỉnh để tiết kiệm hơn 600 bậc thang đá dốc.`
      }
    ]
  },
  {
    id: 6,
    slug: "am-thuc-phu-quoc-top-mon-an-ngon-quen-loi-ve",
    title: "Ẩm thực đảo ngọc Phú Quốc: Top 8 món ngon quên lối về không thể bỏ qua",
    category: "am-thuc",
    categoryLabel: "Ẩm thực & Đặc sản",
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    summary: "Gỏi cá trích cuốn bánh tráng rau rừng, bún quậy Kiến Xây tự pha nước chấm, nhum biển nướng mỡ hành béo ngậy và hải sản tươi sống tại làng chài Hàm Ninh.",
    author: {
      name: "Lê Hoàng Phúc",
      role: "Reviewer Du Lịch",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
    },
    publishedAt: "2026-10-13",
    readTime: "4 phút đọc",
    views: 2680,
    relatedTourId: 2,
    tags: ["Phú Quốc", "Ẩm thực", "Gỏi cá trích", "Bún quậy", "Đảo ngọc"],
    sections: [
      {
        heading: "1. Gỏi cá trích - Linh hồn ẩm thực biển đảo",
        content: `Cá trích tươi rói được phi lê mỏng, bóp gỏi cùng hành tây, ớt tươi và dừa nạo sợi thơm bùi. Khi ăn cuốn cùng bánh tráng, rau rừng nhiệt đới và chấm ngập vào chén nước mắm Phú Quốc pha tỏi ớt đậu phộng đặc trưng.`
      },
      {
        heading: "2. Trải nghiệm tự tay làm nước chấm Bún Quậy",
        content: `Bún quậy Kiến Xây nổi tiếng bởi sợi bún tươi ép trực tiếp vào nồi nước dùng sôi sùng sục. Chả tôm, chả cá tươi được quết mỏng dưới đáy tô. Điểm đặc sắc là khách hàng sẽ tự tay pha chế bát nước chấm từ muối, đường, bột ngọt, quất và ớt tươi theo khẩu vị riêng của mình.`
      }
    ]
  }
];

export function listArticles(query = "", category = "all") {
  let list = [...blogArticles];
  const q = String(query || "").trim().toLowerCase();
  const cat = String(category || "all").trim();

  if (cat && cat !== "all") {
    list = list.filter((item) => item.category === cat);
  }

  if (q) {
    list = list.filter((item) => {
      const text = `${item.title} ${item.summary} ${(item.tags || []).join(" ")}`.toLowerCase();
      return text.includes(q);
    });
  }

  return list;
}

export function getArticleById(id) {
  const numId = Number(id);
  return blogArticles.find((item) => item.id === numId || item.slug === String(id));
}

export function getRelatedArticles(currentArticle, limit = 3) {
  if (!currentArticle) return [];
  return blogArticles
    .filter((item) => item.id !== currentArticle.id && item.category === currentArticle.category)
    .concat(blogArticles.filter((item) => item.id !== currentArticle.id && item.category !== currentArticle.category))
    .slice(0, limit);
}
