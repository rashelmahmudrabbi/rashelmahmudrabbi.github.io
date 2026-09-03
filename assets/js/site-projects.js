(async function () {
  'use strict';
  
  const result = await getPortfolio(true);
  const d = result.data || {};
  const projects = d.projects || [];
  const settings = d.settings || {};

  const research = projects.filter((p) => p.category === 'research' || p.category === 'thesis');
  const dev = projects.filter((p) => p.category === 'development');
  const featured = projects.filter((p) => p.featured);
  const thesis = projects.filter((p) => p.category === 'thesis');

  const years = [...new Set(projects.map((p) => p.year).filter(Boolean))].sort().reverse();

  renderFilterBar();
  renderProjectsContainer();
  renderFooter(settings);

  function renderFilterBar() {
    const el = document.getElementById('filterBarButtons');
    const buttons = [
      `<button class="filter-btn all active" onclick="filterProjects('all',this)">All (${projects.length})</button>`,
      `<button class="filter-btn" onclick="filterProjects('research',this)">Research (${research.length})</button>`,
      `<button class="filter-btn" onclick="filterProjects('development',this)">Development (${dev.length})</button>`,
      ...years.map((y) => `<button class="filter-btn" onclick="filterProjects('${escapeHtml(y)}',this)">${escapeHtml(y)}</button>`),
    ];
    el.insertAdjacentHTML('beforeend', buttons.join(''));
  }

  function techChips(tech, cls) {
    return (tech || []).map((t) => `<span class="${cls}">${escapeHtml(t)}</span>`).join('');
  }

  function getProjectVisual(p) {
    const cat = (p.category || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const isDev = cat === 'development';
    const badgeClass = isDev ? 'dev-badge' : 'research-badge';
    const badgeLabel = isDev ? 'Development' : (cat === 'thesis' ? 'Thesis' : 'Research');
    const headerClass = isDev ? 'header-dev' : 'header-research';
    const isLive = Boolean(p.paper_link || p.paperLink);

    let logoSvg = '';

    if (title.includes('portfolio')) {
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rmrGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1E3A8A"/>
              <stop offset="50%" stop-color="#2F6FED"/>
              <stop offset="100%" stop-color="#3B82F6"/>
            </linearGradient>
            <linearGradient id="goldRingP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#D97706"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#rmrGradP)"/>
          <rect x="2.75" y="2.75" width="38.5" height="38.5" rx="10.25" stroke="url(#goldRingP)" stroke-width="1.5" stroke-opacity="0.85"/>
          <circle cx="9" cy="9" r="1.5" fill="#EF4444"/>
          <circle cx="13.5" cy="9" r="1.5" fill="#FBBF24"/>
          <circle cx="18" cy="9" r="1.5" fill="#10B981"/>
          <text x="22" y="28" text-anchor="middle" font-family="'Crimson Pro', serif" font-size="14" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">RMR</text>
          <path d="M8 33H36" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-linecap="round"/>
          <path d="M12 36L15 33M32 36L29 33" stroke="#FBBF24" stroke-width="1.2" stroke-linecap="round"/>
        </svg>`;
    } else if (title.includes('rental') || title.includes('rentalhub')) {
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rentGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563EB"/>
              <stop offset="100%" stop-color="#0284C7"/>
            </linearGradient>
            <linearGradient id="roofGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#EF4444"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#rentGradP)"/>
          <path d="M22 8L8 19V34C8 35.1 8.9 36 10 36H34C35.1 36 36 35.1 36 34V19L22 8Z" fill="white" fill-opacity="0.95"/>
          <path d="M22 6L6 18.5L8 20.5L22 9.5L36 20.5L38 18.5L22 6Z" fill="url(#roofGradP)"/>
          <rect x="12" y="22" width="6" height="5" rx="1" fill="#2563EB"/>
          <rect x="26" y="22" width="6" height="5" rx="1" fill="#2563EB"/>
          <path d="M19 36V28C19 26.9 19.9 26 21 26H23C24.1 26 25 26.9 25 28V36H19Z" fill="#F59E0B"/>
          <circle cx="23.5" cy="31" r="0.8" fill="white"/>
        </svg>`;
    } else if (title.includes('rajshahi')) {
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rajGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#059669"/>
              <stop offset="100%" stop-color="#0D9488"/>
            </linearGradient>
            <linearGradient id="rajGoldP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#FBBF24"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#rajGradP)"/>
          <path d="M11 36V18L22 9L33 18V36" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 36V24C16 20.7 18.7 18 22 18C25.3 18 28 20.7 28 24V36" fill="url(#rajGoldP)"/>
          <path d="M7 33C11 31 15 35 19 33C23 31 27 35 31 33C33 32 35 32.5 37 33" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.8"/>
          <circle cx="22" cy="13.5" r="2.2" fill="url(#rajGoldP)"/>
        </svg>`;
    } else if (title.includes('hybswineff') || title.includes('cancer') || title.includes('blood')) {
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="medGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#BE123C"/>
              <stop offset="60%" stop-color="#7C3AED"/>
              <stop offset="100%" stop-color="#4F46E5"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#medGradP)"/>
          <circle cx="22" cy="22" r="13" stroke="white" stroke-width="1.5" stroke-dasharray="3 2" stroke-opacity="0.8"/>
          <circle cx="22" cy="22" r="8" fill="#F43F5E" fill-opacity="0.85"/>
          <path d="M22 13V31M13 22H31" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="22" cy="22" r="3" fill="#FDE047"/>
        </svg>`;
    } else if (title.includes('mrcl') || title.includes('satellite') || title.includes('eurosat')) {
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="satGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0284C7"/>
              <stop offset="60%" stop-color="#1E40AF"/>
              <stop offset="100%" stop-color="#312E81"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#satGradP)"/>
          <circle cx="22" cy="22" r="11" stroke="white" stroke-width="1.5" stroke-opacity="0.9"/>
          <ellipse cx="22" cy="22" rx="11" ry="4" stroke="white" stroke-width="1.2" stroke-opacity="0.7"/>
          <path d="M22 11V33" stroke="white" stroke-width="1.2" stroke-opacity="0.7"/>
          <circle cx="31" cy="13" r="2.5" fill="#38BDF8"/>
          <path d="M29 15L23 21" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1.5 1.5"/>
          <circle cx="22" cy="22" r="2" fill="#F59E0B"/>
        </svg>`;
    } else if (title.includes('neuro') || title.includes('brain') || title.includes('tumor')) {
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="brainGradP" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366F1"/>
              <stop offset="100%" stop-color="#A855F7"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#brainGradP)"/>
          <path d="M14 20C14 16 17 12 21 12C21.7 12 22 13 22 14V32C22 32.5 21.5 32 21 32C16 32 14 27 14 24C13 23 13 21 14 20Z" fill="white" fill-opacity="0.9"/>
          <path d="M30 20C30 16 27 12 23 12C22.3 12 22 13 22 14V32C22 32.5 22.5 32 23 32C28 32 30 27 30 24C31 23 31 21 30 20Z" fill="white" fill-opacity="0.7"/>
          <circle cx="22" cy="22" r="6" stroke="#F43F5E" stroke-width="1.5" stroke-dasharray="2 1.5"/>
          <circle cx="22" cy="22" r="2" fill="#FDE047"/>
        </svg>`;
    } else {
      if (isDev) {
        logoSvg = `
          <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="defDevP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>
            <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#defDevP)"/>
            <path d="M14 17L9 22L14 27M30 17L35 22L30 27M24 14L20 30" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
      } else {
        logoSvg = `
          <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="defResP" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>
            <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#defResP)"/>
            <rect x="12" y="12" width="20" height="20" rx="3" stroke="white" stroke-width="2"/>
            <path d="M16 8V12M22 8V12M28 8V12M16 32V36M22 32V36M28 32V36M8 16H12M8 22H12M8 28H12M32 16H36M32 22H36M32 28H36" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="22" cy="22" r="3.5" fill="#F59E0B"/>
          </svg>`;
      }
    }

    return { logoSvg, badgeClass, badgeLabel, headerClass, isLive };
  }

  function featuredCardHtml(p) {
    const v = getProjectVisual(p);
    return `
    <div class="col-12 filterable" data-year="${escapeHtml(p.year || '')}" data-type="research">
      <div class="featured-card">
        <div class="featured-img ${v.headerClass}">
          <span class="featured-badge">&#11088; Featured Research</span>
          <span class="project-year-badge" style="position:absolute;top:1rem;right:1rem;">${escapeHtml(p.year || '')}</span>
          <div class="project-logo-wrap" style="width:72px;height:72px;border-radius:20px;">
            ${v.logoSvg}
          </div>
        </div>
        <div class="featured-body">
          <div class="d-flex flex-wrap gap-2 mb-2">
            <span class="accuracy-badge"><i class="bi bi-stars text-warning me-1"></i>99.69% Accuracy</span>
            <span class="accuracy-badge" style="border-color:rgba(124,58,237,0.3);color:var(--navy);"><i class="bi bi-cpu me-1 text-primary"></i>Hybrid CNN-Transformer</span>
          </div>
          <div class="featured-title">${escapeHtml(p.title || '')}</div>
          <div class="featured-desc">${formatRichText(p.description || '')}</div>
          <div class="mb-3">${techChips(p.tech, 'tech-chip')}</div>
          <div class="d-flex gap-2 flex-wrap">
            ${p.githubLink ? `<a class="project-link" href="${escapeHtml(p.githubLink)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github"></i> GitHub</a>` : ''}
            <a class="project-link secondary" href="../publications/index.html"><i class="bi bi-journal-text"></i> Thesis & Publication</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  function thesisCardHtml(p) {
    return `
    <div class="thesis-card filterable" data-year="${escapeHtml(p.year || '')}" data-type="research">
      <div class="thesis-top d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <div class="thesis-label"><i class="bi bi-mortarboard-fill me-1"></i>Final Year Thesis &middot; ${escapeHtml(p.year || '')}</div>
        <span class="accuracy-badge" style="background:rgba(245,158,11,0.12);color:var(--navy);border:1px solid rgba(245,158,11,0.3);padding:0.2rem 0.65rem;border-radius:20px;font-size:0.75rem;font-weight:700;"><i class="bi bi-stars text-warning me-1"></i>99.69% Accuracy</span>
      </div>
      <div class="thesis-title">${escapeHtml(p.title || '')}</div>
      <div class="thesis-desc">${formatRichText(p.description || '')}</div>
      <div class="mb-3">${techChips(p.tech, 'thesis-chip')}</div>
      <div class="d-flex gap-2 flex-wrap">
        ${p.githubLink ? `<a class="thesis-link" href="${escapeHtml(p.githubLink)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github"></i> GitHub</a>` : ''}
        <a class="thesis-link secondary" href="../publications/index.html"><i class="bi bi-journal-text"></i> Related Paper</a>
      </div>
    </div>`;
  }

  function projectCardHtml(p) {
    const desc = p.description || '';
    const isLong = desc.length > 110;
    const v = getProjectVisual(p);
    return `
    <div class="col-md-6 col-lg-4 filterable" data-year="${escapeHtml(p.year || '')}" data-type="${escapeHtml(p.category || '')}">
      <div class="project-card">
        <div class="project-img ${v.headerClass}">
          <span class="project-type-badge ${v.badgeClass}">${v.badgeLabel}</span>
          <span class="project-year-badge">${escapeHtml(p.year || '')}</span>
          ${v.isLive ? `<span class="project-live-badge"><span class="pulse-dot"></span> Live App</span>` : ''}
          <div class="project-logo-wrap">
            ${v.logoSvg}
          </div>
        </div>
        <div class="project-body">
          <div class="project-title">${escapeHtml(p.title || '')}</div>
          <div class="project-desc${isLong ? ' collapsed' : ''}">${formatRichText(desc)}</div>
          ${isLong ? `<button type="button" class="btn-learn-more" onclick="toggleProjectDesc(this)">Learn More <i class="bi bi-chevron-down ms-1"></i></button>` : ''}
          <div class="tech-chips">${techChips(p.tech, 'tech-chip')}</div>
          <div class="project-links">
            ${p.githubLink ? `<a class="project-link" href="${escapeHtml(p.githubLink)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github"></i> GitHub</a>` : ''}
            ${p.paperLink ? `<a class="project-link secondary" href="${escapeHtml(p.paperLink)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> Live Project</a>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderProjectsContainer() {
    const el = document.getElementById('projectsContainer');
    if (!projects.length) {
      el.innerHTML = '<p class="text-center text-muted py-5">No projects added yet.</p>';
      return;
    }

    const researchGridItems = research.filter((p) => p.category === 'research' && !p.featured);

    let html = '';
    html += `
      <div class="section-divider" id="research-section">
        <h2><i class="bi bi-journal-code section-icon"></i>Research Projects</h2>
        <p>Deep learning systems for medical imaging, remote sensing, and signal processing</p>
        <hr class="section-line gold-line">
      </div>`;

    featured.forEach((p) => (html += featuredCardHtml(p)));
    thesis.forEach((p) => (html += thesisCardHtml(p)));

    if (researchGridItems.length) {
      html += `<div class="row g-4">${researchGridItems
        .map((p) => projectCardHtml(p))
        .join('')}</div>`;
    }

    if (dev.length) {
      html += `
        <div class="section-divider mt-4" id="dev-section">
          <h2><i class="bi bi-code-square section-icon"></i>Project Experience</h2>
          <p>Full-stack web applications built with Django, Bootstrap, and modern tooling</p>
          <hr class="section-line">
        </div>
        <div class="row g-4">${dev.map((p) => projectCardHtml(p)).join('')}</div>`;
    }

    el.innerHTML = html;
  }

  function renderFooter(settings) {
    const p = settings.profile || {};
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    if (p.name) document.getElementById('footerName').textContent = p.name;
    if (p.title) document.getElementById('footerTitle').textContent = p.title;
    if (p.email) {
      const el = document.getElementById('footerEmail');
      if (el) {
        el.textContent = p.email;
        el.href = 'mailto:' + p.email;
      }
    }
  }
})();
