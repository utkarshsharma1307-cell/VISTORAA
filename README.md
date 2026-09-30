# VISTORA — Editorial Blogging Website

> *“Thoughtful stories for modern minds.”*

VISTORA is an independent, premium editorial publication and blogging platform designed and built for a college project. It delivers an image-focused, distraction-free reading experience covering human-centered technology, intentional living, design principles, slow travel, and creative systems.

---

## 🌟 Key Features

- **Editorial Design System**: High-contrast typography featuring *Playfair Display* and *Plus Jakarta Sans*, spacious whitespace, and refined visual hierarchy inspired by luxury magazine editorial layouts.
- **Dynamic Content Engine**: 12 complete, original long-form articles loaded and formatted purely via Vanilla JavaScript.
- **Full Discovery & Search**:
  - Instant real-time search across titles, excerpts, categories, tags, and authors.
  - Category filters (*Technology*, *Lifestyle*, *Travel*, *Business*, *Personal*, *Inspiration*).
  - Dynamic tag cloud generated from content data.
  - Multi-criteria sorting (Newest, Oldest, Alphabetical A–Z, Shortest Read, Longest Read).
- **Persistent Engagement (Local-First)**:
  - **Dark / Light Theme Toggle**: Seamless CSS custom property switching persisted in `localStorage`.
  - **Like System**: One-click liking with state persistence and interactive toast notifications.
  - **Reading Bookmarks**: Bookmark articles to save for later reading.
  - **Newsletter Subscription**: Frontend validation, duplicate prevention, and persistent subscription status.
  - **Reading History**: Tracks recently read essays locally.
- **Native Sharing**: Web Share API integration with automatic fallback to clipboard copy.
- **Interactive Reading Progress**: Elegant top-mounted progress bar indicating reading depth on article pages.
- **Smooth Animation & Micro-interactions**:
  - IntersectionObserver-powered scroll reveals.
  - Smooth card hover lifts with gentle image scaling.
  - Animated sticky navigation with background blur upon scroll.
  - Full support for `@media (prefers-reduced-motion: reduce)`.
- **Zero-Dependency Architecture**: Runs 100% locally out-of-the-box in any modern browser without build steps, servers, or external node modules.

---

## 🛠️ Technologies Used

| Layer | Technology |
|---|---|
| **Structure** | Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`) |
| **Styling** | Modern CSS3 (Flexbox, CSS Grid, Custom Properties/Variables, Transitions, Keyframe Animations) |
| **Scripting** | Vanilla JavaScript (ES6+, DOM Manipulation, Event Delegation, IntersectionObserver, Web Share API, Clipboard API) |
| **Persistence** | Browser `localStorage` (theme, likes, bookmarks, reading history, newsletter state) |
| **Dependencies** | **None** — Zero frameworks, zero build tools, zero npm packages |

---

## 📁 Project Structure

```text
vistora/
├── index.html          # Homepage with Hero, Editor's Highlights, Categories & Latest Stories
├── blog.html           # Journal archive with real-time search, filters, sorting & pagination
├── post.html           # Dedicated article reading view with progress bar & related stories
├── about.html          # About VISTORA, mission manifesto, content pillars & editorial team
├── 404.html            # Custom styled 404 error page with quick navigation links
├── README.md           # Project documentation and submission guide
├── .gitignore          # Git ignore specifications
│
├── css/
│   ├── style.css       # Core design system, variables, components & global layout
│   ├── post.css        # Article-specific typography, progress bar, action bar & bio box
│   └── responsive.css  # Mobile, tablet, desktop breakpoints & reduced-motion queries
│
└── js/
    ├── data.js         # 12 original curated articles, categories, and reading-time utility
    ├── storage.js      # Robust localStorage persistence manager with error handling
    ├── main.js         # Shared navigation, theme switcher, scroll reveal & toast system
    ├── blog.js         # Archive page search, category/tag filtering, sorting & pagination
    └── post.js         # Dynamic article renderer, progress bar, like/bookmark/share logic
```

---

## 🚀 How to Run Locally

Because VISTORA is built using vanilla web standards, no server or build process is required:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/vistora.git
   ```
2. Navigate to the project directory:
   ```bash
   cd vistora
   ```
3. Open `index.html` directly in any web browser:
   - On Windows: Double-click `index.html` or run `start index.html` in PowerShell.
   - On macOS: Run `open index.html` in Terminal.
   - On Linux: Run `xdg-open index.html`.

Alternatively, you can use VS Code's **Live Server** extension if preferred.

---

## 🌐 Deploying to GitHub Pages

1. Create a new repository on GitHub (e.g. `vistora-blog` or `vistora`).
2. Initialize git and push the files:
   ```bash
   git init
   git add .
   git commit -m "Initial release of VISTORA editorial blog"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. Open your repository on GitHub and click **Settings**.
4. In the left navigation menu, click **Pages**.
5. Under **Branch**, select `main` and set the folder to `/ (root)`.
6. Click **Save**.
7. Your site will be live within 1–2 minutes at:
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 📸 Screenshots Overview

- **Homepage**: Full-screen editorial hero, curated editor's picks, theme-based category navigation, and latest stories.
- **Journal Archive (`blog.html`)**: Real-time multi-facet filtering with search bar, category chips, tag pills, sorting, and pagination.
- **Article Page (`post.html`)**: Rich typography, reading progress bar, pull quotes, inline images, social sharing, like/bookmark buttons, author bio, and related stories.
- **Dark Mode**: High-contrast, easy-on-the-eyes dark color palette activated with a single click.
- **Mobile Responsive View**: Fluid drawer navigation, stacked editorial cards, touch-optimized button hit targets.

---

## 🔮 Future Enhancements

- **Spring Boot Backend**: REST API with Spring Security (JWT authentication) and MongoDB persistence.
- **Author Dashboard**: Rich text WYSIWYG editor for publishing new articles without code changes.
- **Interactive Comments**: Reader discussion threads with moderation.
- **Analytics & Reading Insights**: Server-side metrics on reading depth and article popularity.

---

## 🎓 Academic Assignment Compliance

- [x] Built using **HTML5**, **CSS3**, and **Vanilla JavaScript**
- [x] Backend is optional — fully functional frontend with `localStorage` persistence
- [x] Ready to upload directly to GitHub and deploy on GitHub Pages
- [x] Zero external framework or build dependencies
- [x] High-quality, original content and clean, explainable architecture for viva presentations
