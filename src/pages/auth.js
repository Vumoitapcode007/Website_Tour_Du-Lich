import { getCurrentUser } from "../auth.js";

export function Auth(path = "login") {
  const currentUser = getCurrentUser();
  const isRegister = path === "register";

  // Nếu đã đăng nhập, hiển thị thông báo & điều hướng
  if (currentUser) {
    return `
    <div class="auth-page-wrapper">
      <div class="container auth-container">
        <div class="auth-card auth-card-success">
          <div class="auth-logged-in">
            <img src="${currentUser.avatar}" alt="${currentUser.name}" class="auth-avatar-lg" />
            <h2>Chào mừng trở lại, ${currentUser.name}!</h2>
            <p class="text-muted">Bạn hiện đang đăng nhập với email: <strong>${currentUser.email}</strong></p>
            <div class="auth-actions">
              <a href="#/" class="btn btn-primary btn-lg">Khám phá tour ngay</a>
              <button class="btn btn-ghost-dark btn-lg" id="btn-logout-page">Đăng xuất</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  return `
  <div class="auth-page-wrapper">
    <div class="container auth-container">
      <div class="auth-card">
        <!-- Cột thông tin thương hiệu & ưu đãi -->
        <div class="auth-brand-side">
          <div class="auth-brand-overlay"></div>
          <div class="auth-brand-content">
            <a href="#/" class="auth-brand-logo">
              <svg viewBox="0 0 48 45" class="logo-mark" aria-hidden="true">
                <path fill="#fff" d="M24 44 15 26 2 22h44L31 26z"/>
                <path fill="#93c5fd" d="M24 44 9 12c8 0 15 8 15 14 0-6 7-14 15-14z"/>
              </svg>
              <span>Travel<span>Go</span></span>
            </a>

            <div class="auth-brand-headline">
              <h3>Bắt đầu hành trình khám phá thế giới</h3>
              <p>Trở thành thành viên của TravelGo để nhận vô vàn ưu đãi độc quyền cho mọi chuyến du lịch.</p>
            </div>

            <ul class="auth-perks">
              <li>
                <span class="perk-icon">🎁</span>
                <div>
                  <strong>Tặng ngay 200.000đ</strong>
                  <p>Voucher giảm giá trực tiếp cho chuyến đi đầu tiên.</p>
                </div>
              </li>
              <li>
                <span class="perk-icon">⭐</span>
                <div>
                  <strong>Tích lũy điểm thưởng</strong>
                  <p>Đổi điểm thành quà tặng và các chuyến đi miễn phí.</p>
                </div>
              </li>
              <li>
                <span class="perk-icon">🛡️</span>
                <div>
                  <strong>Bảo đảm an toàn 24/7</strong>
                  <p>Đội ngũ chuyên viên du lịch hỗ trợ bạn trên mọi nẻo đường.</p>
                </div>
              </li>
            </ul>

            <div class="auth-demo-hint">
              <div class="hint-badge">💡 Tài khoản dùng thử</div>
              <p>Email: <code>demo@travelgo.vn</code> | Pass: <code>password123</code></p>
            </div>
          </div>
        </div>

        <!-- Cột Form thao tác -->
        <div class="auth-form-side">
          <!-- Tab chuyển đổi -->
          <div class="auth-tabs" role="tablist">
            <button class="auth-tab ${!isRegister ? "active" : ""}" id="tab-login" type="button">
              Đăng nhập
            </button>
            <button class="auth-tab ${isRegister ? "active" : ""}" id="tab-register" type="button">
              Đăng ký tài khoản
            </button>
          </div>

          <!-- Thông báo lỗi/thành công -->
          <div id="auth-alert" class="auth-alert hidden"></div>

          <!-- FORM ĐĂNG NHẬP -->
          <form id="form-login" class="auth-form ${!isRegister ? "" : "hidden"}" autocomplete="on">
            <div class="form-header">
              <h2>Mừng bạn quay lại!</h2>
              <p class="text-muted">Đăng nhập để quản lý lịch trình và ưu đãi cá nhân.</p>
            </div>

            <div class="form-group">
              <label for="login-email">Địa chỉ Email</label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </span>
                <input 
                  type="email" 
                  id="login-email" 
                  placeholder="name@example.com" 
                  value="demo@travelgo.vn" 
                  required 
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="form-label-row">
                <label for="login-password">Mật khẩu</label>
                <button type="button" class="btn-link" id="btn-forgot-password">Quên mật khẩu?</button>
              </div>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input 
                  type="password" 
                  id="login-password" 
                  placeholder="Nhập mật khẩu của bạn" 
                  value="password123" 
                  required 
                  autocomplete="current-password"
                />
                <button type="button" class="toggle-password" data-target="login-password" aria-label="Hiện/ẩn mật khẩu">
                  <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-meta-row">
              <label class="custom-checkbox">
                <input type="checkbox" id="login-remember" checked />
                <span class="checkbox-box"></span>
                <span class="checkbox-text">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-submit-login">
              <span>Đăng nhập</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>

            <div class="social-divider">
              <span>Hoặc tiếp tục với</span>
            </div>

            <div class="social-buttons">
              <button type="button" class="btn-social" id="btn-google-login">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09C3.26 21.3 7.37 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.28C.46 8.24 0 10.06 0 12s.46 3.76 1.28 5.38l3.99-3.09z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.28 6.62l3.99 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                Google
              </button>
              <button type="button" class="btn-social" id="btn-facebook-login">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            <p class="auth-switch-text">
              Chưa có tài khoản? <a href="#/register" id="link-to-register">Đăng ký ngay miễn phí</a>
            </p>
          </form>

          <!-- FORM ĐĂNG KÝ -->
          <form id="form-register" class="auth-form ${isRegister ? "" : "hidden"}" autocomplete="on">
            <div class="form-header">
              <h2>Tạo tài khoản mới</h2>
              <p class="text-muted">Nhận ngay ưu đãi thành viên và bắt đầu chuyến du lịch mơ ước.</p>
            </div>

            <div class="form-group">
              <label for="reg-name">Họ và tên</label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="5"></circle>
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                  </svg>
                </span>
                <input 
                  type="text" 
                  id="reg-name" 
                  placeholder="Ví dụ: Nguyễn Văn A" 
                  required 
                  autocomplete="name"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="reg-email">Địa chỉ Email</label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </span>
                <input 
                  type="email" 
                  id="reg-email" 
                  placeholder="name@example.com" 
                  required 
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="reg-phone">Số điện thoại (tùy chọn)</label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                <input 
                  type="tel" 
                  id="reg-phone" 
                  placeholder="0912 345 678" 
                  autocomplete="tel"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="reg-password">Mật khẩu (tối thiểu 6 ký tự)</label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input 
                  type="password" 
                  id="reg-password" 
                  placeholder="Nhập ít nhất 6 ký tự" 
                  required 
                  minlength="6"
                  autocomplete="new-password"
                />
                <button type="button" class="toggle-password" data-target="reg-password" aria-label="Hiện/ẩn mật khẩu">
                  <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="reg-confirm-password">Xác nhận lại mật khẩu</label>
              <div class="input-with-icon">
                <span class="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 11 3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </span>
                <input 
                  type="password" 
                  id="reg-confirm-password" 
                  placeholder="Nhập lại mật khẩu trên" 
                  required 
                  minlength="6"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <div class="form-meta-row">
              <label class="custom-checkbox">
                <input type="checkbox" id="reg-agree" required checked />
                <span class="checkbox-box"></span>
                <span class="checkbox-text">
                  Tôi đồng ý với <a href="javascript:void(0)" class="text-primary">Điều khoản dịch vụ</a> và <a href="javascript:void(0)" class="text-primary">Chính sách bảo mật</a> của TravelGo.
                </span>
              </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-submit-register">
              <span>Đăng ký tài khoản</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>

            <p class="auth-switch-text">
              Đã có tài khoản? <a href="#/login" id="link-to-login">Đăng nhập ngay</a>
            </p>
          </form>

        </div>
      </div>
    </div>
  </div>
  `;
}
