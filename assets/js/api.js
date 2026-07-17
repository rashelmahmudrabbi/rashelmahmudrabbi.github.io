// ─── Backend base URL ────────────────────────────────────────────────────
// API_BASE is declared in config.js (loaded before this file) — do not
// redeclare it here, that causes a duplicate-declaration error that breaks
// this whole script.

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
  return fetchJSON('/settings/1', {});
}

function getEducation() {
  return fetchJSON('/education/1', []);
}

function getExperience() {
  return fetchJSON('/experience/1', []);
}

function getPublications() {
  return fetchJSON('/publications/1', []);
}

function getProjects() {
  return fetchJSON('/projects/1', []);
}

function getCertifications() {
  return fetchJSON('/certifications/1', []);
}

function getAwards() {
  return fetchJSON('/awards/1', []);
}

function getActivities() {
  return fetchJSON('/activities/1', []);
}

function getGallery() {
  return fetchJSON('/gallery/1', []);
}

function getReferences() {
  return fetchJSON('/references/1', []);
}