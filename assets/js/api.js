// ─── Backend base URL ────────────────────────────────────────────────────
// API_BASE is declared in config.js (loaded before this file) — do not
// redeclare it here, that causes a duplicate-declaration error that breaks
// this whole script.

// ─── Constants ───────────────────────────────────────────────────────────
// Fallback strategy: Direct data.json -> LocalStorage Cache -> Backend /portfolio
const CACHE_KEY = 'portfolio_cache_v6';
const CACHE_TTL_MS = 60 * 1000; // 1 minute
const FETCH_TIMEOUT_MS = 20000; // 20s network timeout before fallback

// Clear legacy caches to prevent stale data divergence
try {
  ['portfolio_cache_v1', 'portfolio_cache_v2', 'portfolio_cache_v3', 'portfolio_cache_v4', 'portfolio_cache_v5'].forEach(k => localStorage.removeItem(k));
} catch (e) {}

// ─── Data Normalizer ──────────────────────────────────────────────────────
// Guarantees camelCase & snake_case parity for publications, teaching, projects, certs
function normalizePortfolioData(d) {
  if (!d || typeof d !== 'object') return d;
  d.settings = d.settings || {};
  const s = d.settings;

  // Teaching defaults and fallbacks
  s.teaching = s.teaching || {};
  if (!s.teaching.philosophy) {
    s.teaching.philosophy = s.teaching_philosophy || d.teachingPhilosophy ||
      "I believe effective teaching in AI and Computer Science bridges theory and hands-on practice. My goal is to cultivate critical thinking and research curiosity — helping students not just implement models, but understand why they work, where they fail, and how to push the boundaries of existing knowledge.";
  }
  if (!s.teaching.mentoringText) {
    s.teaching.mentoringText = s.teaching_mentoring_text || d.teachingMentoringText ||
      "I'm happy to help undergraduate and graduate students with research questions, project guidance, or academic writing in AI and Computer Vision.";
  }
  if (!s.teaching.roles || !s.teaching.roles.length) {
    s.teaching.roles = [
      { title: "Graduate Research Mentoring", desc: "Guiding undergraduate peers in dataset curation, deep learning model evaluation, and Explainable AI methods (LIME/SHAP)." },
      { title: "Workshop Facilitator & Peer Mentor", desc: "Conducting technical sessions and hands-on coding tutorials on PyTorch, OpenCV, and practical computer vision pipelines." }
    ];
  }
  if (!s.teaching.areas || !s.teaching.areas.length) {
    s.teaching.areas = [
      { topic: "Computer Vision & Image Processing", desc: "Convolutional Neural Networks, Vision Transformers, transfer learning, and feature visualization." },
      { topic: "Deep Learning & Neural Networks", desc: "PyTorch fundamentals, backpropagation, optimization techniques, and sequence modeling with LSTM." },
      { topic: "Medical Image Computing", desc: "Preprocessing medical modalities, handling class imbalance in biomedical datasets, and diagnostic classification." },
      { topic: "Explainable Artificial Intelligence (XAI)", desc: "Local and global interpretability, feature attribution with LIME, SHAP, and Grad-CAM." }
    ];
  }

  // Publications link parity
  if (Array.isArray(d.publications)) {
    d.publications.forEach(p => {
      const pdf = p.pdfLink || p.pdf_link || '';
      p.pdfLink = pdf;
      p.pdf_link = pdf;
      const doi = p.doiLink || p.doi_link || '';
      p.doiLink = doi;
      p.doi_link = doi;
    });
  }

  // Certifications link parity
  if (Array.isArray(d.certifications)) {
    d.certifications.forEach(c => {
      const pdf = c.pdfLink || c.pdf_link || '';
      c.pdfLink = pdf;
      c.pdf_link = pdf;
      const verify = c.verifyLink || c.verify_link || '';
      c.verifyLink = verify;
      c.verify_link = verify;
    });
  }

  // Projects link parity
  if (Array.isArray(d.projects)) {
    d.projects.forEach(p => {
      const gh = p.githubLink || p.github_link || '';
      p.githubLink = gh;
      p.github_link = gh;
      const paper = p.paperLink || p.paper_link || '';
      p.paperLink = paper;
      p.paper_link = paper;
    });
  }

  return d;
}

// ─── HTML escaping helper ─────────────────────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Rich Text & Safe HTML Formatter ───────────────────────────────────────
// Renders bold, italic, underline, lists, alignment, links, and paragraphs.
// Converts legacy plain-text newlines into paragraphs automatically.
function formatRichText(str, fallback = '') {
  if (str === null || str === undefined) return fallback;
  const raw = String(str).trim();
  if (!raw) return fallback;

  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
  if (!hasHtml) {
    return raw
      .split(/\n\s*\n/)
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  // Strip dangerous elements/attributes while preserving rich formatting tags
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

// ─── Asset path resolver (handles data:, https://, media/ across root & subpages) ───
function resolveAssetUrl(url, isSubpage = false) {
  if (!url) return '';
  const str = String(url).trim();
  if (!str) return '';
  let result = str;
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('//')) {
    result = str;
  } else if (str.startsWith('/api/')) {
    result = API_BASE.replace(/\/api\/?$/, '') + str;
  } else if (str.startsWith('/')) {
    result = str;
  } else if (isSubpage) {
    if (str.startsWith('../')) result = str;
    else {
      result = '../' + str;
    }
  } else {
    result = str.replace(/^\.\.\//, '');
  }
  return result.replace(/ /g, '%20');
}

// ─── Fetch with timeout ──────────────────────────────────────────────────
// Wraps fetch() in an AbortController with a configurable timeout.
// Returns the Response or throws on timeout/network error.
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after ' + timeoutMs + 'ms');
    }
    throw err;
  }
}

// ─── Core fetch helper ───────────────────────────────────────────────────
// Fetches JSON from the backend with timeout. Returns { data, error }.
// On success: { data: <parsed JSON>, error: null }
// On failure: { data: <fallback>, error: <Error> }
async function fetchJSON(path, fallback) {
  try {
    const res = await fetchWithTimeout(API_BASE + path);
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return { data: await res.json(), error: null };
  } catch (err) {
    console.warn('Could not load ' + path + ' from backend:', err.message);
    return { data: fallback, error: err };
  }
}

// ─── Portfolio combined endpoint (stale-while-revalidate) ────────────────
// Fetches all homepage data in one request from /api/portfolio.
// Uses sessionStorage for instant repeat-visit rendering.
function getCachedPortfolio() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || !cached.timestamp) return null;
    return cached;
  } catch (e) {
    return null;
  }
}

function setCachedPortfolio(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: data,
    }));
  } catch (e) {
    // Storage full or unavailable — silently ignore
  }
}

function isCacheFresh(cached) {
  return cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS;
}

// Fetches the combined portfolio endpoint.
// Returns { data: {...}, error: null|Error, fromCache: bool }
async function getPortfolio(isSubpage = false) {
  // Canonical source of truth: assets/data/data.json (always present, versioned with git, 100% identical on localhost and GitHub Pages)
  try {
    const inSub = isSubpage || Boolean(document.querySelector('script[src^="../"]') || document.querySelector('link[href^="../"]'));
    let localRes = await fetch((inSub ? '../assets/data/data.json?v=6' : 'assets/data/data.json?v=6'), { cache: 'no-cache' });
    if (!localRes.ok) {
      localRes = await fetch((inSub ? 'assets/data/data.json?v=6' : '../assets/data/data.json?v=6'), { cache: 'no-cache' });
    }
    if (localRes && localRes.ok) {
      const localData = await localRes.json();
      setCachedPortfolio(localData);
      return { data: normalizePortfolioData(localData), error: null, fromCache: false };
    }
  } catch (e) {
    console.warn('Direct data.json fetch failed, falling back to cache/backend:', e);
  }

  const cached = getCachedPortfolio();
  if (cached && isCacheFresh(cached)) {
    return { data: normalizePortfolioData(cached.data), error: null, fromCache: true };
  }

  // Secondary fallback to remote backend if static asset cannot be read (e.g. file:/// protocol)
  try {
    const res = await fetchWithTimeout(API_BASE + '/portfolio');
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    const fresh = await res.json();
    setCachedPortfolio(fresh);
    return { data: normalizePortfolioData(fresh), error: null, fromCache: false };
  } catch (err) {
    console.warn('Could not load /portfolio from backend:', err.message);
    if (cached) {
      return { data: normalizePortfolioData(cached.data), error: null, fromCache: true };
    }
    return {
      data: normalizePortfolioData({
        settings: {}, education: [], experience: [], publications: [],
        projects: [], certifications: [], awards: [], activities: [],
        gallery: [], references: [],
      }),
      error: err,
      fromCache: false,
    };
  }
}

// ─── Image fallback helper ───────────────────────────────────────────────
// Generates a simple SVG placeholder with initials or a generic icon.
function getInitialsPlaceholder(name) {
  const initials = (name || 'P')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
      <rect width="150" height="150" fill="#0b1e3d"/>
      <text x="75" y="82" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="700" fill="#78A9FF">${initials}</text>
    </svg>`
  )}`;
}

function getGenericPlaceholder() {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
      <rect width="200" height="150" fill="#e8e4dc"/>
      <text x="100" y="80" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#bbb5a8">\u2317</text>
    </svg>`
  )}`;
}

function addImageFallbacks(container, fallbackSrc) {
  if (!container) return;
  const imgs = container.querySelectorAll('img');
  imgs.forEach(img => {
    if (!img.dataset.fallbackSet) {
      img.dataset.fallbackSet = '1';
      img.addEventListener('error', function() {
        if (this.src !== fallbackSrc) {
          this.src = fallbackSrc || getGenericPlaceholder();
        }
      });
      if (!img.src || img.src === window.location.href || img.getAttribute('src') === '') {
        img.src = fallbackSrc || getGenericPlaceholder();
      }
    }
  });
}

// ─── Error state HTML generator ──────────────────────────────────────────
function errorStateHtml(sectionName, retryFnName) {
  return `<div class="section-error">
    <i class="bi bi-exclamation-triangle"></i>
    Couldn't load ${escapeHtml(sectionName)} — please check your connection.
    <br>
    <button class="btn-retry" onclick="${escapeHtml(retryFnName)}()">
      <i class="bi bi-arrow-clockwise"></i> Retry
    </button>
  </div>`;
}

// ─── Dynamic backend link synchronization ────────────────────────────────
function syncBackendLinks() {
  const cvUrl = 'https://drive.google.com/file/d/1ezs8hs6v_8_XickPu8nDRnsOSmf9bYvE/view?usp=sharing';
  document.querySelectorAll('a.nav-cv-download-link, #modalCvDownloadBtn').forEach(link => {
    link.href = cvUrl;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
}
document.addEventListener('DOMContentLoaded', syncBackendLinks);