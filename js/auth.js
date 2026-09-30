/**
 * VISTORA — Global Authentication & User Accounts (Step 2)
 * File: js/auth.js
 * Provides Login/Signup modal, session state, JWT storage, profile management,
 * and header user menu with hybrid Server + LocalStorage fallback.
 */

(function () {
  'use strict';

  const VistoraAuth = {
    currentUser: null,
    token: null,

    init: function () {
      this.token = window.VistoraStorage ? window.VistoraStorage.getToken() : null;
      this.currentUser = window.VistoraStorage ? window.VistoraStorage.getUser() : null;

      this.injectAuthModals();
      this.bindGlobalTriggers();
      this.renderHeaderUserMenu();

      // Check server session if token exists
      if (this.token) {
        this.verifyServerSession();
      }
    },

    getUser: function () {
      return this.currentUser;
    },

    isLoggedIn: function () {
      return !!this.currentUser;
    },

    isAdmin: function () {
      return this.currentUser && this.currentUser.role === 'admin';
    },

    isEditor: function () {
      return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'author');
    },

    verifyServerSession: async function () {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            this.setUser(data.user, this.token);
          }
        } else if (res.status === 401) {
          // Token expired on server, but keep local fallback if offline or clear
        }
      } catch (err) {
        // Offline / server not running - local fallback continues smoothly
      }
    },

    setUser: function (user, token) {
      this.currentUser = user;
      this.token = token || this.token;
      if (window.VistoraStorage) {
        window.VistoraStorage.setUser(user);
        if (token) window.VistoraStorage.setToken(token);
      }
      this.renderHeaderUserMenu();
      window.dispatchEvent(new CustomEvent('vistora:auth-change', { detail: { user: this.currentUser } }));
    },

    logout: function () {
      this.currentUser = null;
      this.token = null;
      if (window.VistoraStorage) {
        window.VistoraStorage.logout();
      }
      this.renderHeaderUserMenu();
      this.closeModal();
      window.dispatchEvent(new CustomEvent('vistora:auth-change', { detail: { user: null } }));
      if (window.showToast) {
        window.showToast('You have been signed out.');
      }
    },

    login: async function (email, password) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !password) {
        throw new Error('Please provide both email and password.');
      }

      // 1. Try backend API
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          this.setUser(data.user, data.token);
          return data.user;
        } else if (res.status === 401 || res.status === 400) {
          throw new Error(data.error || 'Invalid email or password.');
        }
      } catch (e) {
        // If it's a specific API error, rethrow
        if (e.message !== 'Failed to fetch' && !e.message.includes('NetworkError') && !e.message.includes('fetch')) {
          throw e;
        }
      }

      // 2. Offline / Demo account fallback
      let fallbackUser = null;
      if (cleanEmail === 'admin@vistora.blog') {
        fallbackUser = {
          id: 1,
          name: 'VISTORA Admin',
          email: 'admin@vistora.blog',
          role: 'admin',
          bio: 'Editorial administrator of VISTORA Journal.',
          avatarClass: 'avatar-terracotta',
          createdAt: new Date().toISOString()
        };
      } else if (cleanEmail === 'maya@vistora.blog') {
        fallbackUser = {
          id: 2,
          name: 'Maya Patel',
          email: 'maya@vistora.blog',
          role: 'author',
          bio: 'Senior Technology & Design Editor.',
          avatarClass: 'avatar-teal',
          createdAt: new Date().toISOString()
        };
      } else {
        const namePart = cleanEmail.split('@')[0];
        const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        fallbackUser = {
          id: Date.now(),
          name: displayName,
          email: cleanEmail,
          role: 'reader',
          bio: 'Avid reader and thinker at VISTORA.',
          avatarClass: 'avatar-olive',
          createdAt: new Date().toISOString()
        };
      }

      const mockToken = 'mock-jwt-' + Date.now();
      this.setUser(fallbackUser, mockToken);
      return fallbackUser;
    },

    register: async function (name, email, password, bio) {
      const cleanName = (name || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanName || cleanName.length < 2) throw new Error('Name must be at least 2 characters.');
      if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Enter a valid email address.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail, password, bio })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          this.setUser(data.user, data.token);
          return data.user;
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (e) {
        if (e.message !== 'Failed to fetch' && !e.message.includes('NetworkError') && !e.message.includes('fetch')) {
          throw e;
        }
      }

      // Offline creation fallback
      const newUser = {
        id: Date.now(),
        name: cleanName,
        email: cleanEmail,
        role: 'reader',
        bio: bio || 'VISTORA Journal reader.',
        avatarClass: 'avatar-terracotta',
        createdAt: new Date().toISOString()
      };
      const mockToken = 'mock-jwt-' + Date.now();
      this.setUser(newUser, mockToken);
      return newUser;
    },

    updateProfile: async function (updatedFields) {
      if (!this.currentUser) return;

      const merged = Object.assign({}, this.currentUser, updatedFields);

      if (this.token) {
        try {
          const res = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(updatedFields)
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              this.setUser(data.user, data.token || this.token);
              return data.user;
            }
          }
        } catch (e) {
          // Fallback to local
        }
      }

      this.setUser(merged, this.token);
      return merged;
    },

    injectAuthModals: function () {
      if (document.getElementById('vistoraAuthModal')) return;

      const modalHTML = `
      <!-- Global Auth Modal -->
      <div id="vistoraAuthModal" class="auth-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="auth-modal-dialog">
          <button class="auth-modal-close" id="authModalCloseBtn" aria-label="Close dialog">&times;</button>

          <div class="auth-modal-header">
            <span class="auth-brand-badge">VISTORA ACCOUNTS</span>
            <h3 class="auth-modal-title" id="authModalTitle">Welcome to VISTORA</h3>
            <p class="auth-modal-subtitle" id="authModalSubtitle">Sign in to leave comments, save your reading progress, and manage stories.</p>
          </div>

          <div class="auth-tabs-nav" id="authTabsNav">
            <button type="button" class="auth-tab-btn is-active" data-tab="login">Sign In</button>
            <button type="button" class="auth-tab-btn" data-tab="register">Create Account</button>
          </div>

          <div id="authAlertBox" class="auth-alert-msg" style="display:none;"></div>

          <!-- Login Form -->
          <form id="authLoginForm" class="auth-form-body">
            <div class="form-group">
              <label for="loginEmail" class="form-label">Email Address</label>
              <input type="email" id="loginEmail" class="form-input" placeholder="you@example.com" required autocomplete="email">
            </div>

            <div class="form-group">
              <div class="form-label-row">
                <label for="loginPassword" class="form-label">Password</label>
                <button type="button" class="form-text-link toggle-pw-btn" data-target="loginPassword">Show</button>
              </div>
              <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" required autocomplete="current-password">
            </div>

            <div class="auth-quick-creds">
              <span class="quick-creds-label">Demo accounts:</span>
              <button type="button" class="quick-fill-btn" data-email="admin@vistora.blog" data-role="Admin">Admin</button>
              <button type="button" class="quick-fill-btn" data-email="maya@vistora.blog" data-role="Author">Author</button>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginSubmitBtn">
              <span>Sign In to VISTORA</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>

          <!-- Register Form -->
          <form id="authRegisterForm" class="auth-form-body" style="display:none;">
            <div class="form-group">
              <label for="regName" class="form-label">Your Full Name</label>
              <input type="text" id="regName" class="form-input" placeholder="e.g. Julian Hayes" required>
            </div>

            <div class="form-group">
              <label for="regEmail" class="form-label">Email Address</label>
              <input type="email" id="regEmail" class="form-input" placeholder="you@example.com" required>
            </div>

            <div class="form-group">
              <div class="form-label-row">
                <label for="regPassword" class="form-label">Password (min 6 chars)</label>
                <button type="button" class="form-text-link toggle-pw-btn" data-target="regPassword">Show</button>
              </div>
              <input type="password" id="regPassword" class="form-input" placeholder="Create a secure password" minlength="6" required>
            </div>

            <div class="form-group">
              <label for="regBio" class="form-label">Bio / Tagline (Optional)</label>
              <input type="text" id="regBio" class="form-input" placeholder="Reader, architect, thinker...">
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="regSubmitBtn">
              <span>Create Account</span>
            </button>
          </form>

          <div class="auth-modal-footer">
            <p class="auth-terms-note">By signing in, you agree to VISTORA's Editorial Guidelines and Privacy Terms.</p>
          </div>
        </div>
      </div>

      <!-- User Profile Modal -->
      <div id="vistoraProfileModal" class="auth-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true">
        <div class="auth-modal-dialog">
          <button class="auth-modal-close" id="profileModalCloseBtn" aria-label="Close dialog">&times;</button>

          <div class="auth-modal-header">
            <span class="auth-brand-badge">YOUR PROFILE</span>
            <h3 class="auth-modal-title">Account Settings</h3>
            <p class="auth-modal-subtitle">Manage your public persona, reading stats, and credentials.</p>
          </div>

          <div id="profileAlertBox" class="auth-alert-msg" style="display:none;"></div>

          <form id="userProfileForm" class="auth-form-body">
            <div class="form-group">
              <label for="profileName" class="form-label">Display Name</label>
              <input type="text" id="profileName" class="form-input" required>
            </div>

            <div class="form-group">
              <label for="profileBio" class="form-label">About / Bio</label>
              <textarea id="profileBio" class="form-textarea" rows="2" placeholder="Tell the editorial community a bit about yourself..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Avatar Color Theme</label>
              <div class="avatar-picker-row">
                <label class="avatar-option"><input type="radio" name="avatarColor" value="avatar-terracotta"><span class="avatar-color-badge bg-terracotta"></span></label>
                <label class="avatar-option"><input type="radio" name="avatarColor" value="avatar-teal"><span class="avatar-color-badge bg-teal"></span></label>
                <label class="avatar-option"><input type="radio" name="avatarColor" value="avatar-olive"><span class="avatar-color-badge bg-olive"></span></label>
                <label class="avatar-option"><input type="radio" name="avatarColor" value="avatar-navy"><span class="avatar-color-badge bg-navy"></span></label>
              </div>
            </div>

            <div class="profile-meta-info" id="profileStatsRow"></div>

            <div class="form-actions-split">
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <button type="button" class="btn btn-ghost" id="profileLogoutBtn">Sign Out</button>
            </div>
          </form>
        </div>
      </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this.bindModalEvents();
    },

    bindModalEvents: function () {
      const modal = document.getElementById('vistoraAuthModal');
      const profileModal = document.getElementById('vistoraProfileModal');
      const closeBtn = document.getElementById('authModalCloseBtn');
      const profileCloseBtn = document.getElementById('profileModalCloseBtn');
      const tabBtns = document.querySelectorAll('.auth-tab-btn');
      const loginForm = document.getElementById('authLoginForm');
      const regForm = document.getElementById('authRegisterForm');
      const profileForm = document.getElementById('userProfileForm');
      const profileLogoutBtn = document.getElementById('profileLogoutBtn');

      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
      if (profileCloseBtn) profileCloseBtn.addEventListener('click', () => this.closeProfileModal());

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModal();
        });
      }

      if (profileModal) {
        profileModal.addEventListener('click', (e) => {
          if (e.target === profileModal) this.closeProfileModal();
        });
      }

      // Tab switcher
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          tabBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');

          const alertBox = document.getElementById('authAlertBox');
          if (alertBox) alertBox.style.display = 'none';

          if (tab === 'login') {
            if (loginForm) loginForm.style.display = 'block';
            if (regForm) regForm.style.display = 'none';
            const title = document.getElementById('authModalTitle');
            if (title) title.textContent = 'Welcome to VISTORA';
          } else {
            if (loginForm) loginForm.style.display = 'none';
            if (regForm) regForm.style.display = 'block';
            const title = document.getElementById('authModalTitle');
            if (title) title.textContent = 'Join the Community';
          }
        });
      });

      // Quick Fill Demo buttons
      document.querySelectorAll('.quick-fill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const email = btn.getAttribute('data-email');
          const emailInput = document.getElementById('loginEmail');
          const passInput = document.getElementById('loginPassword');
          if (emailInput) emailInput.value = email;
          if (passInput) passInput.value = 'password123';
        });
      });

      // Show/Hide password toggle
      document.querySelectorAll('.toggle-pw-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const input = document.getElementById(targetId);
          if (!input) return;
          if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = 'Hide';
          } else {
            input.type = 'password';
            btn.textContent = 'Show';
          }
        });
      });

      // Login form submit
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('loginEmail').value;
          const password = document.getElementById('loginPassword').value;
          const alertBox = document.getElementById('authAlertBox');
          const submitBtn = document.getElementById('loginSubmitBtn');

          try {
            if (submitBtn) submitBtn.disabled = true;
            if (alertBox) alertBox.style.display = 'none';
            await this.login(email, password);
            this.closeModal();
            if (window.showToast) window.showToast(`Welcome back, ${this.currentUser.name}!`);
          } catch (err) {
            if (alertBox) {
              alertBox.className = 'auth-alert-msg is-error';
              alertBox.textContent = err.message || 'Login failed.';
              alertBox.style.display = 'block';
            }
          } finally {
            if (submitBtn) submitBtn.disabled = false;
          }
        });
      }

      // Register form submit
      if (regForm) {
        regForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = document.getElementById('regName').value;
          const email = document.getElementById('regEmail').value;
          const password = document.getElementById('regPassword').value;
          const bio = document.getElementById('regBio').value;
          const alertBox = document.getElementById('authAlertBox');
          const submitBtn = document.getElementById('regSubmitBtn');

          try {
            if (submitBtn) submitBtn.disabled = true;
            if (alertBox) alertBox.style.display = 'none';
            await this.register(name, email, password, bio);
            this.closeModal();
            if (window.showToast) window.showToast(`Account created! Welcome, ${name}.`);
          } catch (err) {
            if (alertBox) {
              alertBox.className = 'auth-alert-msg is-error';
              alertBox.textContent = err.message || 'Registration failed.';
              alertBox.style.display = 'block';
            }
          } finally {
            if (submitBtn) submitBtn.disabled = false;
          }
        });
      }

      // Profile form submit
      if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = document.getElementById('profileName').value;
          const bio = document.getElementById('profileBio').value;
          const colorRadio = document.querySelector('input[name="avatarColor"]:checked');
          const avatarClass = colorRadio ? colorRadio.value : 'avatar-terracotta';
          const alertBox = document.getElementById('profileAlertBox');

          try {
            await this.updateProfile({ name, bio, avatarClass });
            if (alertBox) {
              alertBox.className = 'auth-alert-msg is-success';
              alertBox.textContent = 'Profile updated successfully!';
              alertBox.style.display = 'block';
            }
            setTimeout(() => this.closeProfileModal(), 1200);
          } catch (err) {
            if (alertBox) {
              alertBox.className = 'auth-alert-msg is-error';
              alertBox.textContent = err.message || 'Could not update profile.';
              alertBox.style.display = 'block';
            }
          }
        });
      }

      if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
          this.closeProfileModal();
          this.logout();
        });
      }
    },

    bindGlobalTriggers: function () {
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-auth-trigger]');
        if (trigger) {
          e.preventDefault();
          const action = trigger.getAttribute('data-auth-trigger');
          if (action === 'login') this.openLoginModal();
          else if (action === 'register') this.openRegisterModal();
          else if (action === 'profile') this.openProfileModal();
          else if (action === 'logout') this.logout();
        }
      });
    },

    openLoginModal: function () {
      this.injectAuthModals();
      const modal = document.getElementById('vistoraAuthModal');
      const loginTab = document.querySelector('.auth-tab-btn[data-tab="login"]');
      if (loginTab) loginTab.click();
      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }
    },

    openRegisterModal: function () {
      this.injectAuthModals();
      const modal = document.getElementById('vistoraAuthModal');
      const regTab = document.querySelector('.auth-tab-btn[data-tab="register"]');
      if (regTab) regTab.click();
      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }
    },

    openProfileModal: function () {
      this.injectAuthModals();
      if (!this.currentUser) {
        this.openLoginModal();
        return;
      }

      const modal = document.getElementById('vistoraProfileModal');
      const nameInput = document.getElementById('profileName');
      const bioInput = document.getElementById('profileBio');
      const statsRow = document.getElementById('profileStatsRow');

      if (nameInput) nameInput.value = this.currentUser.name || '';
      if (bioInput) bioInput.value = this.currentUser.bio || '';

      const avatarClass = this.currentUser.avatarClass || 'avatar-terracotta';
      const radio = document.querySelector(`input[name="avatarColor"][value="${avatarClass}"]`);
      if (radio) radio.checked = true;

      // Stats
      if (statsRow && window.VistoraStorage) {
        const stats = window.VistoraStorage.getReadingStats();
        const bookmarks = window.VistoraStorage.getBookmarkedPosts();
        statsRow.innerHTML = `
          <div class="user-stats-pill"><strong>${stats.articlesCompleted || 0}</strong> Articles Read</div>
          <div class="user-stats-pill"><strong>${stats.totalMinutesRead || 0}</strong> Mins Reading</div>
          <div class="user-stats-pill"><strong>${bookmarks.length || 0}</strong> Bookmarks</div>
          <div class="user-stats-pill role-badge">Role: <strong>${this.currentUser.role || 'Reader'}</strong></div>
        `;
      }

      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      }
    },

    closeModal: function () {
      const modal = document.getElementById('vistoraAuthModal');
      if (modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    },

    closeProfileModal: function () {
      const modal = document.getElementById('vistoraProfileModal');
      if (modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    },

    renderHeaderUserMenu: function () {
      const container = document.getElementById('userNavContainer');
      if (!container) return;

      if (!this.currentUser) {
        container.innerHTML = `
          <button type="button" class="btn btn-outline btn-sm auth-header-btn" data-auth-trigger="login">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Sign In</span>
          </button>
        `;
        return;
      }

      const initials = this.currentUser.name
        ? this.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';
      const role = this.currentUser.role || 'Reader';
      const avatarClass = this.currentUser.avatarClass || 'avatar-terracotta';
      const isPrivileged = role === 'admin' || role === 'author';

      container.innerHTML = `
        <div class="user-menu-dropdown">
          <button type="button" class="user-avatar-btn ${avatarClass}" id="userAvatarBtn" aria-label="User Account Menu" aria-expanded="false">
            <span class="user-initials">${initials}</span>
          </button>

          <div class="user-dropdown-pane" id="userDropdownPane">
            <div class="user-dropdown-header">
              <div class="dropdown-user-name">${this.escapeHTML(this.currentUser.name)}</div>
              <div class="dropdown-user-email">${this.escapeHTML(this.currentUser.email)}</div>
              <span class="dropdown-role-tag">${role.toUpperCase()}</span>
            </div>

            <ul class="user-dropdown-links">
              <li>
                <a href="admin.html" class="dropdown-link ${isPrivileged ? 'highlight-cms' : ''}">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <span>${isPrivileged ? 'Editorial CMS Studio' : 'Write a Story'}</span>
                </a>
              </li>
              <li>
                <a href="saved.html" class="dropdown-link">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  <span>Saved Stories</span>
                </a>
              </li>
              <li>
                <a href="history.html" class="dropdown-link">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Reading History &amp; Stats</span>
                </a>
              </li>
              <li>
                <button type="button" class="dropdown-link btn-text-reset" data-auth-trigger="profile">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Account Settings</span>
                </button>
              </li>
              <li class="dropdown-divider"></li>
              <li>
                <button type="button" class="dropdown-link text-danger btn-text-reset" data-auth-trigger="logout">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      `;

      const avatarBtn = document.getElementById('userAvatarBtn');
      const dropdownPane = document.getElementById('userDropdownPane');

      if (avatarBtn && dropdownPane) {
        avatarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = dropdownPane.classList.toggle('is-open');
          avatarBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', (e) => {
          if (!container.contains(e.target)) {
            dropdownPane.classList.remove('is-open');
            avatarBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    },

    escapeHTML: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  };

  // Expose to window
  window.VistoraAuth = VistoraAuth;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VistoraAuth.init());
  } else {
    VistoraAuth.init();
  }
})();
