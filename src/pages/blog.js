import { BLOG_CATEGORIES, listArticles } from "../blog-data.js";
import { escapeHtml } from "../validate.js";

function blogCard(article) {
  return `
  <article class="blog-card">
    <a href="#/blog/${article.id}" class="blog-card-media">
      <img src="${article.coverImage}" alt="${escapeHtml(article.title)}" loading="lazy">
      <span class="blog-category-badge">${escapeHtml(article.categoryLabel)}</span>
      <span class="blog-read-time">⏱️ ${escapeHtml(article.readTime)}</span>
    </a>
    <div class="blog-card-body">
      <div class="blog-meta">
        <span class="blog-date">📅 ${article.publishedAt}</span>
        <span class="blog-views">👁️ ${article.views.toLocaleString("vi-VN")} lượt xem</span>
      </div>
      <h3 class="blog-card-title">
        <a href="#/blog/${article.id}">${escapeHtml(article.title)}</a>
      </h3>
      <p class="blog-card-excerpt">${escapeHtml(article.summary)}</p>
      <div class="blog-card-footer">
        <div class="blog-author">
          <img src="${article.author.avatar}" alt="${escapeHtml(article.author.name)}" class="blog-author-avatar">
          <div>
            <strong>${escapeHtml(article.author.name)}</strong>
            <small>${escapeHtml(article.author.role)}</small>
          </div>
        </div>
        <a href="#/blog/${article.id}" class="blog-read-more" aria-label="Đọc tiếp bài viết ${escapeHtml(article.title)}">
          Đọc tiếp →
        </a>
      </div>
    </div>
  </article>`;
}

export function Blog(path, params = {}, query = new URLSearchParams()) {
  const currentCategory = query.get("category") || "all";
  const currentSearch = query.get("q") || "";
  const articles = listArticles(currentSearch, currentCategory);
  const featured = articles[0];
  const restArticles = articles.slice(1);

  return `
  <section class="page-hero blog-hero">
    <div class="container center">
      <span class="hero-eyebrow">Cẩm Nang Du Lịch & Khám Phá</span>
      <h1>Bí Kíp Du Lịch & Trải Nghiệm 2026</h1>
      <p>Tổng hợp kinh nghiệm thực tế, lịch trình vi vu chi tiết, ẩm thực 3 miền và những tọa độ check-in đẹp mê hồn từ các chuyên gia bản địa của TravelGo.</p>
    </div>
  </section>

  <section class="section container blog-filter-section">
    <div class="blog-toolbar">
      <div class="blog-category-pills">
        ${BLOG_CATEGORIES.map(
          (cat) => `
          <a href="#/blog?category=${cat.id}${currentSearch ? `&q=${encodeURIComponent(currentSearch)}` : ""}" 
             class="pill-btn ${currentCategory === cat.id ? "active" : ""}">
            ${escapeHtml(cat.label)}
          </a>`
        ).join("")}
      </div>

      <form class="blog-search-box" id="blog-search-form">
        <input 
          type="search" 
          id="blog-search-input" 
          placeholder="Tìm bài viết, địa điểm, món ăn..." 
          value="${escapeHtml(currentSearch)}"
        >
        <button type="submit" class="btn btn-primary btn-sm">Tìm kiếm</button>
      </form>
    </div>

    ${
      !articles.length
        ? `
        <div class="empty-state">
          <p>Không tìm thấy bài viết nào phù hợp với từ khóa <strong>"${escapeHtml(currentSearch)}"</strong>.</p>
          <a class="btn btn-outline" href="#/blog">Xem tất cả bài viết</a>
        </div>`
        : `
        ${
          featured && !currentSearch && currentCategory === "all"
            ? `
          <div class="featured-blog-spotlight">
            <a href="#/blog/${featured.id}" class="featured-media">
              <img src="${featured.coverImage}" alt="${escapeHtml(featured.title)}">
              <span class="blog-featured-tag">★ Bài viết nổi bật</span>
            </a>
            <div class="featured-content">
              <div class="blog-meta">
                <span class="blog-category-badge">${escapeHtml(featured.categoryLabel)}</span>
                <span class="blog-read-time">⏱️ ${escapeHtml(featured.readTime)}</span>
                <span class="blog-date">📅 ${featured.publishedAt}</span>
              </div>
              <h2>
                <a href="#/blog/${featured.id}">${escapeHtml(featured.title)}</a>
              </h2>
              <p class="featured-summary">${escapeHtml(featured.summary)}</p>
              <div class="blog-card-footer">
                <div class="blog-author">
                  <img src="${featured.author.avatar}" alt="${escapeHtml(featured.author.name)}" class="blog-author-avatar">
                  <div>
                    <strong>${escapeHtml(featured.author.name)}</strong>
                    <small>${escapeHtml(featured.author.role)}</small>
                  </div>
                </div>
                <a href="#/blog/${featured.id}" class="btn btn-primary">Khám phá ngay →</a>
              </div>
            </div>
          </div>`
            : ""
        }

        <div class="blog-grid">
          ${(featured && !currentSearch && currentCategory === "all" ? restArticles : articles)
            .map(blogCard)
            .join("")}
        </div>`
    }
  </section>

  <section class="section container blog-newsletter-banner">
    <div class="newsletter-card">
      <div class="newsletter-icon">📬</div>
      <div class="newsletter-text">
        <h3>Nhận Cẩm Nang Du Lịch & Mã Giảm Giá 10%</h3>
        <p>Đăng ký nhận bài viết kinh nghiệm mới nhất và voucher giảm ngay 100.000đ cho chuyến đi sắp tới của bạn.</p>
      </div>
      <form class="newsletter-form" id="newsletter-blog-form">
        <input type="email" placeholder="Nhập email của bạn..." required>
        <button type="submit" class="btn btn-primary">Đăng ký ngay</button>
      </form>
    </div>
  </section>`;
}

document.addEventListener("route:changed", ({ detail }) => {
  if (detail.path !== "blog") return;

  const searchForm = document.getElementById("blog-search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = document.getElementById("blog-search-input")?.value.trim() || "";
      const cat = new URLSearchParams(detail.queryString).get("category") || "all";
      window.location.hash = `#/blog?category=${cat}${val ? `&q=${encodeURIComponent(val)}` : ""}`;
    });
  }

  const newsForm = document.getElementById("newsletter-blog-form");
  if (newsForm) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = newsForm.querySelector("input[type='email']");
      if (input && input.value) {
        alert(`Cảm ơn bạn! TravelGo đã gửi cẩm nang và mã giảm giá TRAVELGO10 tới ${input.value}.`);
        input.value = "";
      }
    });
  }
});
