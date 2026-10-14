import { getArticleById, getRelatedArticles } from "../blog-data.js";
import { getTourById } from "../tour-repository.js";
import { formatPrice } from "../data.js";
import { escapeHtml } from "../validate.js";

function renderTourCTA(tourId) {
  if (!tourId) return "";
  const tour = getTourById(tourId);
  if (!tour) return "";

  return `
  <div class="article-tour-cta">
    <div class="cta-badge">🌟 Tour Đề Xuất Cho Bài Viết Này</div>
    <div class="cta-inner">
      <img src="${tour.image}" alt="${escapeHtml(tour.name)}" class="cta-img">
      <div class="cta-info">
        <h3>${escapeHtml(tour.name)}</h3>
        <p class="cta-location">📍 ${escapeHtml(tour.location)} · 🗓️ ${escapeHtml(tour.time)}</p>
        <p class="cta-desc">${escapeHtml(tour.description)}</p>
        <div class="cta-bottom">
          <div class="cta-price-wrap">
            <span class="cta-price-label">Giá trọn gói từ:</span>
            <strong class="cta-price">${formatPrice(tour.price)}</strong>
            ${tour.oldPrice ? `<del>${formatPrice(tour.oldPrice)}</del>` : ""}
          </div>
          <div class="cta-actions">
            <a href="#/tour/${tour.id}" class="btn btn-outline btn-sm">Xem lịch trình</a>
            <a href="#/booking?tour=${tour.id}" class="btn btn-primary btn-sm">Đặt tour ngay</a>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function BlogDetail(path, params = {}) {
  const article = getArticleById(params.id);

  if (!article) {
    return `
    <section class="page-hero">
      <div class="container center">
        <span class="hero-eyebrow">404</span>
        <h1>Không tìm thấy bài viết</h1>
        <p>Bài viết cẩm nang bạn tìm kiếm không còn tồn tại hoặc đường dẫn đã thay đổi.</p>
        <a class="btn btn-primary" href="#/blog">Về trang cẩm nang du lịch</a>
      </div>
    </section>`;
  }

  const related = getRelatedArticles(article, 3);
  const currentUrl = window.location.href;

  return `
  <article class="article-page">
    <header class="article-header">
      <div class="container article-container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a href="#/">Trang chủ</a> <span>/</span>
          <a href="#/blog">Cẩm nang du lịch</a> <span>/</span>
          <span class="muted">${escapeHtml(article.categoryLabel)}</span>
        </nav>

        <span class="blog-category-badge header-badge">${escapeHtml(article.categoryLabel)}</span>
        <h1 class="article-title">${escapeHtml(article.title)}</h1>

        <div class="article-meta-row">
          <div class="article-author-info">
            <img src="${article.author.avatar}" alt="${escapeHtml(article.author.name)}" class="author-avatar-lg">
            <div>
              <strong>${escapeHtml(article.author.name)}</strong>
              <span>${escapeHtml(article.author.role)}</span>
            </div>
          </div>
          <div class="article-time-stats">
            <span>📅 Ngày đăng: ${article.publishedAt}</span>
            <span>⏱️ ${article.readTime}</span>
            <span>👁️ ${article.views.toLocaleString("vi-VN")} lượt đọc</span>
          </div>
        </div>
      </div>
    </header>

    <div class="container article-container">
      <div class="article-cover">
        <img src="${article.coverImage}" alt="${escapeHtml(article.title)}">
      </div>

      <div class="article-layout">
        <main class="article-content">
          <p class="article-lead">${escapeHtml(article.summary)}</p>

          <div class="article-toc">
            <h4>📌 Mục lục nội dung chính:</h4>
            <ul>
              ${article.sections.map((sec, i) => `<li><a href="#section-${i + 1}">${escapeHtml(sec.heading)}</a></li>`).join("")}
            </ul>
          </div>

          ${article.sections.map((sec, i) => `
            <section class="article-section" id="section-${i + 1}">
              <h2>${sec.heading}</h2>
              <div class="section-body">
                ${sec.content.split("\n\n").map(p => `<p>${p}</p>`).join("")}
              </div>
              ${sec.tip ? `
                <div class="article-tip-box">
                  <div class="tip-icon">💡</div>
                  <div>
                    <strong>Mẹo du lịch từ TravelGo:</strong>
                    <p>${escapeHtml(sec.tip)}</p>
                  </div>
                </div>` : ""}
            </section>
          `).join("")}

          ${renderTourCTA(article.relatedTourId)}

          <div class="article-share-box">
            <div class="share-title">
              <strong>Chia sẻ bài viết này:</strong>
              <span>Nếu thấy thông tin hữu ích, hãy chia sẻ cho bạn bè cùng đi nhé!</span>
            </div>
            <div class="share-buttons">
              <button type="button" class="btn btn-outline btn-sm" id="btn-copy-article-link" data-url="${currentUrl}">
                📋 Sao chép liên kết
              </button>
              <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
                Facebook
              </a>
              <a href="https://zalo.me/share?url=${encodeURIComponent(currentUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
                Zalo
              </a>
            </div>
          </div>

          <div class="article-tags">
            <strong>Thẻ chủ đề:</strong>
            ${(article.tags || []).map(t => `<a href="#/blog?q=${encodeURIComponent(t)}" class="tag-pill">#${escapeHtml(t)}</a>`).join(" ")}
          </div>
        </main>
      </div>

      ${related.length ? `
        <section class="article-related-section">
          <div class="section-title">
            <h2>Bài viết cùng chủ đề bạn có thể thích</h2>
            <p>Khám phá thêm các điểm đến và kinh nghiệm hữu ích khác</p>
          </div>
          <div class="blog-grid">
            ${related.map(item => `
              <article class="blog-card">
                <a href="#/blog/${item.id}" class="blog-card-media">
                  <img src="${item.coverImage}" alt="${escapeHtml(item.title)}" loading="lazy">
                  <span class="blog-category-badge">${escapeHtml(item.categoryLabel)}</span>
                </a>
                <div class="blog-card-body">
                  <h3 class="blog-card-title"><a href="#/blog/${item.id}">${escapeHtml(item.title)}</a></h3>
                  <p class="blog-card-excerpt">${escapeHtml(item.summary)}</p>
                  <a href="#/blog/${item.id}" class="blog-read-more">Đọc tiếp →</a>
                </div>
              </article>
            `).join("")}
          </div>
        </section>
      ` : ""}
    </div>
  </article>`;
}

document.addEventListener("click", (event) => {
  const copyBtn = event.target.closest("#btn-copy-article-link");
  if (copyBtn) {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      alert("Đã sao chép liên kết bài viết vào clipboard! Bạn có thể gửi cho bạn bè.");
    }).catch(() => {
      prompt("Sao chép liên kết bài viết:", url);
    });
  }
});
