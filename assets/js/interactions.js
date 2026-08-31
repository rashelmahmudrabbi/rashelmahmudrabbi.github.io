// ─── interactions.js ─────────────────────────────────────────────────────────
// Premium interactive effects: cursor follower, magnetic buttons, 3D tilt cards,
// page transitions, typewriter, particles, scroll progress.
// All effects are GPU-composited, mobile-aware, and theme-independent.
(function () {
  'use strict';

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. CUSTOM CURSOR FOLLOWER ─────────────────────────────────────────────
  if (!isTouchDevice && !prefersReducedMotion) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    if (dot && ring) {
      let mouseX = -100, mouseY = -100;
      let ringX = -100, ringY = -100;
      let dotX = -100, dotY = -100;
      let isHovering = false;
      let isClicking = false;

      document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      document.addEventListener('mousedown', () => {
        isClicking = true;
        dot.classList.add('clicking');
        ring.classList.add('clicking');
      });

      document.addEventListener('mouseup', () => {
        isClicking = false;
        dot.classList.remove('clicking');
        ring.classList.remove('clicking');
      });

      // Track hover on interactive elements
      const interactiveSelectors = 'a, button, .btn, .project-card, .pub-card, .research-card, .cert, .award-item, .gallery-item, .nav-link, .hero-socials .btn, .skill-tag, .lang-card, [data-magnetic]';
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveSelectors)) {
          isHovering = true;
          dot.classList.add('hovering');
          ring.classList.add('hovering');
        }
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveSelectors)) {
          isHovering = false;
          dot.classList.remove('hovering');
          ring.classList.remove('hovering');
        }
      });

      function animateCursor() {
        // Smooth lerp
        dotX += (mouseX - dotX) * 0.35;
        dotY += (mouseY - dotY) * 0.35;
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

        requestAnimationFrame(animateCursor);
      }
      requestAnimationFrame(animateCursor);

      // Hide default cursor
      document.documentElement.classList.add('custom-cursor');
    }
  }

  // ── 2. MAGNETIC BUTTON EFFECT ─────────────────────────────────────────────
  if (!isTouchDevice && !prefersReducedMotion) {
    const magneticEls = document.querySelectorAll('[data-magnetic]');
    magneticEls.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = parseFloat(el.dataset.magnetic) || 0.3;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        setTimeout(() => { el.style.transition = ''; }, 400);
      });
    });
  }

  // ── 3. 3D TILT EFFECT ON CARDS ────────────────────────────────────────────
  if (!isTouchDevice && !prefersReducedMotion) {
    function initTiltCards() {
      const tiltCards = document.querySelectorAll('.research-card, .project-card, .cert');
      tiltCards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -8;
          const rotateY = ((x - centerX) / centerX) * 8;

          card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

          // Move inner glow
          const glowEl = card.querySelector('.card-glow');
          if (glowEl) {
            glowEl.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(47, 111, 237, 0.12) 0%, transparent 60%)`;
          }
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          card.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
          const glowEl = card.querySelector('.card-glow');
          if (glowEl) glowEl.style.background = 'transparent';
          setTimeout(() => { card.style.transition = ''; }, 500);
        });
      });
    }

    // Initialize after DOM content is ready, and re-init after API renders new cards
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initTiltCards, 1500); // After API data renders
    });
    window.initTiltCards = initTiltCards;
  }

  // ── 4. PAGE TRANSITION OVERLAY ────────────────────────────────────────────
  const transitionOverlay = document.getElementById('pageTransitionOverlay');
  if (transitionOverlay && !prefersReducedMotion) {
    // Intercept internal navigation links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      // Only intercept internal page navigation (not anchors, external links, or javascript:)
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (link.target === '_blank') return;
      if (href.startsWith('http') && !href.includes(window.location.hostname)) return;

      e.preventDefault();
      transitionOverlay.classList.add('active');

      setTimeout(() => {
        window.location.href = href;
      }, 450);
    });

    // Remove overlay on page show (back/forward navigation)
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        transitionOverlay.classList.remove('active');
      }
    });

    // Also remove on initial load
    window.addEventListener('load', () => {
      transitionOverlay.classList.remove('active');
    });
  }

  // ── 5. HERO PARTICLE CANVAS ───────────────────────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('heroParticles');
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId = null;
    let isVisible = true;

    function resize() {
      const hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 12000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
        });
      }
    }

    function drawParticles() {
      if (!isVisible) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const particleColor = isDark ? '120, 169, 255' : '47, 111, 237';
      const lineColor = isDark ? '120, 169, 255' : '47, 111, 237';

      particles.forEach((p, i) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${p.alpha})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${lineColor}, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(drawParticles);
    }

    // Visibility observer — pause when off-screen
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animId) {
          animId = requestAnimationFrame(drawParticles);
        }
        if (!isVisible && animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      });
    }, { threshold: 0.1 });

    observer.observe(canvas.parentElement);

    resize();
    createParticles();
    drawParticles();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }

  document.addEventListener('DOMContentLoaded', initParticles);

  // ── 6. TYPEWRITER EFFECT ──────────────────────────────────────────────────
  function initTypewriter() {
    const el = document.getElementById('typewriterText');
    if (!el || prefersReducedMotion) return;

    const phrases = [
      'Computer Vision & AI',
      'Deep Learning',
      'Medical Image Analysis',
      'Explainable AI',
      'Trustworthy AI Systems',
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;

    function type() {
      const current = phrases[phraseIndex];

      if (!isDeleting) {
        el.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          isPaused = true;
          setTimeout(() => {
            isPaused = false;
            isDeleting = true;
            type();
          }, 2200);
          return;
        }
      } else {
        el.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }

      const speed = isDeleting ? 40 : 80;
      setTimeout(type, speed);
    }

    // Start after a brief delay
    setTimeout(type, 1000);
  }

  document.addEventListener('DOMContentLoaded', initTypewriter);
  window.initTypewriter = initTypewriter;

  // ── 7. SCROLL PROGRESS INDICATOR ──────────────────────────────────────────
  function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  document.addEventListener('DOMContentLoaded', initScrollProgress);

  // ── 8. STAGGERED INTERSECTION OBSERVER ────────────────────────────────────
  function initStaggerObserver() {
    const staggerContainers = document.querySelectorAll('[data-stagger-parent]');
    if (!staggerContainers.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const children = entry.target.querySelectorAll('.stagger-item');
          children.forEach((child, i) => {
            child.style.transitionDelay = `${i * 0.08}s`;
            child.classList.add('stagger-visible');
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    staggerContainers.forEach((c) => observer.observe(c));
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initStaggerObserver, 1600);
  });
  window.initStaggerObserver = initStaggerObserver;

})();
