/**
 * VISTORA — Main Shared Script
 * Handles global interactions, theme toggle, mobile menu, scroll effects,
 * toast notifications, newsletter, and homepage dynamic rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');
  initTheme();
  initStickyHeader();
  initMobileMenu();
  initBackToTop();
  window.initScrollReveal();
  initNewsletterForm();
  initHomepageRender();
  attachCardActionListeners();

  // Global image error fallback
  document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' && !e.target.dataset.fallback) {
      e.target.dataset.fallback = 'true';
      e.target.style.background = 'var(--bg-tertiary)';
      e.target.style.objectFit = 'contain';
      e.target.style.padding = '2rem';
      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150' fill='none'%3E%3Crect width='200' height='150' fill='%23f3efe9'/%3E%3Ctext x='100' y='75' text-anchor='middle' dominant-baseline='middle' font-family='serif' font-size='18' fill='%23c26d53'%3EVISTORA%3C/text%3E%3Ctext x='100' y='100' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='10' fill='%238a8a8a'%3EImage unavailable%3C/text%3E%3C/svg%3E";
    }
  }, true);
});

/* ==========================================================================
   1. Theme Management (Light / Dark Mode)
   ========================================================================== */

function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Retrieve initial theme from storage helper or system fallback
  const currentTheme = (window.VistoraStorage && window.VistoraStorage.getTheme)
    ? window.VistoraStorage.getTheme()
    : 'light';

  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';

      applyTheme(newTheme);

      if (window.VistoraStorage && window.VistoraStorage.setTheme) {
        window.VistoraStorage.setTheme(newTheme);
      }

      showToast(`Switched to ${newTheme} theme`, 'info', 2000);
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    themeToggleBtn.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    themeToggleBtn.setAttribute('title', `Switch to ${nextTheme} theme`);
  }
}

/* ==========================================================================
   2. Sticky Header Scroll State
   ========================================================================== */

function initStickyHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial check
}

/* ==========================================================================
   3. Mobile Navigation Drawer
   ========================================================================== */

function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileNavMenu');
  if (!menuBtn || !mobileMenu) return;

  const toggleMenu = (open) => {
    const isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('open');
    menuBtn.classList.toggle('active', isOpen);
    mobileMenu.classList.toggle('open', isOpen);
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  menuBtn.addEventListener('click', () => toggleMenu());

  // Close menu on nav link clicks
  const navLinks = mobileMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !menuBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });
}

/* ==========================================================================
   4. Back to Top Button
   ========================================================================== */

function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (!backToTopBtn) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 400) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* ==========================================================================
   5. Scroll Reveal Animations (IntersectionObserver)
   ========================================================================== */

window.initScrollReveal = function() {
  const revealElements = document.querySelectorAll('.reveal:not([data-reveal-observed])');
  if (!revealElements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => {
      el.setAttribute('data-reveal-observed', 'true');
      observer.observe(el);
    });
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => {
      el.setAttribute('data-reveal-observed', 'true');
      el.classList.add('reveal-visible');
    });
  }
};

/* ==========================================================================
   6. Toast Notification System
   ========================================================================== */

window.showToast = function(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <span class="toast-icon">${iconSvg}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.add('is-leaving');
    const cleanup = () => toast.remove();
    toast.addEventListener('animationend', cleanup, { once: true });
    // Safety fallback in case animationend doesn't fire
    setTimeout(cleanup, 500);
  }, duration);
};

/* ==========================================================================
   7. Newsletter Form Handler
   ========================================================================== */

function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  const emailInput = document.getElementById('newsletterEmail');
  const feedback = document.getElementById('newsletterFeedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('newsletterSubmitBtn');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Subscribing...</span>';
    }

    const email = (emailInput.value || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      if (feedback) {
        feedback.className = 'newsletter-feedback error';
        feedback.textContent = 'Please enter a valid email address.';
      }
      emailInput.setAttribute('aria-invalid', 'true');
      showToast('Please enter a valid email address.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
      return;
    }

    if (window.VistoraStorage && window.VistoraStorage.subscribeEmail) {
      const res = window.VistoraStorage.subscribeEmail(email);
      if (res.alreadySubscribed) {
        if (feedback) {
          feedback.className = 'newsletter-feedback info';
          feedback.textContent = 'You are already subscribed to the VISTORA Weekly Dispatch!';
        }
        showToast('You are already subscribed to our newsletter.', 'info');
      } else {
        if (feedback) {
          feedback.className = 'newsletter-feedback success';
          feedback.textContent = 'Thank you for subscribing! Welcome to thoughtful reading.';
        }
        emailInput.value = '';
        emailInput.removeAttribute('aria-invalid');
        showToast('Subscribed successfully to the Weekly Dispatch!', 'success');
      }
    } else {
      if (feedback) {
        feedback.className = 'newsletter-feedback success';
        feedback.textContent = 'Thank you for subscribing!';
      }
      emailInput.value = '';
      showToast('Subscribed successfully!', 'success');
    }
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  });
}

/* ==========================================================================
   8. Homepage Dynamic Rendering & Reusable Card Generator
   ========================================================================== */

function initHomepageRender() {
  const highlightsGrid = document.getElementById('highlightsGrid');
  const latestGrid = document.getElementById('latestStoriesGrid');

  if (!highlightsGrid && !latestGrid) return;

  const articles = (window.VISTORA_DATA && window.VISTORA_DATA.articles) ? window.VISTORA_DATA.articles : [];
  if (!articles.length) return;

  // Render Highlights
  if (highlightsGrid) {
    const highlightArticles = articles.filter(a => a.highlight).slice(0, 3);
    highlightsGrid.innerHTML = highlightArticles.map(createHighlightCardHTML).join('');
  }

  // Render Latest Stories (first 6 articles)
  if (latestGrid) {
    const latestArticles = articles.slice(0, 6);
    latestGrid.innerHTML = latestArticles.map(createStoryCardHTML).join('');
  }

  // Observe newly added cards
  if (window.initScrollReveal) window.initScrollReveal();
}

/**
 * Generates regular story card HTML
 */
window.createStoryCardHTML = function(article) {
  const isLiked = (window.VistoraStorage && window.VistoraStorage.isPostLiked)
    ? window.VistoraStorage.isPostLiked(article.id)
    : false;

  const isBookmarked = (window.VistoraStorage && window.VistoraStorage.isPostBookmarked)
    ? window.VistoraStorage.isPostBookmarked(article.id)
    : false;

  const initials = article.authorInitials || getInitials(article.author);
  const avatarClass = article.authorAvatarClass || 'avatar-teal';

  return `
    <article class="story-card reveal" data-id="${article.id}" data-slug="${article.slug}">
      <a href="post.html?slug=${article.slug}" class="story-card-media" tabindex="-1" aria-hidden="true">
        <img
          src="${article.image}"
          alt="${escapeHTML(article.imageAlt || article.title)}"
          class="story-card-img"
          loading="lazy"
        >
        <span class="badge category-badge">${escapeHTML(article.category)}</span>
      </a>

      <div class="story-card-body">
        <div class="story-card-meta">
          <time datetime="${article.date}">${escapeHTML(article.formattedDate || article.date)}</time>
          <span class="meta-dot">&bull;</span>
          <span>${article.readingTime || 5} min read</span>
        </div>

        <h3 class="story-card-title">
          <a href="post.html?slug=${article.slug}">${escapeHTML(article.title)}</a>
        </h3>

        <p class="story-card-excerpt">${escapeHTML(article.excerpt)}</p>

        <div class="story-card-footer">
          <div class="story-card-author">
            <div class="author-avatar ${avatarClass}">${initials}</div>
            <span class="author-name">${escapeHTML(article.author)}</span>
          </div>

          <div class="card-actions">
            <button
              type="button"
              class="card-action-btn like-btn ${isLiked ? 'active' : ''}"
              data-action="like"
              data-id="${article.id}"
              data-title="${escapeHTML(article.title)}"
              aria-label="${isLiked ? 'Unlike' : 'Like'} ${escapeHTML(article.title)}"
              aria-pressed="${isLiked}"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            <button
              type="button"
              class="card-action-btn bookmark-btn ${isBookmarked ? 'active' : ''}"
              data-action="bookmark"
              data-id="${article.id}"
              data-title="${escapeHTML(article.title)}"
              aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark'} ${escapeHTML(article.title)}"
              aria-pressed="${isBookmarked}"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
};

/**
 * Generates horizontal/editor's highlight card HTML
 */
function createHighlightCardHTML(article) {
  const isLiked = (window.VistoraStorage && window.VistoraStorage.isPostLiked)
    ? window.VistoraStorage.isPostLiked(article.id)
    : false;
  const isBookmarked = (window.VistoraStorage && window.VistoraStorage.isPostBookmarked)
    ? window.VistoraStorage.isPostBookmarked(article.id)
    : false;

  const initials = article.authorInitials || getInitials(article.author);
  const avatarClass = article.authorAvatarClass || 'avatar-terracotta';

  return `
    <article class="highlight-card reveal" data-id="${article.id}">
      <a href="post.html?slug=${article.slug}" class="story-card-media" tabindex="-1" aria-hidden="true">
        <img src="${article.image}" alt="${escapeHTML(article.imageAlt || article.title)}" class="story-card-img" loading="lazy">
        <span class="badge category-badge">${escapeHTML(article.category)}</span>
      </a>
      <div class="story-card-body">
        <div class="story-card-meta">
          <time datetime="${article.date}">${escapeHTML(article.formattedDate || article.date)}</time>
          <span class="meta-dot">&bull;</span>
          <span>${article.readingTime || 5} min read</span>
        </div>
        <h3 class="story-card-title">
          <a href="post.html?slug=${article.slug}">${escapeHTML(article.title)}</a>
        </h3>
        <p class="story-card-excerpt">${escapeHTML(article.excerpt)}</p>
        <div class="story-card-footer">
          <div class="story-card-author">
            <div class="author-avatar ${avatarClass}">${initials}</div>
            <span class="author-name">${escapeHTML(article.author)}</span>
          </div>
          <div class="card-actions">
            <button
              type="button"
              class="card-action-btn like-btn ${isLiked ? 'active' : ''}"
              data-action="like"
              data-id="${article.id}"
              data-title="${escapeHTML(article.title)}"
              aria-label="${isLiked ? 'Unlike' : 'Like'} ${escapeHTML(article.title)}"
              aria-pressed="${isLiked}"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button
              type="button"
              class="card-action-btn bookmark-btn ${isBookmarked ? 'active' : ''}"
              data-action="bookmark"
              data-id="${article.id}"
              data-title="${escapeHTML(article.title)}"
              aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark'} ${escapeHTML(article.title)}"
              aria-pressed="${isBookmarked}"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Event delegation for Like and Bookmark buttons on cards
 */
window.attachCardActionListeners = function() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-action-btn');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id, 10);
    const title = btn.dataset.title || 'article';

    if (!id || !window.VistoraStorage) return;

    if (action === 'like') {
      const isLiked = window.VistoraStorage.toggleLike(id);

      // Update all matching like buttons on page
      document.querySelectorAll(`.like-btn[data-id="${id}"]`).forEach(el => {
        el.classList.toggle('active', isLiked);
        el.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
        el.classList.remove('is-animating');
        void el.offsetWidth;
        el.classList.add('is-animating');
      });

      showToast(isLiked ? `Liked "${title}"` : `Unliked "${title}"`, 'info', 2000);
    }
    else if (action === 'bookmark') {
      const isBookmarked = window.VistoraStorage.toggleBookmark(id);

      // Update all matching bookmark buttons on page
      document.querySelectorAll(`.bookmark-btn[data-id="${id}"]`).forEach(el => {
        el.classList.toggle('active', isBookmarked);
        el.setAttribute('aria-pressed', isBookmarked ? 'true' : 'false');
        el.classList.remove('is-animating');
        void el.offsetWidth;
        el.classList.add('is-animating');
      });

      showToast(isBookmarked ? `Saved to bookmarks` : `Removed from bookmarks`, 'info', 2000);
    }
  });
};

/* Initialize interactions alias for pages that need it (saved.html, history.html) */
window.initInteractions = window.attachCardActionListeners;

/* ==========================================================================
   Helper Utilities
   ========================================================================== */

function getInitials(name) {
  if (!name) return 'V';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
