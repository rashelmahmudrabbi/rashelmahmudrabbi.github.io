// Small helper shared by every page: fetches JSON from the backend and
// fails soft (returns an empty array/object + logs a warning) so a single
// missing/misconfigured backend never breaks the whole page.
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

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
