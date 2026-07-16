// ─── Backend base URL ────────────────────────────────────────────────────
// Update this one line whenever your backend moves (Render, custom domain, etc.)
const API_BASE = "https://portfolio-backend-oz0v.onrender.com";

// ─── Core fetch helper ───────────────────────────────────────────────────
// Fetches JSON from the backend and fails soft (returns an empty array/object
// + logs a warning) so a single missing/misconfigured backend never breaks
// the whole page.
async function fetchJSON(path, fallback) {
  try {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn('Could not load ' + path + ' from backend:', err.message);
    return fallback;
  }
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

// ─── Endpoint-specific helpers ────────────────────────────────────────────
// Each mirrors an API route from content/urls.py. Fallbacks are empty
// arrays/objects so calling pages can safely .map() or check length
// even when the backend is unreachable.

function getSettings() {
  return fetchJSON('/api/settings/1', {});
}

function getEducation() {
  return fetchJSON('/api/education/1', []);
}

function getExperience() {
  return fetchJSON('/api/experience/1', []);
}

function getPublications() {
  return fetchJSON('/api/publications/1', []);
}

function getProjects() {
  return fetchJSON('/api/projects/1', []);
}

function getCertifications() {
  return fetchJSON('/api/certifications/1', []);
}

function getAwards() {
  return fetchJSON('/api/awards/1', []);
}

function getActivities() {
  return fetchJSON('/api/activities/1', []);
}

function getGallery() {
  return fetchJSON('/api/gallery/1', []);
}

function getReferences() {
  return fetchJSON('/api/references/1', []);
}