const API_BASE = 'https://portfolio-backend-u.vercel.app/api';

function getAdminUrl() {
  return API_BASE.replace(/\/api\/?$/, '') + '/admin';
}

function getCvDownloadUrl() {
  return API_BASE + '/cv/download';
}

// Smart Scroll Navbar Logic
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      navbar.classList.add('navbar-hidden');
    } else {
      navbar.classList.remove('navbar-hidden');
    }
    
    lastScrollTop = Math.max(0, scrollTop);
  }, { passive: true });
});
