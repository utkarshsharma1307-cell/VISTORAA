/**
 * VISTORA — Article Page View JavaScript
 * File: js/post.js
 * Handles post data loading, dynamic block rendering, reading progress bar,
 * like/bookmark persistence, Web Share/Clipboard API, and related articles.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const articleContainer = document.getElementById('articleContainer');
    if (!articleContainer) return;

    initPostPage();
  });

  function initPostPage() {
    const articleLoader = document.getElementById('articleLoader');
    const postContent = document.getElementById('postContent');
    const postNotFound = document.getElementById('postNotFound');

    // 1. Extract URL Parameters (slug or id)
    const urlParams = new URLSearchParams(window.location.search);
    const slugParam = urlParams.get('slug');
    const idParam = urlParams.get('id');

    const articles = (window.VISTORA_DATA && window.VISTORA_DATA.articles) || [];

    let currentArticle = null;
    if (slugParam) {
      currentArticle = articles.find((a) => a.slug === slugParam);
    } else if (idParam) {
      currentArticle = articles.find((a) => a.id === parseInt(idParam, 10));
    }

    // If article not found or parameters missing, display error state
    if (!currentArticle) {
      if (articleLoader) articleLoader.style.display = 'none';
      if (postContent) postContent.style.display = 'none';
      if (postNotFound) postNotFound.style.display = 'block';
      document.title = 'Story Not Found — VISTORA';
      return;
    }

    // 2. Populate Article Meta & Header Information
    document.title = `${currentArticle.title} — VISTORA`;

    // Breadcrumb
    const breadcrumbCategory = document.getElementById('postBreadcrumbCategory');
    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = currentArticle.category;
      breadcrumbCategory.href = `blog.html?category=${encodeURIComponent(currentArticle.category)}`;
    }

    // Category Badge
    const postCategoryBadge = document.getElementById('postCategoryBadge');
    if (postCategoryBadge) {
      postCategoryBadge.textContent = currentArticle.category;
      postCategoryBadge.href = `blog.html?category=${encodeURIComponent(currentArticle.category)}`;
    }

    // Title & Subtitle
    const postTitle = document.getElementById('postTitle');
    if (postTitle) postTitle.textContent = currentArticle.title;

    const postSubtitle = document.getElementById('postSubtitle');
    if (postSubtitle) postSubtitle.textContent = currentArticle.excerpt;

    // Author Info
    const postAuthorAvatar = document.getElementById('postAuthorAvatar');
    if (postAuthorAvatar) {
      postAuthorAvatar.textContent = currentArticle.authorInitials || 'VA';
      postAuthorAvatar.className = `author-avatar-img ${currentArticle.authorAvatarClass || 'avatar-teal'}`;
    }

    const postAuthorName = document.getElementById('postAuthorName');
    if (postAuthorName) postAuthorName.textContent = currentArticle.author;

    const postAuthorRole = document.getElementById('postAuthorRole');
    if (postAuthorRole) postAuthorRole.textContent = currentArticle.authorRole;

    // Date & Reading Time
    const postDate = document.getElementById('postDate');
    if (postDate) {
      postDate.textContent = currentArticle.formattedDate || currentArticle.date;
      postDate.setAttribute('datetime', currentArticle.date);
    }

    const postReadTime = document.getElementById('postReadTime');
    if (postReadTime) {
      const readMinutes = currentArticle.readingTime || 5;
      postReadTime.textContent = `${readMinutes} min read`;
    }

    // Hero Image
    const postHeroImg = document.getElementById('postHeroImg');
    if (postHeroImg) {
      postHeroImg.src = currentArticle.image;
      postHeroImg.alt = currentArticle.imageAlt || currentArticle.title;
    }

    const postHeroCaption = document.getElementById('postHeroCaption');
    if (postHeroCaption) {
      postHeroCaption.textContent = currentArticle.imageAlt
        ? `Photography & Art Direction: ${currentArticle.imageAlt}`
        : 'Editorial visual curation via VISTORA Archive';
    }

    // 3. Render Content Blocks
    const postBody = document.getElementById('postBody');
    if (postBody && Array.isArray(currentArticle.content)) {
      postBody.innerHTML = '';
      currentArticle.content.forEach((block) => {
        const blockEl = createContentBlockElement(block);
        if (blockEl) {
          postBody.appendChild(blockEl);
        }
      });
    }

    // 4. Render Article Tags
    const postTagsList = document.getElementById('postTagsList');
    if (postTagsList && Array.isArray(currentArticle.tags)) {
      postTagsList.innerHTML = '';
      currentArticle.tags.forEach((tag) => {
        const tagLink = document.createElement('a');
        tagLink.className = 'tag-chip';
        tagLink.href = `blog.html?tag=${encodeURIComponent(tag)}`;
        tagLink.textContent = `#${tag}`;
        postTagsList.appendChild(tagLink);
      });
    }

    // 5. Render Author Bio Card
    const authorBioAvatar = document.getElementById('authorBioAvatar');
    if (authorBioAvatar) {
      authorBioAvatar.textContent = currentArticle.authorInitials || 'VA';
      authorBioAvatar.className = `author-bio-avatar ${currentArticle.authorAvatarClass || 'avatar-teal'}`;
    }

    const authorBioName = document.getElementById('authorBioName');
    if (authorBioName) authorBioName.textContent = currentArticle.author;

    const authorBioRole = document.getElementById('authorBioRole');
    if (authorBioRole) authorBioRole.textContent = currentArticle.authorRole;

    const authorBioDescription = document.getElementById('authorBioDescription');
    if (authorBioDescription) {
      authorBioDescription.textContent = getAuthorBioText(currentArticle.author);
    }

    // 6. Reader enhancements
    setupPostActions(currentArticle);
    setupTableOfContents();
    setupReactions(currentArticle);
    setupComments(currentArticle);
    setupTextToSpeech();
    setupReadingMode();
    setupImageLightbox();
    setupShareButtons(currentArticle);

    // 7. Render Related Stories
    renderRelatedStories(currentArticle, articles);

    // 8. Add to Reading History
    if (window.VistoraStorage && typeof window.VistoraStorage.addToReadingHistory === 'function') {
      window.VistoraStorage.addToReadingHistory(currentArticle.slug);
    }

    // 9. Reading Progress Bar Initialization and resume support
    setupReadingProgressBar(currentArticle);

    // Show Content, Hide Loader
    if (articleLoader) articleLoader.style.display = 'none';
    if (postContent) postContent.style.display = 'block';
  }

  /**
   * Generates DOM Element for a specific content block
   */
  function createContentBlockElement(block) {
    if (!block || !block.type) return null;

    switch (block.type) {
      case 'paragraph': {
        const p = document.createElement('p');
        p.className = 'post-paragraph';
        p.textContent = block.text;
        return p;
      }

      case 'heading': {
        const level = block.level || 2;
        const h = document.createElement(`h${level}`);
        h.className = 'post-subheading';
        h.textContent = block.text;
        return h;
      }

      case 'quote': {
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'post-quote';

        const quoteText = document.createElement('p');
        quoteText.textContent = `“${block.text}”`;
        blockquote.appendChild(quoteText);

        if (block.cite) {
          const cite = document.createElement('cite');
          cite.textContent = `— ${block.cite}`;
          blockquote.appendChild(cite);
        }
        return blockquote;
      }

      case 'callout': {
        const callout = document.createElement('div');
        callout.className = 'post-callout';
        const p = document.createElement('p');
        p.textContent = block.text;
        callout.appendChild(p);
        return callout;
      }

      case 'image': {
        const figure = document.createElement('figure');
        figure.className = 'post-inline-figure';

        const img = document.createElement('img');
        img.src = block.url;
        img.alt = block.caption || 'Editorial visual illustration';
        img.loading = 'lazy';
        img.className = 'zoomable-image';
        figure.appendChild(img);

        if (block.caption) {
          const figcaption = document.createElement('figcaption');
          figcaption.textContent = block.caption;
          figure.appendChild(figcaption);
        }
        return figure;
      }

      default:
        return null;
    }
  }

  /**
   * Sets up bookmark button state & click event.
   */
  function setupPostActions(article) {
    const bookmarkBtn = document.getElementById('postBookmarkBtn');
    const bookmarkLabel = document.getElementById('postBookmarkLabel');
    if (!window.VistoraStorage || !bookmarkBtn) return;

    const updateBookmark = (isBookmarked) => {
      bookmarkBtn.setAttribute('aria-pressed', String(isBookmarked));
      bookmarkBtn.classList.toggle('active', isBookmarked);
      if (bookmarkLabel) bookmarkLabel.textContent = isBookmarked ? 'Saved' : 'Bookmark';
    };

    updateBookmark(window.VistoraStorage.isPostBookmarked(article.id));
    bookmarkBtn.addEventListener('click', () => {
      const isBookmarked = window.VistoraStorage.toggleBookmark(article.id);
      updateBookmark(isBookmarked);
      if (window.showToast) {
        window.showToast(isBookmarked ? 'Story saved to bookmarks.' : 'Story removed from bookmarks.', isBookmarked ? 'success' : 'info');
      }
    });
  }

  /**
   * Configures direct network share links and clipboard copy.
   */
  function setupShareButtons(article) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${article.title} — ${article.excerpt}`);
    const openShareWindow = (shareUrl) => window.open(shareUrl, '_blank', 'noopener,noreferrer,width=640,height=520');

    const twitter = document.getElementById('shareTwitterBtn');
    const linkedIn = document.getElementById('shareLinkedInBtn');
    const whatsApp = document.getElementById('shareWhatsAppBtn');
    const copy = document.getElementById('postShareBtn');

    if (twitter) twitter.addEventListener('click', () => openShareWindow(`https://twitter.com/intent/tweet?text=${text}&url=${url}`));
    if (linkedIn) linkedIn.addEventListener('click', () => openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`));
    if (whatsApp) whatsApp.addEventListener('click', () => openShareWindow(`https://api.whatsapp.com/send?text=${text}%20${url}`));
    if (copy) copy.addEventListener('click', () => copyToClipboardFallback(window.location.href));
  }

  /**
   * Builds a reliable heading outline and highlights the current section.
   */
  function setupTableOfContents() {
    const postBody = document.getElementById('postBody');
    const tocNav = document.getElementById('postTocNav');
    if (!postBody || !tocNav) return;

    const headings = Array.from(postBody.querySelectorAll('h2, h3'));
    const slugify = (text, index) => `section-${index + 1}-${text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

    if (!headings.length) {
      document.getElementById('postTocSidebar').style.display = 'none';
      return;
    }

    tocNav.innerHTML = '';
    headings.forEach((heading, index) => {
      const id = slugify(heading.textContent, index);
      heading.id = id;
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.className = `toc-link toc-level-${heading.tagName.substring(1)}`;
      link.textContent = heading.textContent;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
      });
      tocNav.appendChild(link);
    });

    const tocLinks = Array.from(tocNav.querySelectorAll('.toc-link'));
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      tocLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${current.target.id}`));
      headings.forEach(heading => heading.classList.toggle('is-being-read', heading === current.target));
    }, { rootMargin: '-18% 0px -65% 0px', threshold: [0.1, 0.5] });
    headings.forEach(heading => observer.observe(heading));
  }

  /**
   * Local-first reaction manager with optional authenticated API synchronization.
   */
  function setupReactions(article) {
    const reactionBar = document.getElementById('postReactionsBar');
    if (!reactionBar || !window.VistoraStorage) return;

    const render = (state) => {
      reactionBar.querySelectorAll('[data-reaction]').forEach((button) => {
        const kind = button.dataset.reaction;
        const active = state.mine.includes(kind);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        const count = button.querySelector('.reaction-count');
        if (count) count.textContent = state.counts[kind] || 0;
      });
    };

    render(window.VistoraStorage.getReactions(article.slug));
    reactionBar.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-reaction]');
      if (!button) return;
      const kind = button.dataset.reaction;
      let state = window.VistoraStorage.toggleReaction(article.slug, kind);
      render(state);

      const token = window.VistoraStorage.getToken && window.VistoraStorage.getToken();
      if (token && window.location.protocol.startsWith('http')) {
        try {
          const response = await fetch(`/api/comments/${encodeURIComponent(article.slug)}/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ kind })
          });
          if (response.ok) {
            const payload = await response.json();
            state = { counts: payload.counts, mine: payload.mine };
            render(state);
          }
        } catch (e) {
          // Local persistence preserves functionality when the API is unavailable.
        }
      }
    });
  }

  /**
   * Render and submit comments; server persistence is used when authenticated.
   */
  function setupComments(article) {
    const commentsList = document.getElementById('commentsList');
    const form = document.getElementById('commentForm');
    const nameInput = document.getElementById('commentAuthorName');
    const bodyInput = document.getElementById('commentBodyInput');
    const charCount = document.getElementById('commentCharCount');
    const countBadge = document.getElementById('commentsCountBadge');
    const avatar = document.getElementById('commentUserAvatar');
    if (!commentsList || !form || !window.VistoraStorage) return;

    const user = window.VistoraStorage.getUser && window.VistoraStorage.getUser();
    if (user && nameInput) {
      nameInput.value = user.name || '';
      nameInput.closest('#commentNameRow').style.display = 'none';
      avatar.textContent = getInitials(user.name || 'Reader');
    }

    let replyingTo = null;
    const escape = (value) => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
    const render = (comments) => {
      commentsList.innerHTML = '';
      if (countBadge) countBadge.textContent = comments.length;
      if (!comments.length) {
        commentsList.innerHTML = '<p class="comment-empty-state">Be the first reader to share a considered response.</p>';
        return;
      }
      comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).forEach(comment => {
        const element = document.createElement('article');
        element.className = `comment-item${comment.parentId ? ' is-reply' : ''}`;
        element.dataset.commentId = comment.id;
        const date = new Date(comment.createdAt);
        element.innerHTML = `
          <div class="comment-avatar ${escape(comment.avatarClass || '')}">${escape(getInitials(comment.name))}</div>
          <div class="comment-content">
            <div class="comment-meta"><strong class="comment-author">${escape(comment.name)}</strong><time class="comment-date" datetime="${escape(comment.createdAt)}">${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div>
            <p class="comment-body">${escape(comment.body)}</p>
            ${comment.parentId ? '' : '<button type="button" class="comment-reply-btn">Reply</button>'}
          </div>`;
        commentsList.appendChild(element);
      });
    };

    const localComments = () => window.VistoraStorage.getComments(article.slug);
    render(localComments());

    if (bodyInput && charCount) {
      bodyInput.addEventListener('input', () => { charCount.textContent = `${1200 - bodyInput.value.length} characters remaining`; });
    }

    commentsList.addEventListener('click', (event) => {
      const replyButton = event.target.closest('.comment-reply-btn');
      if (!replyButton) return;
      const item = replyButton.closest('.comment-item');
      replyingTo = Number(item.dataset.commentId);
      const name = item.querySelector('.comment-author').textContent;
      bodyInput.placeholder = `Reply to ${name}...`;
      bodyInput.focus();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = bodyInput.value.trim();
      const name = user ? user.name : nameInput.value.trim();
      if (body.length < 2 || name.length < 2) {
        if (window.showToast) window.showToast('Please enter your name and a comment of at least two characters.', 'error');
        return;
      }
      const commentInput = { name, body, parentId: replyingTo };
      let comment = window.VistoraStorage.addComment(article.slug, commentInput);
      render(localComments());
      bodyInput.value = '';
      if (charCount) charCount.textContent = '1200 characters remaining';
      replyingTo = null;
      bodyInput.placeholder = 'Share your perspective on this essay...';
      if (window.showToast) window.showToast('Your reflection has been published locally.', 'success');

      const token = window.VistoraStorage.getToken && window.VistoraStorage.getToken();
      if (token && window.location.protocol.startsWith('http')) {
        try {
          const response = await fetch(`/api/comments/${encodeURIComponent(article.slug)}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ body, parentId: replyingTo })
          });
          if (response.ok) comment = (await response.json()).comment;
        } catch (e) {}
      }
    });
  }

  function getInitials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || '?';
  }

  /**
   * Configures Text-to-Speech controls using the native Web Speech API.
   */
  function setupTextToSpeech() {
    const playButton = document.getElementById('ttsPlayBtn');
    const stopButton = document.getElementById('ttsStopBtn');
    const controls = document.getElementById('ttsControls');
    const label = document.getElementById('ttsBtnText');
    const speed = document.getElementById('ttsSpeedSelect');
    const body = document.getElementById('postBody');
    if (!playButton || !body || !('speechSynthesis' in window)) {
      if (playButton) playButton.style.display = 'none';
      return;
    }

    let utterance;
    let playing = false;
    const stop = () => {
      window.speechSynthesis.cancel();
      playing = false;
      playButton.classList.remove('is-active');
      label.textContent = 'Listen to Essay';
      controls.style.display = 'none';
    };

    playButton.addEventListener('click', () => {
      if (playing && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        label.textContent = 'Pause Audio';
        return;
      }
      if (playing) {
        window.speechSynthesis.pause();
        label.textContent = 'Resume Audio';
        return;
      }
      utterance = new SpeechSynthesisUtterance(body.innerText);
      utterance.rate = Number(speed.value) || 1;
      utterance.onend = stop;
      utterance.onerror = stop;
      playing = true;
      playButton.classList.add('is-active');
      label.textContent = 'Pause Audio';
      controls.style.display = 'flex';
      window.speechSynthesis.speak(utterance);
    });
    speed.addEventListener('change', () => { if (playing) { stop(); playButton.click(); } });
    stopButton.addEventListener('click', stop);
    window.addEventListener('beforeunload', stop);
  }

  /**
   * Adds focus-mode and article font-size controls.
   */
  function setupReadingMode() {
    const focusButton = document.getElementById('focusModeBtn');
    const decreaseButton = document.getElementById('fontDecBtn');
    const increaseButton = document.getElementById('fontIncBtn');
    const body = document.getElementById('postBody');
    let size = 1;
    if (focusButton) {
      focusButton.addEventListener('click', () => {
        const focused = document.body.classList.toggle('focus-reading');
        focusButton.classList.toggle('is-active', focused);
        focusButton.querySelector('.focus-btn-label').textContent = focused ? 'Exit Focus' : 'Focus Mode';
      });
    }
    const setFontSize = () => { if (body) body.style.fontSize = `${size}rem`; };
    if (decreaseButton) decreaseButton.addEventListener('click', () => { size = Math.max(0.9, size - 0.0625); setFontSize(); });
    if (increaseButton) increaseButton.addEventListener('click', () => { size = Math.min(1.35, size + 0.0625); setFontSize(); });
  }

  /**
   * Full-screen image viewer for the hero and inline article images.
   */
  function setupImageLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const closeButton = document.getElementById('lightboxCloseBtn');
    if (!lightbox || !image || !closeButton) return;

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    document.querySelectorAll('.zoomable-image').forEach(source => source.addEventListener('click', () => {
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      const figure = source.closest('figure');
      caption.textContent = figure && figure.querySelector('figcaption') ? figure.querySelector('figcaption').textContent : source.alt;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }));
    closeButton.addEventListener('click', close);
    lightbox.addEventListener('click', event => { if (event.target === lightbox) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close(); });
  }

  function copyToClipboardFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          if (window.showToast) {
            window.showToast('Article URL copied to clipboard!', 'success');
          }
        })
        .catch(() => {
          prompt('Copy article link below:', text);
        });
    } else {
      prompt('Copy article link below:', text);
    }
  }

  /**
   * Finds and renders up to 3 related stories
   */
  function renderRelatedStories(currentArticle, allArticles) {
    const relatedGrid = document.getElementById('relatedStoriesGrid');
    if (!relatedGrid) return;

    const otherArticles = allArticles.filter((a) => a.id !== currentArticle.id);

    // Rank by matching category or common tags
    const scoredArticles = otherArticles.map((art) => {
      let score = 0;
      if (art.category === currentArticle.category) score += 3;
      if (Array.isArray(art.tags) && Array.isArray(currentArticle.tags)) {
        const sharedTags = art.tags.filter((t) => currentArticle.tags.includes(t));
        score += sharedTags.length * 2;
      }
      return { article: art, score };
    });

    scoredArticles.sort((a, b) => b.score - a.score);
    const relatedSelection = scoredArticles.slice(0, 3).map((item) => item.article);

    relatedGrid.innerHTML = '';
    relatedSelection.forEach((article) => {
      const isLiked = window.VistoraStorage ? window.VistoraStorage.isPostLiked(article.id) : false;
      const isBookmarked = window.VistoraStorage ? window.VistoraStorage.isPostBookmarked(article.id) : false;

      const card = document.createElement('article');
      card.className = 'story-card reveal';
      card.innerHTML = `
        <a href="post.html?slug=${encodeURIComponent(article.slug)}" class="story-card-media" tabindex="-1" aria-hidden="true">
          <img src="${article.image}" alt="${article.imageAlt || article.title}" class="story-card-img" loading="lazy">
          <span class="badge category-badge">${article.category}</span>
        </a>
        <div class="story-card-body">
          <div class="story-card-meta">
            <time datetime="${article.date}">${article.formattedDate || article.date}</time>
            <span class="meta-dot">&bull;</span>
            <span>${article.readingTime || 5} min read</span>
          </div>
          <h3 class="story-card-title">
            <a href="post.html?slug=${encodeURIComponent(article.slug)}">${article.title}</a>
          </h3>
          <p class="story-card-excerpt">${article.excerpt}</p>
          <div class="story-card-footer">
            <div class="story-card-author">
              <div class="author-avatar ${article.authorAvatarClass || 'avatar-teal'}">${article.authorInitials || 'VA'}</div>
              <span class="author-name">${article.author}</span>
            </div>
            <div class="card-actions">
              <button type="button" class="card-action-btn like-btn ${isLiked ? 'active' : ''}" data-action="like" data-id="${article.id}" data-title="${article.title}" aria-label="Like story" aria-pressed="${isLiked}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <button type="button" class="card-action-btn bookmark-btn ${isBookmarked ? 'active' : ''}" data-action="bookmark" data-id="${article.id}" data-title="${article.title}" aria-label="Bookmark story" aria-pressed="${isBookmarked}">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      relatedGrid.appendChild(card);
    });

    // Re-trigger scroll reveal observer if defined
    if (window.initScrollReveal) {
      window.initScrollReveal();
    }
  }

  /**
   * Sticky Reading Progress Bar Calculation
   */
  function setupReadingProgressBar(article) {
    const progressBar = document.getElementById('readingProgressBar');
    if (!progressBar) return;

    // Restore scroll position
    const saved = window.VistoraStorage && window.VistoraStorage.getProgress ? window.VistoraStorage.getProgress(article.slug) : null;
    if (saved && saved.scrollY > 0) {
      setTimeout(() => {
        window.scrollTo({ top: saved.scrollY, behavior: 'instant' });
      }, 50); // slight delay allowing images/fonts to render
    }

    let ticking = false;

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateProgress();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    function updateProgress() {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      const percent = Math.min(Math.max((scrollPosition / docHeight) * 100, 0), 100);
      progressBar.style.width = `${percent}%`;

      if (window.VistoraStorage && typeof window.VistoraStorage.setProgress === 'function') {
        window.VistoraStorage.setProgress(article.slug, percent, scrollPosition);
      }
    }
  }

  /**
   * Helper: Biographical summaries for authors
   */
  function getAuthorBioText(name) {
    switch (name) {
      case 'Maya Patel':
        return 'Senior Technology Editor & Essayist at VISTORA. Writing at the confluence of AI systems, digital mindfulness, user interfaces, and human agency.';
      case 'Arjun Mehta':
        return 'Contributing Lifestyle & Travel Columnist. Focusing on slow routines, intentional solitude, sustainable wanderlust, and urban wellbeing.';
      case 'Elina Shah':
        return 'Design Critic & Visual Anthropologist. Exploring timeless typographic traditions, editorial print aesthetics, and mindful analog photography.';
      case 'Rhea Kapoor':
        return 'Business Strategy Lead & Essayist. Investigating modular workflows, calm organizational design, asynchronous craft, and sustainable leverage.';
      default:
        return 'Editorial Contributor at VISTORA. Curating thoughtful essays and reflections for modern contemplative minds.';
    }
  }
})();
