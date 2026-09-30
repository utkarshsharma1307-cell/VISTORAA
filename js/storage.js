/**
 * VISTORA — Storage & Persistence Layer
 * Handles localStorage operations safely with error tolerance for private browsing.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'vistora_theme',
    LIKED_POSTS: 'vistora_liked_posts',
    BOOKMARKED_POSTS: 'vistora_bookmarked_posts',
    SUBSCRIBED_EMAILS: 'vistora_subscribed_emails',
    READING_HISTORY: 'vistora_reading_history',
    AUTH_TOKEN: 'vistora_auth_token',
    AUTH_USER: 'vistora_auth_user',
    REACTIONS: 'vistora_reactions',
    COMMENTS: 'vistora_comments',
    READING_PROGRESS: 'vistora_reading_progress',
    READING_STATS: 'vistora_reading_stats',
    CUSTOM_POSTS: 'vistora_custom_posts'
  };

  // In-memory fallback if localStorage is disabled or restricted
  const memoryFallback = {};

  const safeStorage = {
    get: function (key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        // Fallback for restricted context
      }
      return memoryFallback[key] || null;
    },

    set: function (key, value) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return true;
        }
      } catch (e) {
        // Fallback for quota exceeded / private mode
      }
      memoryFallback[key] = String(value);
      return true;
    },

    remove: function (key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return true;
        }
      } catch (e) {
        // Fallback
      }
      delete memoryFallback[key];
      return true;
    },

    getJSON: function (key, defaultValue) {
      const raw = safeStorage.get(key);
      if (!raw) return defaultValue;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return defaultValue;
      }
    },

    setJSON: function (key, value) {
      try {
        const serialized = JSON.stringify(value);
        return safeStorage.set(key, serialized);
      } catch (e) {
        return false;
      }
    }
  };

  const VistoraStorage = {
    KEYS: STORAGE_KEYS,

    /**
     * Get saved theme or detect system preference
     * @returns {'light' | 'dark'}
     */
    getTheme: function () {
      const savedTheme = safeStorage.get(STORAGE_KEYS.THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }

      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }

      return 'light';
    },

    /**
     * Save theme preference
     * @param {'light' | 'dark'} theme
     */
    setTheme: function (theme) {
      const validTheme = theme === 'dark' ? 'dark' : 'light';
      safeStorage.set(STORAGE_KEYS.THEME, validTheme);
      return validTheme;
    },

    /**
     * Get array of liked post IDs/slugs
     * @returns {Array<number|string>}
     */
    getLikedPosts: function () {
      return safeStorage.getJSON(STORAGE_KEYS.LIKED_POSTS, []);
    },

    /**
     * Toggle like state for a post
     * @param {number|string} postId
     * @returns {boolean} isLiked
     */
    toggleLike: function (postId) {
      const likes = VistoraStorage.getLikedPosts();
      const stringId = String(postId);
      const index = likes.findIndex(id => String(id) === stringId);

      let isLiked = false;
      if (index > -1) {
        likes.splice(index, 1);
        isLiked = false;
      } else {
        likes.push(isNaN(postId) ? postId : Number(postId));
        isLiked = true;
      }

      safeStorage.setJSON(STORAGE_KEYS.LIKED_POSTS, likes);
      return isLiked;
    },

    /**
     * Check if a post is liked
     * @param {number|string} postId
     * @returns {boolean}
     */
    isPostLiked: function (postId) {
      const likes = VistoraStorage.getLikedPosts();
      const stringId = String(postId);
      return likes.some(id => String(id) === stringId);
    },

    /**
     * Get array of bookmarked post IDs/slugs
     * @returns {Array<number|string>}
     */
    getBookmarkedPosts: function () {
      return safeStorage.getJSON(STORAGE_KEYS.BOOKMARKED_POSTS, []);
    },

    /**
     * Toggle bookmark state for a post
     * @param {number|string} postId
     * @returns {boolean} isBookmarked
     */
    toggleBookmark: function (postId) {
      const bookmarks = VistoraStorage.getBookmarkedPosts();
      const stringId = String(postId);
      const index = bookmarks.findIndex(id => String(id) === stringId);

      let isBookmarked = false;
      if (index > -1) {
        bookmarks.splice(index, 1);
        isBookmarked = false;
      } else {
        bookmarks.push(isNaN(postId) ? postId : Number(postId));
        isBookmarked = true;
      }

      safeStorage.setJSON(STORAGE_KEYS.BOOKMARKED_POSTS, bookmarks);
      return isBookmarked;
    },

    /**
     * Check if a post is bookmarked
     * @param {number|string} postId
     * @returns {boolean}
     */
    isPostBookmarked: function (postId) {
      const bookmarks = VistoraStorage.getBookmarkedPosts();
      const stringId = String(postId);
      return bookmarks.some(id => String(id) === stringId);
    },

    /**
     * Subscribe an email address to local newsletter list
     * @param {string} email
     * @returns {{ success: boolean, alreadySubscribed: boolean }}
     */
    subscribeEmail: function (email) {
      if (!email || typeof email !== 'string') {
        return { success: false, alreadySubscribed: false };
      }

      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, alreadySubscribed: false };
      }

      const subscribers = safeStorage.getJSON(STORAGE_KEYS.SUBSCRIBED_EMAILS, []);
      if (subscribers.includes(cleanEmail)) {
        return { success: true, alreadySubscribed: true };
      }

      subscribers.push(cleanEmail);
      safeStorage.setJSON(STORAGE_KEYS.SUBSCRIBED_EMAILS, subscribers);
      return { success: true, alreadySubscribed: false };
    },

    /**
     * Record recently read article in history (keeps last 10)
     * @param {string} postSlug
     */
    addToReadingHistory: function (postSlug) {
      if (!postSlug) return;
      const history = safeStorage.getJSON(STORAGE_KEYS.READING_HISTORY, []);
      const filtered = history.filter(item => item.slug !== postSlug);
      filtered.unshift({
        slug: postSlug,
        timestamp: Date.now()
      });

      // Keep max 10 records
      const trimmed = filtered.slice(0, 10);
      safeStorage.setJSON(STORAGE_KEYS.READING_HISTORY, trimmed);
    },

    /**
     * Get reading history array
     * @returns {Array<{slug: string, timestamp: number}>}
     */
    getReadingHistory: function () {
      return safeStorage.getJSON(STORAGE_KEYS.READING_HISTORY, []);
    },

    /**
     * User Authentication & Session
     */
    getUser: function () {
      return safeStorage.getJSON(STORAGE_KEYS.AUTH_USER, null);
    },

    setUser: function (user) {
      if (!user) {
        safeStorage.remove(STORAGE_KEYS.AUTH_USER);
        safeStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
        return null;
      }
      safeStorage.setJSON(STORAGE_KEYS.AUTH_USER, user);
      return user;
    },

    getToken: function () {
      return safeStorage.get(STORAGE_KEYS.AUTH_TOKEN);
    },

    setToken: function (token) {
      if (!token) {
        safeStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
      } else {
        safeStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
      }
      return token;
    },

    logout: function () {
      safeStorage.remove(STORAGE_KEYS.AUTH_USER);
      safeStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
    },

    /**
     * Reactions Management (❤️ 🔥 👏 💡 🤔)
     */
    getReactions: function (slug) {
      const all = safeStorage.getJSON(STORAGE_KEYS.REACTIONS, {});
      const fallbackCounts = { insightful: 12, beautiful: 24, thoughtful: 8, fire: 18, clap: 15 };
      return all[slug] || {
        counts: fallbackCounts,
        mine: []
      };
    },

    toggleReaction: function (slug, kind) {
      const all = safeStorage.getJSON(STORAGE_KEYS.REACTIONS, {});
      const fallbackCounts = { insightful: 12, beautiful: 24, thoughtful: 8, fire: 18, clap: 15 };
      if (!all[slug]) {
        all[slug] = { counts: Object.assign({}, fallbackCounts), mine: [] };
      }
      const data = all[slug];
      const index = data.mine.indexOf(kind);
      if (index > -1) {
        data.mine.splice(index, 1);
        data.counts[kind] = Math.max(0, (data.counts[kind] || 1) - 1);
      } else {
        data.mine.push(kind);
        data.counts[kind] = (data.counts[kind] || 0) + 1;
      }
      safeStorage.setJSON(STORAGE_KEYS.REACTIONS, all);
      return data;
    },

    /**
     * Comments Management
     */
    getComments: function (slug) {
      const all = safeStorage.getJSON(STORAGE_KEYS.COMMENTS, {});
      return all[slug] || [];
    },

    addComment: function (slug, commentData) {
      const all = safeStorage.getJSON(STORAGE_KEYS.COMMENTS, {});
      if (!all[slug]) all[slug] = [];
      const newComment = {
        id: Date.now(),
        slug: slug,
        parentId: commentData.parentId || null,
        name: commentData.name || 'Anonymous Reader',
        role: commentData.role || 'Reader',
        avatarClass: commentData.avatarClass || 'avatar-terracotta',
        body: commentData.body || '',
        createdAt: new Date().toISOString()
      };
      all[slug].push(newComment);
      safeStorage.setJSON(STORAGE_KEYS.COMMENTS, all);
      return newComment;
    },

    /**
     * Reading Progress & Position
     */
    getProgress: function (slug) {
      const all = safeStorage.getJSON(STORAGE_KEYS.READING_PROGRESS, {});
      return all[slug] || { percent: 0, scrollY: 0, updatedAt: 0 };
    },

    setProgress: function (slug, percent, scrollY) {
      if (!slug) return;
      const all = safeStorage.getJSON(STORAGE_KEYS.READING_PROGRESS, {});
      all[slug] = {
        percent: Math.min(100, Math.max(0, Math.round(percent))),
        scrollY: Math.round(scrollY || 0),
        updatedAt: Date.now()
      };
      safeStorage.setJSON(STORAGE_KEYS.READING_PROGRESS, all);
    },

    getAllProgress: function () {
      return safeStorage.getJSON(STORAGE_KEYS.READING_PROGRESS, {});
    },

    /**
     * Reading Analytics Stats
     */
    getReadingStats: function () {
      const stats = safeStorage.getJSON(STORAGE_KEYS.READING_STATS, {
        totalMinutesRead: 0,
        articlesCompleted: 0,
        categoryCounts: {}
      });
      return stats;
    },

    recordReadingSession: function (category, minutes) {
      const stats = VistoraStorage.getReadingStats();
      stats.totalMinutesRead = (stats.totalMinutesRead || 0) + (minutes || 1);
      stats.articlesCompleted = (stats.articlesCompleted || 0) + 1;
      if (category) {
        stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
      }
      safeStorage.setJSON(STORAGE_KEYS.READING_STATS, stats);
      return stats;
    },

    /**
     * Custom / CMS Articles (Local persistence)
     */
    getCustomPosts: function () {
      return safeStorage.getJSON(STORAGE_KEYS.CUSTOM_POSTS, []);
    },

    saveCustomPost: function (post) {
      const posts = VistoraStorage.getCustomPosts();
      const index = posts.findIndex(p => p.id === post.id || p.slug === post.slug);
      if (index > -1) {
        posts[index] = post;
      } else {
        posts.unshift(post);
      }
      safeStorage.setJSON(STORAGE_KEYS.CUSTOM_POSTS, posts);
      return post;
    },

    deleteCustomPost: function (idOrSlug) {
      let posts = VistoraStorage.getCustomPosts();
      posts = posts.filter(p => p.id !== idOrSlug && p.slug !== idOrSlug);
      safeStorage.setJSON(STORAGE_KEYS.CUSTOM_POSTS, posts);
      return posts;
    }
  };

  // Expose to window
  window.VistoraStorage = VistoraStorage;
})();
