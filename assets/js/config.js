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
  
  window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  }, { passive: true });
});
