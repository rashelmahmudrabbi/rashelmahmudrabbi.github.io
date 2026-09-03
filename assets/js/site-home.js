// ─── Homepage renderer ───────────────────────────────────────────────────
// Uses the combined /api/portfolio endpoint (via api.js getPortfolio) for a
// single round-trip, with stale-while-revalidate caching. Each section has
// an individual retry mechanism so one failed section doesn't blank out the
// rest of the page.
(async function () {
  'use strict';

  // ── 1. Load portfolio data ─────────────────────────────────────────────
  const result = await getPortfolio();
  const d = result.data;
  const loadError = result.error;

  // Extract sub-objects (safe even if d is sparse)
  const settings     = d.settings || {};
  const education    = d.education || [];
  const experience   = d.experience || [];
  const publications = d.publications || [];
  const projects     = d.projects || [];
  const certifications = d.certifications || [];
  const awards       = d.awards || [];
  const activities   = d.activities || [];
  const gallery      = d.gallery || [];
  const references   = d.references || [];
  const spotlights   = d.spotlights || [];

  // ── 2. Render every section ────────────────────────────────────────────
  // Each render call is wrapped so one failure doesn't block the others.
  safeRender('Hero',              () => renderHero(settings, spotlights));
  safeRender('Objective',         () => renderObjective(settings));
  safeRender('Research Interests',() => renderResearchInterests(settings));
  safeRender('Experience',        () => renderExperience(experience));
  safeRender('Education',         () => renderEducation(education));
  safeRender('Publications',      () => renderPublications(publications));
  safeRender('Projects',          () => renderProjects(projects));
  safeRender('Certifications',    () => renderCertifications(certifications));
  safeRender('Skills',            () => renderSkills(settings));
  safeRender('Awards',            () => renderAwardsAndActivities(awards, activities));
  safeRender('Gallery',           () => renderGallery(gallery));
  safeRender('Contact Info',     () => renderContactInfo(settings));
  safeRender('References',        () => renderReferences(references));
  safeRender('Footer',            () => renderFooter(settings));

  // Dismiss preloader smoothly as all content is ready
  if (window.dismissPreloader) {
    window.dismissPreloader();
  }

  // If the initial load had an error and returned empty data, show
  // error states in sections that got no content:
  if (loadError) {
    showSectionErrors(d);
  }

  // ── Helper: safe render wrapper ────────────────────────────────────────
  function safeRender(label, fn) {
    try { fn(); } catch (e) { console.error(`Error rendering ${label}:`, e); }
  }

  // ── Show error states for empty sections when load failed ──────────────
  function showSectionErrors(data) {
    const checks = [
      { cond: !data.settings || !data.settings.profile, elId: 'heroContainer', name: 'profile', retry: 'retryAll' },
      { cond: !data.settings || !data.settings.profile, elId: 'objectiveText', name: 'career summary', retry: 'retryAll' },
      { cond: !data.education || !data.education.length, elId: 'educationTimeline', name: 'education', retry: 'retryAll' },
      { cond: !data.experience || !data.experience.length, elId: 'experienceTimeline', name: 'work experience', retry: 'retryAll' },
      { cond: !data.publications || !data.publications.length, elId: 'pubList', name: 'publications', retry: 'retryAll' },
      { cond: !data.certifications || !data.certifications.length, elId: 'certificationsList', name: 'certifications', retry: 'retryAll' },
      { cond: !data.awards || !data.awards.length, elId: 'awardsList', name: 'awards', retry: 'retryAll' },
      { cond: !data.gallery || !data.gallery.length, elId: 'galleryGrid', name: 'gallery', retry: 'retryAll' },
      { cond: !data.references || !data.references.length, elId: 'referencesList', name: 'references', retry: 'retryAll' },
    ];
    checks.forEach(c => {
      if (c.cond) {
        const el = document.getElementById(c.elId);
        if (el) {
          if (c.isTable) {
            el.innerHTML = `<tr><td colspan="5">${errorStateHtml(c.name, c.retry)}</td></tr>`;
          } else {
            el.innerHTML = errorStateHtml(c.name, c.retry);
          }
        }
      }
    });
  }

  // Global retry function — clear cache and reload
  window.retryAll = function() {
    try { sessionStorage.removeItem('portfolio_cache'); } catch(e) {}
    window.location.reload();
  };

  // ── RENDER FUNCTIONS ───────────────────────────────────────────────────

  function renderHero(settings, spotlights) {
    const p = settings.profile || {};
    const socials = p.socials || {};
    const stats = p.stats || {};

    const brandText = document.getElementById('navBrandText');
    if (brandText && p.name) brandText.textContent = p.name;

    const cvUrl = settings.cvDownloadUrl || (typeof API_BASE !== 'undefined' ? API_BASE + '/cv/download' : 'cv/index.html');
    window.__cvDownloadUrl = cvUrl;

    // Validate spotlight data from API — reject gibberish/placeholder entries
    function isValidSpotlightText(text) {
      if (!text || typeof text !== 'string') return false;
      const clean = text.trim();
      if (clean.length < 4) return false;
      // Must contain at least one space (real titles/descriptions have multiple words)
      // or be a known short keyword
      if (clean.length < 12 && !clean.includes(' ')) return false;
      // Reject strings that look like keyboard mashing (no vowels in a long string)
      const vowelRatio = (clean.match(/[aeiouAEIOU]/g) || []).length / clean.length;
      if (clean.length > 5 && vowelRatio < 0.1) return false;
      return true;
    }

    function isValidSpotlight(s) {
      return isValidSpotlightText(s.title) && isValidSpotlightText(s.description);
    }

    // Use API spotlights only
    const validApiSpotlights = (spotlights && spotlights.length > 0) 
      ? spotlights.filter(s => isValidSpotlight(s))
      : [];
    const items = validApiSpotlights;

    const spotlightCol = document.querySelector('.hero-spotlight-box')?.parentElement;
    const aboutCol = document.getElementById('aboutSectionContainer')?.parentElement;

    if (items.length === 0) {
      if (spotlightCol) spotlightCol.style.display = 'none';
      if (aboutCol) {
        aboutCol.classList.remove('col-lg-7');
        aboutCol.classList.add('col-lg-12');
      }
    } else {
      if (spotlightCol) spotlightCol.style.display = 'block';
      if (aboutCol) {
        aboutCol.classList.remove('col-lg-12');
        aboutCol.classList.add('col-lg-7');
      }
    }


    function getSpotlightIcon(item) {
      const bType = (item.badgeType || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const badge = (item.badge || '').toLowerCase();
      if (bType.includes('pub') || title.includes('paper') || title.includes('classification') || badge.includes('pub')) {
        return 'bi-journal-text';
      }
      if (bType.includes('proj') || title.includes('detection') || title.includes('project') || badge.includes('proj') || title.includes('model')) {
        return 'bi-cpu-fill';
      }
      if (bType.includes('xai') || title.includes('explain') || title.includes('vision') || badge.includes('vision') || title.includes('trust')) {
        return 'bi-lightbulb-fill';
      }
      if (title.includes('cancer') || title.includes('medical') || title.includes('health') || title.includes('diag')) {
        return 'bi-heart-pulse-fill';
      }
      return 'bi-stars';
    }

    const dotsHtml = items.map((_, i) => `<span class="s-dot ${i === 0 ? 'active' : ''}" onclick="switchSpotlight(${i})" title="Slide ${i+1}"></span>`).join('');
    const cardsHtml = items.map((item, i) => {
      const iconClass = getSpotlightIcon(item);
      let targetUrl = item.linkUrl || '';
      let targetLabel = item.linkLabel || '';
      if (!targetUrl) {
        const bType = (item.badgeType || '').toLowerCase();
        if (bType.includes('pub')) {
          targetUrl = 'publications/index.html';
          targetLabel = targetLabel || 'View Paper';
        } else if (bType.includes('proj')) {
          targetUrl = 'projects/index.html';
          targetLabel = targetLabel || 'Explore Project';
        } else {
          targetUrl = '#research';
          targetLabel = targetLabel || 'Learn More';
        }
      }
      if (!targetLabel) targetLabel = 'Explore';

      const thumbHtml = item.image
        ? `<div class="spotlight-body-large">
             <div class="spotlight-image-wrap" onclick="if(typeof showImageModal === 'function') showImageModal('${escapeHtml(resolveAssetUrl(item.image, false))}', '${escapeHtml(item.title || '')}')">
               <img src="${escapeHtml(resolveAssetUrl(item.image, false))}" class="spotlight-large-image" alt="${escapeHtml(item.title || '')}" />
             </div>
             <div class="spotlight-content text-center mt-3 mb-2">
               <h4 class="spotlight-title" title="${escapeHtml(item.title || '')}">${escapeHtml(item.title || 'Research Highlight')}</h4>
               <div class="spotlight-desc mx-auto" style="max-width:90%;">${formatRichText(item.description || 'Pioneering intelligent machine learning methodologies and reproducible research.')}</div>
             </div>
           </div>`
        : `<div class="spotlight-body">
             <div class="spotlight-icon-box ${escapeHtml(item.badgeType || 'badge-pub')}"><i class="bi ${iconClass}"></i></div>
             <div class="spotlight-content">
               <h4 class="spotlight-title" title="${escapeHtml(item.title || '')}">${escapeHtml(item.title || 'Research Highlight')}</h4>
               <div class="spotlight-desc">${formatRichText(item.description || 'Pioneering intelligent machine learning methodologies and reproducible research.')}</div>
             </div>
           </div>`;

      return `
      <div class="spotlight-card ${i === 0 ? 'active' : ''}" data-slide="${i}">
        <div class="spotlight-top-row" ${item.image ? 'style="margin-bottom:0.75rem;"' : ''}>
          <div class="spotlight-badge ${escapeHtml(item.badgeType || 'badge-pub')}">
            <i class="bi ${iconClass}"></i> ${escapeHtml(item.badge || 'Featured Highlight')}
          </div>
          ${item.tag ? `<span class="spotlight-tag"><i class="bi bi-tag-fill me-1" style="font-size:0.65rem;"></i>${escapeHtml(item.tag)}</span>` : ''}
        </div>
        
        ${thumbHtml}

        <div class="spotlight-footer" ${item.image ? 'style="margin-top:0.5rem;"' : ''}>
          <span class="spotlight-counter">
            <i class="bi bi-lightning-charge-fill text-warning"></i>
            <span>${i + 1} of ${items.length}</span>
          </span>
          <a href="${escapeHtml(targetUrl)}" class="spotlight-link">
            <span>${escapeHtml(targetLabel)}</span>
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>
      </div>`;
    }).join('');

    document.getElementById('heroContainer').innerHTML = `
      <div class="col-12 col-md-auto text-center text-md-start">
        <div class="hero-avatar-wrap">
          <img src="${p.avatar ? escapeHtml(resolveAssetUrl(p.avatar, false)) : getInitialsPlaceholder(p.name)}" class="hero-avatar" alt="${escapeHtml(p.name || '')}"
               onerror="this.onerror=null;this.src='${getInitialsPlaceholder(p.name)}'"/>
          <div class="hero-status-pill">
            <span class="status-pulse-dot"></span> ${escapeHtml(p.heroStatusText || 'Open to research')}
          </div>
        </div>
      </div>
      <div class="col-12 col-lg ps-lg-4">
        <p class="hero-title">${escapeHtml((p.title || 'Graduate Researcher – Computer Vision & AI').replace(/–.*$/, '–').replace(/—.*$/, '—'))} <span class="typewriter-wrapper"><span id="typewriterText">Computer Vision &amp; AI</span><span class="typewriter-cursor"></span></span></p>
        <h1 class="hero-name">${escapeHtml(p.name || '')}</h1>
        
        <div class="hero-contact mt-2 mb-3">
          ${p.location ? `<span><i class="bi bi-geo-alt-fill"></i>${escapeHtml(p.location.includes('Rajshahi') ? p.location : 'Rajshahi, Bangladesh')}</span>` : ''}
          ${p.email ? `<a href="mailto:${escapeHtml(p.email)}"><i class="bi bi-envelope-fill"></i>${escapeHtml(p.email)}</a>` : ''}
          ${p.phone ? `<a href="tel:${escapeHtml(p.phone.replace(/[^+\d]/g, ''))}"><i class="bi bi-telephone-fill"></i>${escapeHtml(p.phone)}</a>` : ''}
        </div>

        <div class="hero-socials d-flex flex-wrap gap-2 mb-3">
          ${socials.github ? `<a class="btn btn-sm" data-magnetic="0.25" href="${escapeHtml(socials.github)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github me-1"></i>GitHub</a>` : ''}
          ${socials.linkedin ? `<a class="btn btn-sm" data-magnetic="0.25" href="${escapeHtml(socials.linkedin)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : ''}
          ${socials.researchgate ? `<a class="btn btn-sm" data-magnetic="0.25" href="${escapeHtml(socials.researchgate)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-journal-text me-1"></i>ResearchGate</a>` : ''}
          ${socials.scholar ? `<a class="btn btn-sm" data-magnetic="0.25" href="${escapeHtml(socials.scholar)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-mortarboard me-1"></i>Google Scholar</a>` : ''}
          ${socials.orcid ? `<a class="btn btn-sm" data-magnetic="0.25" href="${escapeHtml(socials.orcid)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-person-badge me-1"></i>ORCID</a>` : ''}
          ${socials.x ? `<a class="btn btn-sm" data-magnetic="0.25" href="${escapeHtml(socials.x)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-twitter-x me-1"></i>X</a>` : ''}
        </div>

        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-num">${stats.publications ?? 3}</div><div class="hero-stat-label">Publications</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.projects ?? 7}</div><div class="hero-stat-label">Projects</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.awards ?? 2}</div><div class="hero-stat-label">Awards</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.certifications ?? 2}</div><div class="hero-stat-label">Certifications</div></div>
        </div>
      </div>
      </div>`;

    const dotsEl = document.getElementById('spotlightDots');
    if (dotsEl) dotsEl.innerHTML = dotsHtml;
    
    const carouselEl = document.getElementById('spotlightCarousel');
    if (carouselEl) {
      carouselEl.innerHTML = cardsHtml;
      const box = carouselEl.closest('.hero-spotlight-box');
      if (box) box.classList.remove('spotlight-skeleton');
    }

    if (window.initSpotlightCarousel) {
      window.initSpotlightCarousel(items.length);
    }
    
    if (window.initTypewriter) {
      window.initTypewriter();
    }

    // Fix broken hero avatar
    addImageFallbacks(document.getElementById('heroContainer'), getInitialsPlaceholder(p.name));

    // Trigger stat glow animation
    setTimeout(() => {
      document.querySelectorAll('.hero-stat').forEach(s => s.classList.add('stat-revealed'));
    }, 800);
  }

  function renderObjective(settings) {
    const p = settings.profile || {};
    const about = settings.about || {};

    const kickerEl = document.getElementById('aboutKicker');
    if (kickerEl) kickerEl.textContent = about.kicker || 'ABOUT ME';

    const headlineEl = document.getElementById('aboutHeadline');
    if (headlineEl) headlineEl.textContent = about.headline || 'AI research with a practical mindset.';

    // Dynamic Meta Pills
    const metaRow = document.getElementById('aboutMetaRow');
    if (metaRow) {
      const locText = p.location && p.location.includes('Rajshahi') ? p.location : (p.location || 'Rajshahi, Bangladesh');
      const statusText = about.statusText || 'Open to research opportunities';
      
      let pillsHtml = `
        <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
          <i class="bi bi-geo-alt-fill text-primary me-1"></i> <span>${escapeHtml(locText)}</span>
        </span>
      `;

      if (about.pills && about.pills.length > 0) {
        pillsHtml += about.pills.map(pill => {
          const icon = pill.icon || 'bi-cpu';
          const colorClass = pill.colorType ? `text-${pill.colorType}` : 'text-primary';
          return `
            <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
              <i class="bi ${escapeHtml(icon)} ${escapeHtml(colorClass)} me-1"></i> <span>${escapeHtml(pill.label || '')}</span>
            </span>
          `;
        }).join('');
      } else {
        // Fallback default pills if none added yet
        pillsHtml += `
          <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
            <i class="bi bi-cpu text-primary me-1"></i> <span>AI &amp; Computer Vision</span>
          </span>
          <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
            <i class="bi bi-heart-pulse-fill text-danger me-1"></i> <span>Medical Image Analysis</span>
          </span>
        `;
      }

      pillsHtml += `
        <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
          <span class="status-pulse-dot me-1"></span> <span>${escapeHtml(statusText)}</span>
        </span>
      `;

      metaRow.innerHTML = pillsHtml;
    }

    const el = document.getElementById('objectiveText');
    if (el) {
      const narrative = (about.text && about.text.trim().length > 0) ? about.text.trim() : '';
      if (narrative.length > 0) {
        el.innerHTML = formatRichText(narrative);
      } else {
        // Default 3-paragraph executive narrative if about_text is empty
        el.innerHTML = `
          <p>I'm a <strong>Computer Science &amp; Engineering graduate</strong> with a strong academic record and a research focus on Artificial Intelligence, Deep Learning, Computer Vision, and Medical Image Analysis.</p>
          <p>My work explores how modern deep learning models can solve challenging visual problems while remaining <strong>interpretable, reliable, and useful in real-world settings</strong>.</p>
          <p>I'm particularly interested in <strong>Explainable AI, multimodal learning, trustworthy AI, and resource-constrained healthcare systems</strong>, with the goal of pursuing advanced research and graduate study.</p>
        `;
      }
    }
  }

  function renderResearchInterests(settings) {
    const list = settings.researchInterests || [];
    const el = document.getElementById('researchInterestsList');
    el.innerHTML = list
      .map(
        (ri) => `
      <div class="col-lg-4 col-md-6 mb-4 stagger-item">
        <div class="research-card">
          <div class="card-glow"></div>
          <div class="research-card-icon">
            <i class="bi ${escapeHtml(ri.icon || 'bi-star')}"></i>
          </div>
          <h3 class="research-card-title">${escapeHtml(ri.topic || '')}</h3>
          <div class="research-card-desc">${escapeHtml(ri.description || ri.desc || '')}</div>
        </div>
      </div>`
      )
      .join('') || '<div class="col-12 text-muted text-center">No research interests added yet.</div>';

    // Mark container for stagger animation
    el.setAttribute('data-stagger-parent', '');
    if (window.initStaggerObserver) window.initStaggerObserver();
    if (window.initTiltCards) setTimeout(window.initTiltCards, 100);
  }

  function renderExperience(experience) {
    const el = document.getElementById('experienceTimeline');
    el.innerHTML = experience
      .map(
        (exp) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <h5>${escapeHtml(exp.title || exp.role || '')}</h5>
          <div class="org">${escapeHtml(exp.org || exp.company || '')}</div>
          <div class="period">${escapeHtml(exp.period || exp.date_range || '')}</div>
          <ul>${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>
      </div>`
      )
      .join('') || '<p class="text-muted">No experience entries yet.</p>';
  }

  function renderEducation(education) {
    const el = document.getElementById('educationTimeline');
    if (!el) return;

    if (!education.length) {
      el.innerHTML = '<p class="text-muted">No education records found.</p>';
      return;
    }

    function getStageLabel(e) {
      const deg = (e.degree || '').toLowerCase();
      if (deg.includes('b.sc') || deg.includes('bsc') || deg.includes('bachelor') || deg.includes('undergrad')) return 'Undergraduate';
      if (deg.includes('hsc') || deg.includes('higher secondary')) return 'Higher Secondary';
      if (deg.includes('ssc') || deg.includes('secondary school')) return 'Secondary';
      if (deg.includes('jsc') || deg.includes('junior')) return 'Junior Secondary';
      if (deg.includes('psc') || deg.includes('primary')) return 'Primary';
      return e.year ? `Class of ${e.year}` : 'Academic Stage';
    }

    function getDegreeTitle(e) {
      const deg = e.degree || '';
      const major = e.major && e.major !== '-' ? e.major : '';
      if (deg.toLowerCase().includes('b.sc') || deg.toLowerCase().includes('bsc')) {
        return major ? `B.Sc. in ${major}` : deg;
      }
      if (deg.toUpperCase() === 'HSC') {
        return 'Higher Secondary Certificate (HSC)';
      }
      if (deg.toUpperCase() === 'SSC') {
        return 'Secondary School Certificate (SSC)';
      }
      if (deg.toUpperCase() === 'JSC') {
        return 'Junior School Certificate (JSC)';
      }
      if (deg.toUpperCase() === 'PSC') {
        return 'Primary School Certificate (PSC)';
      }
      return major ? `${deg} – ${major}` : deg;
    }

    function getInstitutionName(e) {
      const inst = e.institution || '';
      if (inst.toLowerCase().includes('north bengal') && !inst.includes('NBIU')) {
        return 'North Bengal International University (NBIU)';
      }
      if (inst.toLowerCase() === 'mymensingh') {
        return 'Notre Dame College, Mymensingh';
      }
      if (inst.toLowerCase() === 'rajshahi') {
        return 'Hat Gangopara, Bagmara, Rajshahi';
      }
      return inst;
    }

    function getMajorLabel(e) {
      const raw = (e.major || '').trim();
      if (!raw || /^[-–—\s/n/a]+$/i.test(raw) || raw.toLowerCase() === 'null') return '';
      return raw;
    }

    function formatGpa(g) {
      if (!g) return '';
      let clean = g.replace(/^(c?gpa\s*:?\s*)/i, '').trim();
      if (clean.includes('/')) {
        const parts = clean.split('/');
        return `${parts[0].trim()} / ${parts[1].trim()}`;
      }
      return clean;
    }

    function getGradeChip(e) {
      const grade = (e.grade || '').trim();
      const major = getMajorLabel(e);
      const deg = (e.degree || '').toLowerCase();

      let gpaStr = '';
      if (grade) {
        const formatted = formatGpa(grade);
        if (deg.includes('b.sc') || deg.includes('bsc') || deg.includes('bachelor') || deg.includes('undergrad')) {
          gpaStr = `CGPA ${formatted}`;
        } else {
          gpaStr = `GPA ${formatted}`;
        }
      }

      if (deg.includes('b.sc') || deg.includes('bsc') || deg.includes('bachelor') || deg.includes('undergrad')) {
        return gpaStr ? `${gpaStr} · 1st in Department` : '1st in Department';
      }

      const extra = major ? (major.toLowerCase().includes('group') ? major : `${major} Group`) : '';
      if (gpaStr && extra) {
        return `${gpaStr} · ${extra}`;
      }
      return gpaStr || extra || '';
    }

    el.innerHTML = education
      .map(
        (e) => `
      <div class="academic-timeline-item">
        <div class="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mb-1">
          <h4 class="ti-degree mb-0">${escapeHtml(getDegreeTitle(e))}</h4>
          ${getGradeChip(e) ? `<span class="ti-grade-chip">${escapeHtml(getGradeChip(e))}</span>` : ''}
        </div>
        <div class="ti-meta d-flex align-items-center gap-2 flex-wrap">
          <span class="ti-institution">${escapeHtml(getInstitutionName(e))}</span>
          ${e.year ? `<span class="ti-dot">&bull;</span><span class="ti-year">${escapeHtml(e.year)}</span>` : ''}
        </div>
      </div>`
      )
      .join('');
  }

  function pubBadgeClass(type) {
    return { conference: 'badge-conference', journal: 'badge-journal', thesis: 'badge-thesis' }[type] || 'badge-conference';
  }

  // Helper to bold the owner's name in the authors list
  function formatAuthors(authorsStr, nameToBold) {
    let escAuth = escapeHtml(authorsStr || '');
    if (nameToBold) {
      const regex = new RegExp('(' + escapeHtml(nameToBold).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
      escAuth = escAuth.replace(regex, '<strong>$1</strong>');
    }
    return escAuth;
  }

  function renderPublications(publications) {
    const el = document.getElementById('pubList');
    // Homepage shows only a short preview (max 3), full list lives on /publications
    const preview = publications.slice(0, 3);
    const ownerName = (document.title.split(' –')[0] || '').trim();
    el.innerHTML = preview
      .map(
        (pub, idx) => `
      <div class="pub-card">
        <div class="pub-top d-flex align-items-center gap-2 mb-2">
          <span class="pub-number">[${idx + 1}]</span>
          <div class="pub-badges d-flex gap-2">
            <span class="badge-type badge-${escapeHtml(pub.type || 'conference')}">${escapeHtml(pub.type || 'Conference')}</span>
            <span class="badge-status status-published">${escapeHtml(pub.status || 'Published')}</span>
          </div>
        </div>
        <h3 class="pub-title">${escapeHtml(pub.title || '')}</h3>
        <div class="pub-authors mb-1">${formatAuthors(pub.authors, ownerName)}</div>
        <div class="pub-venue-row mb-2">
          <span class="pub-venue">${escapeHtml(pub.venue || '')}</span>
          ${pub.year ? ` <span class="pub-dot">&middot;</span> <span class="pub-year">${escapeHtml(pub.year)}</span>` : ''}
        </div>
        ${
          pub.abstract
            ? `<div class="pub-abstract-toggle" onclick="this.classList.toggle('open')">
          <span class="abstract-label"><i class="bi bi-chevron-right abstract-arrow"></i> Abstract</span>
          <div class="abstract-body">${formatRichText(pub.abstract)}</div>
        </div>`
            : ''
        }
        <div class="pub-links">
          ${pub.pdfLink || pub.pdf_link ? `<a class="pub-link" href="${escapeHtml(pub.pdfLink || pub.pdf_link)}" target="_blank"><i class="bi bi-file-earmark-pdf"></i> PDF</a>` : ''}
          ${pub.doiLink || pub.doi_link ? `<a class="pub-link btn-outline" href="${escapeHtml(pub.doiLink || pub.doi_link)}" target="_blank"><i class="bi bi-box-arrow-up-right"></i> DOI / IEEE</a>` : ''}
        </div>
      </div>`
      )
      .join('') || '<p class="text-muted">No publications yet.</p>';
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
      // Academic Portfolio: Custom RMR Monogram & Web Framework Frame in Gold & Royal Blue
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rmrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1E3A8A"/>
              <stop offset="50%" stop-color="#2F6FED"/>
              <stop offset="100%" stop-color="#3B82F6"/>
            </linearGradient>
            <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#D97706"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#rmrGrad)"/>
          <rect x="2.75" y="2.75" width="38.5" height="38.5" rx="10.25" stroke="url(#goldRing)" stroke-width="1.5" stroke-opacity="0.85"/>
          <circle cx="9" cy="9" r="1.5" fill="#EF4444"/>
          <circle cx="13.5" cy="9" r="1.5" fill="#FBBF24"/>
          <circle cx="18" cy="9" r="1.5" fill="#10B981"/>
          <text x="22" y="28" text-anchor="middle" font-family="'Crimson Pro', serif" font-size="14" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">RMR</text>
          <path d="M8 33H36" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-linecap="round"/>
          <path d="M12 36L15 33M32 36L29 33" stroke="#FBBF24" stroke-width="1.2" stroke-linecap="round"/>
        </svg>`;
    } else if (title.includes('rental') || title.includes('rentalhub')) {
      // RentalHub: Modern Property E-commerce & Housing Portal
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563EB"/>
              <stop offset="100%" stop-color="#0284C7"/>
            </linearGradient>
            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#EF4444"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#rentGrad)"/>
          <path d="M22 8L8 19V34C8 35.1 8.9 36 10 36H34C35.1 36 36 35.1 36 34V19L22 8Z" fill="white" fill-opacity="0.95"/>
          <path d="M22 6L6 18.5L8 20.5L22 9.5L36 20.5L38 18.5L22 6Z" fill="url(#roofGrad)"/>
          <rect x="12" y="22" width="6" height="5" rx="1" fill="#2563EB"/>
          <rect x="26" y="22" width="6" height="5" rx="1" fill="#2563EB"/>
          <path d="M19 36V28C19 26.9 19.9 26 21 26H23C24.1 26 25 26.9 25 28V36H19Z" fill="#F59E0B"/>
          <circle cx="23.5" cy="31" r="0.8" fill="white"/>
        </svg>`;
    } else if (title.includes('rajshahi')) {
      // OUR RAJSHAHI: Cultural Heritage & Regional Info Platform
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rajGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#059669"/>
              <stop offset="100%" stop-color="#0D9488"/>
            </linearGradient>
            <linearGradient id="rajGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F59E0B"/>
              <stop offset="100%" stop-color="#FBBF24"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#rajGrad)"/>
          <path d="M11 36V18L22 9L33 18V36" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 36V24C16 20.7 18.7 18 22 18C25.3 18 28 20.7 28 24V36" fill="url(#rajGold)"/>
          <path d="M7 33C11 31 15 35 19 33C23 31 27 35 31 33C33 32 35 32.5 37 33" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.8"/>
          <circle cx="22" cy="13.5" r="2.2" fill="url(#rajGold)"/>
        </svg>`;
    } else if (title.includes('hybswineff') || title.includes('cancer') || title.includes('blood')) {
      // HybSwinEff: Blood Cell Cancer Classification & Swin Transformer
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="medGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#BE123C"/>
              <stop offset="60%" stop-color="#7C3AED"/>
              <stop offset="100%" stop-color="#4F46E5"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#medGrad)"/>
          <circle cx="22" cy="22" r="13" stroke="white" stroke-width="1.5" stroke-dasharray="3 2" stroke-opacity="0.8"/>
          <circle cx="22" cy="22" r="8" fill="#F43F5E" fill-opacity="0.85"/>
          <path d="M22 13V31M13 22H31" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="22" cy="22" r="3" fill="#FDE047"/>
        </svg>`;
    } else if (title.includes('mrcl') || title.includes('satellite') || title.includes('eurosat')) {
      // SatelliteNet / MRCL-ELM: Earth Satellite Radar & Remote Sensing
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0284C7"/>
              <stop offset="60%" stop-color="#1E40AF"/>
              <stop offset="100%" stop-color="#312E81"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#satGrad)"/>
          <circle cx="22" cy="22" r="11" stroke="white" stroke-width="1.5" stroke-opacity="0.9"/>
          <ellipse cx="22" cy="22" rx="11" ry="4" stroke="white" stroke-width="1.2" stroke-opacity="0.7"/>
          <path d="M22 11V33" stroke="white" stroke-width="1.2" stroke-opacity="0.7"/>
          <circle cx="31" cy="13" r="2.5" fill="#38BDF8"/>
          <path d="M29 15L23 21" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1.5 1.5"/>
          <circle cx="22" cy="22" r="2" fill="#F59E0B"/>
        </svg>`;
    } else if (title.includes('neuro') || title.includes('brain') || title.includes('tumor')) {
      // NeuroFusion: Brain Tumor & Neural MRI Diagnostics
      logoSvg = `
        <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366F1"/>
              <stop offset="100%" stop-color="#A855F7"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#brainGrad)"/>
          <path d="M14 20C14 16 17 12 21 12C21.7 12 22 13 22 14V32C22 32.5 21.5 32 21 32C16 32 14 27 14 24C13 23 13 21 14 20Z" fill="white" fill-opacity="0.9"/>
          <path d="M30 20C30 16 27 12 23 12C22.3 12 22 13 22 14V32C22 32.5 22.5 32 23 32C28 32 30 27 30 24C31 23 31 21 30 20Z" fill="white" fill-opacity="0.7"/>
          <circle cx="22" cy="22" r="6" stroke="#F43F5E" stroke-width="1.5" stroke-dasharray="2 1.5"/>
          <circle cx="22" cy="22" r="2" fill="#FDE047"/>
        </svg>`;
    } else {
      if (isDev) {
        logoSvg = `
          <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="defDev" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>
            <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#defDev)"/>
            <path d="M14 17L9 22L14 27M30 17L35 22L30 27M24 14L20 30" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
      } else {
        logoSvg = `
          <svg class="project-logo-svg" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="defRes" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs>
            <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#defRes)"/>
            <rect x="12" y="12" width="20" height="20" rx="3" stroke="white" stroke-width="2"/>
            <path d="M16 8V12M22 8V12M28 8V12M16 32V36M22 32V36M28 32V36M8 16H12M8 22H12M8 28H12M32 16H36M32 22H36M32 28H36" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <circle cx="22" cy="22" r="3.5" fill="#F59E0B"/>
          </svg>`;
      }
    }

    return { logoSvg, badgeClass, badgeLabel, headerClass, isLive };
  }

  function projectCardHtml(p) {
    const desc = p.description || '';
    const isLong = desc.length > 110;
    const v = getProjectVisual(p);
    const github = p.githubLink || p.github_link || '';
    const live = p.paperLink || p.paper_link || '';

    return `
      <div class="col-md-6 col-lg-4 stagger-item">
        <div class="project-card">
          <div class="card-glow"></div>
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
            <div class="tech-chips">${(p.tech || []).map((t) => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="project-links">
              ${github ? `<a class="project-link" href="${escapeHtml(github)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github"></i> GitHub</a>` : ''}
              ${live ? `<a class="project-link secondary" href="${escapeHtml(live)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> Live Project</a>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderProjects(projects) {
    const thesis = projects.find((p) => p.category === 'thesis');
    const research = projects.filter((p) => p.category === 'research');
    const dev = projects.filter((p) => p.category === 'development');

    document.getElementById('thesisCardContainer').innerHTML = thesis
      ? `
      <div class="thesis-card">
        <div class="thesis-top d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div class="thesis-label"><i class="bi bi-mortarboard-fill me-1"></i>Final Year Thesis &middot; ${escapeHtml(thesis.year || '')}</div>
          <span class="accuracy-badge" style="background:rgba(245,158,11,0.12);color:var(--navy);border:1px solid rgba(245,158,11,0.3);padding:0.2rem 0.65rem;border-radius:20px;font-size:0.75rem;font-weight:700;"><i class="bi bi-stars text-warning me-1"></i>99.69% Accuracy</span>
        </div>
        <div class="thesis-title">${escapeHtml(thesis.title || '')}</div>
        <div class="thesis-desc">${formatRichText(thesis.description || '')}</div>
        <div class="mb-3">${(thesis.tech || []).map((t) => `<span class="thesis-chip">${escapeHtml(t)}</span>`).join('')}</div>
        <div class="d-flex gap-2 flex-wrap">
          ${thesis.githubLink ? `<a class="thesis-link" href="${escapeHtml(thesis.githubLink)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github"></i> GitHub</a>` : ''}
          <a class="thesis-link secondary" href="publications/index.html"><i class="bi bi-journal-text"></i> Related Paper</a>
        </div>
      </div>`
      : '';

    document.getElementById('researchProjectsList').innerHTML =
      research.map(projectCardHtml).join('') || '<div class="col-12 text-muted text-center">No research projects yet.</div>';
    document.getElementById('experienceProjectsList').innerHTML =
      dev.map(projectCardHtml).join('') || '<div class="col-12 text-muted text-center">No project-experience entries yet.</div>';

    // Enable stagger animations on project containers
    const resList = document.getElementById('researchProjectsList');
    const expList = document.getElementById('experienceProjectsList');
    if (resList) resList.setAttribute('data-stagger-parent', '');
    if (expList) expList.setAttribute('data-stagger-parent', '');
    if (window.initStaggerObserver) window.initStaggerObserver();
    if (window.initTiltCards) setTimeout(window.initTiltCards, 100);
  }

  function renderCertifications(certifications) {
    const el = document.getElementById('certificationsList');
    el.innerHTML = certifications
      .map(
        (c) => `
      <div class="col-lg-3 col-md-4 col-sm-6 mb-3 stagger-item">
        <div class="cert">
          <div class="cert-inner">
            <div class="cert-face cert-front">
              ${c.image 
                ? `<div class="badge badge-img" style="min-width:56px;min-height:56px;"><img src="${escapeHtml(resolveAssetUrl(c.image, false))}" alt="${escapeHtml(c.title || '')}" loading="lazy" style="max-height:64px;width:auto;"/></div>`
                : `<div class="badge text-badge">★</div>`
              }
              <h3>${escapeHtml(c.title || '')}</h3>
              <div class="hint">Hover to verify</div>
            </div>
            <div class="cert-face cert-back" style="padding:15px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
              <h4 style="color:var(--gold-soft); font-family:'DM Sans', sans-serif; font-size:1rem; margin-bottom:5px;">${escapeHtml(c.issuer || '')}</h4>
              <div style="font-size:0.8rem; margin-bottom:6px;">Issued ${escapeHtml(c.year || '')}</div>
              <div style="font-size:0.7rem; margin-bottom:12px; opacity:0.8;">ID: ${escapeHtml(c.id || 'N/A')}</div>
              <div style="display:flex; justify-content:center; gap: 8px; flex-wrap:wrap;">
                ${(c.pdf_link || c.pdfLink) ? `<a href="${escapeHtml(resolveAssetUrl(c.pdf_link || c.pdfLink, false))}" class="cert-link" target="_blank" title="View Certificate"><i class="bi bi-file-earmark-pdf"></i> View</a>` : ''}
                ${(c.verify_link || c.verifyLink) ? `<a href="${escapeHtml(c.verify_link || c.verifyLink)}" class="cert-link" target="_blank" title="Verify Certificate"><i class="bi bi-shield-check"></i> Verify</a>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>`
      )
      .join('') || '<div class="col-12 text-muted text-center">No certifications yet.</div>';

    // Fix any broken cert images
    addImageFallbacks(el, getGenericPlaceholder());

    // Enable stagger animations on certifications
    el.setAttribute('data-stagger-parent', '');
    if (window.initStaggerObserver) window.initStaggerObserver();
  }

  function skillGroupHtml(label, icon, items) {
    if (!items || !items.length) return '';
    return `
      <div class="skill-group">
        <div class="skill-group-label"><i class="bi ${icon} me-1"></i>${label}</div>
        ${items.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
      </div>`;
  }

  function renderSkills(settings) {
    const s = settings.skills || {};
    document.getElementById('skillsGroups').innerHTML = `
      <div class="col-md-6">
        ${skillGroupHtml('Programming Languages', 'bi-code-slash', s.languages)}
        ${skillGroupHtml('Libraries & Frameworks', 'bi-layers', s.frameworks)}
      </div>
      <div class="col-md-6">
        ${skillGroupHtml('Tools & Platforms', 'bi-tools', s.tools)}
        ${skillGroupHtml('Research Methods', 'bi-search', s.researchMethods)}
      </div>`;

    const langs = settings.spokenLanguages || [];
    document.getElementById('spokenLanguagesList').innerHTML = langs
      .map(
        (l) => `
      <div class="col-4 col-md-3 col-lg-2">
        <div class="lang-card"><div class="lang-name">${escapeHtml(l.name || '')}</div><div class="lang-level">${escapeHtml(l.level || '')}</div></div>
      </div>`
      )
      .join('');
  }

  function renderAwardsAndActivities(awards, activities) {
    const awardsEl = document.getElementById('awardsList');
    awardsEl.innerHTML =
      awards
        .map(
          (a) => `
      <div class="col-lg-3 col-md-4 col-sm-6 mb-3 stagger-item">
        <div class="award-item">
          <div class="award-icon"><i class="bi bi-trophy-fill"></i></div>
          ${a.image ? `<img src="${escapeHtml(resolveAssetUrl(a.image, false))}" class="award-thumb" alt="${escapeHtml(a.title || '')}" loading="lazy"
               onerror="this.onerror=null;this.src='${getGenericPlaceholder()}'"
               onclick="showImageModal(this.src,'${escapeHtml(a.title || '')}')"/>` : ''}
          <div>
            <div class="award-title">${escapeHtml(a.title || '')}</div>
            <div class="award-meta">${escapeHtml(a.org || '')} · ${escapeHtml(a.year || '')}</div>
          </div>
        </div>
      </div>`
        )
        .join('') || '<p class="text-muted">No awards yet.</p>';

    // Fix broken award images
    addImageFallbacks(awardsEl, getGenericPlaceholder());

    // Enable stagger animations on awards
    awardsEl.setAttribute('data-stagger-parent', '');
    if (window.initStaggerObserver) window.initStaggerObserver();

    document.getElementById('activitiesList').innerHTML = activities
      .map((a) => `<div class="activity-item"><i class="bi bi-check2-circle"></i>${escapeHtml(a.text || '')}</div>`)
      .join('');
  }

  function renderGallery(gallery) {
    galleryEvents = gallery; // used by the lightbox functions already defined inline in index.html
    const el = document.getElementById('galleryGrid');
    el.innerHTML = gallery
      .map(
        (ev, idx) => `
      <div class="gallery-item" onclick="openLightbox(${idx})">
        <img src="${escapeHtml(resolveAssetUrl((ev.photos && ev.photos[0] && ev.photos[0].src) || '', false))}" alt="${escapeHtml(ev.title || '')}" loading="lazy"
             onerror="this.onerror=null;this.src='${getGenericPlaceholder()}'"/>
        <span class="gallery-photo-badge"><i class="bi bi-images"></i> ${(ev.photos || []).length}</span>
        <div class="gallery-overlay">
          <div class="gallery-caption">${escapeHtml(ev.title || '')}</div>
          <div class="gallery-year">
            <span><i class="bi bi-calendar3 me-1"></i>${escapeHtml(ev.year || '')}</span>
            <span><i class="bi bi-images me-1"></i>${(ev.photos || []).length} photos</span>
          </div>
        </div>
      </div>`
      )
      .join('') || '<div class="text-muted text-center">No gallery events yet.</div>';

    // Fix broken gallery images
    addImageFallbacks(el, getGenericPlaceholder());
  }

  function renderContactInfo(settings) {
    const p = settings.profile || {};
    const info = settings.personalInfo || {};
    const leftEl = document.getElementById('contactInfoLeft');
    const rightEl = document.getElementById('contactInfoRight');
    if (leftEl) {
      leftEl.innerHTML = `
        ${p.email ? `<div class="info-row"><span class="info-label"><i class="bi bi-envelope me-2"></i>Email</span><span class="info-value"><a href="mailto:${escapeHtml(p.email)}" style="color:var(--gold);text-decoration:none;">${escapeHtml(p.email)}</a></span></div>` : ''}
        ${p.phone ? `<div class="info-row"><span class="info-label"><i class="bi bi-telephone me-2"></i>Phone</span><span class="info-value"><a href="tel:${escapeHtml(p.phone.replace(/[^+\d]/g, ''))}" style="color:var(--text-dark);text-decoration:none;">${escapeHtml(p.phone)}</a></span></div>` : ''}
        ${p.location ? `<div class="info-row"><span class="info-label"><i class="bi bi-geo-alt me-2"></i>Location</span><span class="info-value">${escapeHtml(p.location)}</span></div>` : ''}
        ${info.fatherName ? `<div class="info-row"><span class="info-label"><i class="bi bi-person me-2"></i>Father's Name</span><span class="info-value">${escapeHtml(info.fatherName)}</span></div>` : ''}
        ${info.motherName ? `<div class="info-row"><span class="info-label"><i class="bi bi-person-heart me-2"></i>Mother's Name</span><span class="info-value">${escapeHtml(info.motherName)}</span></div>` : ''}
        ${info.dob ? `<div class="info-row"><span class="info-label"><i class="bi bi-calendar-event me-2"></i>Date of Birth</span><span class="info-value">${escapeHtml(info.dob)}</span></div>` : ''}
        ${info.religion ? `<div class="info-row"><span class="info-label"><i class="bi bi-moon-stars me-2"></i>Religion</span><span class="info-value">${escapeHtml(info.religion)}</span></div>` : ''}
        ${info.nid ? `<div class="info-row"><span class="info-label"><i class="bi bi-person-vcard me-2"></i>NID</span><span class="info-value">${escapeHtml(info.nid)}</span></div>` : ''}`;
    }
    if (rightEl) {
      const socials = p.socials || {};
      rightEl.innerHTML = `
        ${info.maritalStatus ? `<div class="info-row"><span class="info-label"><i class="bi bi-heart me-2"></i>Marital Status</span><span class="info-value">${escapeHtml(info.maritalStatus)}</span></div>` : ''}
        ${info.bloodGroup ? `<div class="info-row"><span class="info-label"><i class="bi bi-droplet-half me-2"></i>Blood Group</span><span class="info-value">${escapeHtml(info.bloodGroup)}</span></div>` : ''}
        ${info.nationality ? `<div class="info-row"><span class="info-label"><i class="bi bi-flag me-2"></i>Nationality</span><span class="info-value">${escapeHtml(info.nationality)}</span></div>` : ''}
        ${info.address ? `<div class="info-row"><span class="info-label"><i class="bi bi-house-door me-2"></i>Address</span><span class="info-value">${escapeHtml(info.address)}</span></div>` : ''}
        ${socials.github ? `<div class="info-row"><span class="info-label"><i class="bi bi-github me-2"></i>GitHub</span><span class="info-value"><a href="${escapeHtml(socials.github)}" target="_blank" style="color:var(--gold);text-decoration:none;">rashelmahmudrabbi</a></span></div>` : ''}
        ${socials.linkedin ? `<div class="info-row"><span class="info-label"><i class="bi bi-linkedin me-2"></i>LinkedIn</span><span class="info-value"><a href="${escapeHtml(socials.linkedin)}" target="_blank" style="color:var(--gold);text-decoration:none;">rashelmahmudrabbi</a></span></div>` : ''}
        ${socials.scholar ? `<div class="info-row"><span class="info-label"><i class="bi bi-mortarboard me-2"></i>Google Scholar</span><span class="info-value"><a href="${escapeHtml(socials.scholar)}" target="_blank" style="color:var(--gold);text-decoration:none;">View Profile</a></span></div>` : ''}
        ${socials.orcid ? `<div class="info-row"><span class="info-label"><i class="bi bi-person-badge me-2"></i>ORCID</span><span class="info-value"><a href="${escapeHtml(socials.orcid)}" target="_blank" style="color:var(--gold);text-decoration:none;">0009-0004-6070-4496</a></span></div>` : ''}`;
    }
  }

  function renderReferences(references) {
    document.getElementById('referencesList').innerHTML = references
      .map(
        (r) => `
      <div class="col-md-6">
        <div class="ref-card">
          <div class="ref-name">${escapeHtml(r.name || '')}</div>
          <div class="ref-role">${escapeHtml(r.role || '')}</div>
          <div class="ref-org">${escapeHtml(r.org || '')}</div>
          ${r.note ? `<div class="ref-mini-org"><b>${escapeHtml(r.note)}</b></div>` : ''}
          <div class="ref-contact">
            ${r.phone ? `<a href="tel:${escapeHtml(r.phone.replace(/[^+\d]/g, ''))}"><i class="bi bi-telephone me-1"></i>${escapeHtml(r.phone)}</a>` : ''}
            ${r.email ? `<a href="mailto:${escapeHtml(r.email)}"><i class="bi bi-envelope me-1"></i>${escapeHtml(r.email)}</a>` : ''}
          </div>
        </div>
      </div>`
      )
      .join('') || '<div class="col-12 text-muted text-center">No references yet.</div>';
  }

  function renderFooter(settings) {
    const p = settings.profile || {};
    if (settings.footerText) document.getElementById('footerText').textContent = settings.footerText;
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    if (p.name) document.getElementById('footerName').textContent = p.name;
    if (p.title) document.getElementById('footerTitle').textContent = p.title;
  }
})();


