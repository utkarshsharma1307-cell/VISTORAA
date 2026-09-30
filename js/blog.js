/**
 * VISTORA — Journal Discovery & Archive Script (blog.js)
 * Handles search, category/tag filtering, sorting, pagination, and interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  const blogCardsGrid = document.getElementById('blogCardsGrid');
  if (!blogCardsGrid) return; // Only execute on pages with blog grid

  // 1. Initial State
  const state = {
    searchQuery: '',
    category: 'all',
    tag: 'all',
    sortBy: 'newest',
    visibleCount: 6,
    pageSize: 6
  };

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const sortSelect = document.getElementById('sortSelect');
  const categoryPills = document.querySelectorAll('.category-pills .filter-pill');
  const tagChipsContainer = document.getElementById('tagChipsContainer');
  const resultsCount = document.getElementById('resultsCount');
  const activeFiltersList = document.getElementById('activeFiltersList');
  const resetAllFiltersBtn = document.getElementById('resetAllFiltersBtn');
  const emptyStateContainer = document.getElementById('emptyStateContainer');
  const emptyResetBtn = document.getElementById('emptyResetBtn');
  const loadMoreWrap = document.getElementById('loadMoreWrap');
  const loadMoreBtn = document.getElementById('loadMoreBtn');

  // Ensure data availability
  const articlesData = (window.VISTORA_DATA && Array.isArray(window.VISTORA_DATA.articles))
    ? window.VISTORA_DATA.articles
    : [];

  // 2. Parse URL Parameters
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const tagParam = params.get('tag');
    const searchParam = params.get('search') || params.get('q');
    const focusParam = params.get('focus');

    if (categoryParam) {
      state.category = categoryParam;
      updateActiveCategoryPill(categoryParam);
    }

    if (tagParam) {
      state.tag = tagParam;
    }

    if (searchParam) {
      state.searchQuery = searchParam.trim();
      if (searchInput) {
        searchInput.value = state.searchQuery;
        if (clearSearchBtn) clearSearchBtn.style.display = 'flex';
      }
    }

    const sortParam = params.get('sort');
    if (sortParam && ['newest', 'oldest', 'az', 'read-asc', 'read-desc'].includes(sortParam)) {
      state.sortBy = sortParam;
      if (sortSelect) sortSelect.value = sortParam;
    }

    if (focusParam === 'search' && searchInput) {
      setTimeout(() => {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  // 3. Render Dynamic Tags Cloud
  function renderTagChips() {
    if (!tagChipsContainer) return;

    // Extract unique tags
    const allTags = new Set();
    articlesData.forEach(art => {
      if (Array.isArray(art.tags)) {
        art.tags.forEach(t => allTags.add(t));
      }
    });

    const sortedTags = Array.from(allTags).sort();

    // Build HTML
    let html = `<button class="tag-chip ${state.tag === 'all' ? 'active' : ''}" data-tag="all">All Topics</button>`;
    sortedTags.forEach(t => {
      const isActive = state.tag.toLowerCase() === t.toLowerCase();
      html += `<button class="tag-chip ${isActive ? 'active' : ''}" data-tag="${t}">${t}</button>`;
    });

    tagChipsContainer.innerHTML = html;

    // Attach click events
    tagChipsContainer.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const clickedTag = e.currentTarget.dataset.tag;
        if (state.tag === clickedTag && clickedTag !== 'all') {
          state.tag = 'all'; // Toggle off
        } else {
          state.tag = clickedTag;
        }
        updateTagChipsUI();
        state.visibleCount = state.pageSize;
        applyFiltersAndRender();
      });
    });
  }

  function updateTagChipsUI() {
    if (!tagChipsContainer) return;
    tagChipsContainer.querySelectorAll('.tag-chip').forEach(chip => {
      if (chip.dataset.tag.toLowerCase() === state.tag.toLowerCase()) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function updateActiveCategoryPill(category) {
    categoryPills.forEach(pill => {
      if (pill.dataset.category.toLowerCase() === category.toLowerCase()) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // 4. Filtering and Sorting
  function getFilteredAndSortedArticles() {
    let list = [...articlesData];

    // Filter by Category
    if (state.category && state.category !== 'all') {
      list = list.filter(art => art.category.toLowerCase() === state.category.toLowerCase());
    }

    // Filter by Tag
    if (state.tag && state.tag !== 'all') {
      list = list.filter(art =>
        Array.isArray(art.tags) &&
        art.tags.some(t => t.toLowerCase() === state.tag.toLowerCase())
      );
    }

    // Filter by Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(art => {
        const inTitle = art.title && art.title.toLowerCase().includes(q);
        const inExcerpt = art.excerpt && art.excerpt.toLowerCase().includes(q);
        const inCategory = art.category && art.category.toLowerCase().includes(q);
        const inAuthor = art.author && art.author.toLowerCase().includes(q);
        const inTags = Array.isArray(art.tags) && art.tags.some(t => t.toLowerCase().includes(q));

        let inContent = false;
        if (Array.isArray(art.content)) {
          inContent = art.content.some(block => block.text && block.text.toLowerCase().includes(q));
        }

        return inTitle || inExcerpt || inCategory || inAuthor || inTags || inContent;
      });
    }

    // Sort Results
    switch (state.sortBy) {
      case 'oldest':
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'az':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'read-asc':
        list.sort((a, b) => (a.readingTime || 5) - (b.readingTime || 5));
        break;
      case 'read-desc':
        list.sort((a, b) => (b.readingTime || 5) - (a.readingTime || 5));
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }

    return list;
  }

  // 5. Render Story Card HTML
  function renderCard(article) {
    // Check if liked or bookmarked in storage
    const isLiked = window.VistoraStorage ? window.VistoraStorage.isPostLiked(article.id) : false;
    const isBookmarked = window.VistoraStorage ? window.VistoraStorage.isPostBookmarked(article.id) : false;
    const authorInitials = article.authorInitials || (article.author ? article.author.split(' ').map(n=>n[0]).join('') : 'VA');
    const avatarClass = article.authorAvatarClass || 'avatar-teal';

    return `
      <article class="story-card reveal reveal-visible" data-id="${article.id}" data-slug="${article.slug}">
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
              <div class="author-avatar ${avatarClass}">${authorInitials}</div>
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

  // 6. Main Apply & Render Routine
  function applyFiltersAndRender() {
    const filteredList = getFilteredAndSortedArticles();
    const totalMatching = filteredList.length;

    // Active filters summary rendering
    renderActiveFilterBadges();

    // Empty state handling
    if (totalMatching === 0) {
      blogCardsGrid.innerHTML = '';
      blogCardsGrid.style.display = 'none';
      if (emptyStateContainer) emptyStateContainer.style.display = 'flex';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      if (resultsCount) resultsCount.textContent = 'No matching stories found';
      return;
    }

    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    blogCardsGrid.style.display = 'grid';

    // Slice to current visible count
    const visibleSlice = filteredList.slice(0, state.visibleCount);
    blogCardsGrid.innerHTML = visibleSlice.map(renderCard).join('');

    // Update Result count label
    if (resultsCount) {
      if (state.searchQuery || state.category !== 'all' || state.tag !== 'all') {
        resultsCount.textContent = `Showing ${visibleSlice.length} of ${totalMatching} matching ${totalMatching === 1 ? 'story' : 'stories'}`;
      } else {
        resultsCount.textContent = `Showing ${visibleSlice.length} of ${totalMatching} stories`;
      }
    }

    // Manage Load More button
    if (loadMoreWrap && loadMoreBtn) {
      if (state.visibleCount >= totalMatching) {
        loadMoreWrap.style.display = 'none';
      } else {
        loadMoreWrap.style.display = 'flex';
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = `
          <span>Load More Stories (${totalMatching - state.visibleCount} remaining)</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        `;
      }
    }
    
    updateUrlParams();
    
    // Observe newly added cards for scroll reveal
    if (window.initScrollReveal) window.initScrollReveal();
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    if (state.searchQuery) params.set('q', state.searchQuery);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.tag !== 'all') params.set('tag', state.tag);
    if (state.sortBy !== 'newest') params.set('sort', state.sortBy);
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    history.replaceState(null, '', newUrl);
  }

  // 7. Render Active Filter Badges
  function renderActiveFilterBadges() {
    if (!activeFiltersList) return;

    let badges = [];
    let hasActiveFilters = false;

    if (state.category && state.category !== 'all') {
      hasActiveFilters = true;
      badges.push(`
        <span class="active-filter-badge">
          Category: <strong>${state.category}</strong>
          <button type="button" class="remove-filter-btn" data-filter="category" aria-label="Remove category filter">&times;</button>
        </span>
      `);
    }

    if (state.tag && state.tag !== 'all') {
      hasActiveFilters = true;
      badges.push(`
        <span class="active-filter-badge">
          Topic: <strong>${state.tag}</strong>
          <button type="button" class="remove-filter-btn" data-filter="tag" aria-label="Remove tag filter">&times;</button>
        </span>
      `);
    }

    if (state.searchQuery) {
      hasActiveFilters = true;
      badges.push(`
        <span class="active-filter-badge">
          Search: <strong>"${state.searchQuery}"</strong>
          <button type="button" class="remove-filter-btn" data-filter="search" aria-label="Clear search">&times;</button>
        </span>
      `);
    }

    activeFiltersList.innerHTML = badges.join('');

    // Toggle Global Reset Button
    if (resetAllFiltersBtn) {
      resetAllFiltersBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
    }

    // Attach badge remove triggers
    activeFiltersList.querySelectorAll('.remove-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.filter;
        if (type === 'category') {
          state.category = 'all';
          updateActiveCategoryPill('all');
        } else if (type === 'tag') {
          state.tag = 'all';
          updateTagChipsUI();
        } else if (type === 'search') {
          state.searchQuery = '';
          if (searchInput) searchInput.value = '';
          if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        }
        state.visibleCount = state.pageSize;
        applyFiltersAndRender();
      });
    });
  }

  // 8. Event Listeners Setup

  // Search Input with Debouncing
  let debounceTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = val.length > 0 ? 'flex' : 'none';
      }
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        state.searchQuery = val;
        state.visibleCount = state.pageSize;
        applyFiltersAndRender();
      }, 250);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        state.searchQuery = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        state.visibleCount = state.pageSize;
        applyFiltersAndRender();
      }
    });
  }

  // Clear Search Button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.style.display = 'none';
      state.searchQuery = '';
      state.visibleCount = state.pageSize;
      applyFiltersAndRender();
    });
  }

  // Category Pills
  categoryPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      state.category = cat;
      updateActiveCategoryPill(cat);
      state.visibleCount = state.pageSize;
      applyFiltersAndRender();
    });
  });

  // Sort Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.visibleCount = state.pageSize;
      applyFiltersAndRender();
    });
  }

  // Load More Button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = `<span>Loading stories...</span>`;

      setTimeout(() => {
        state.visibleCount += state.pageSize;
        applyFiltersAndRender();
      }, 180);
    });
  }

  // Reset All Filters
  function resetAllFilters() {
    state.searchQuery = '';
    state.category = 'all';
    state.tag = 'all';
    state.sortBy = 'newest';
    state.visibleCount = state.pageSize;

    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (sortSelect) sortSelect.value = 'newest';

    updateActiveCategoryPill('all');
    updateTagChipsUI();
    applyFiltersAndRender();

    if (window.showToast) {
      window.showToast('Filters reset to default', 'info');
    }
  }

  if (resetAllFiltersBtn) resetAllFiltersBtn.addEventListener('click', resetAllFilters);
  if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);

  // 9. Initial Execution
  parseUrlParams();
  renderTagChips();
  applyFiltersAndRender();
});
