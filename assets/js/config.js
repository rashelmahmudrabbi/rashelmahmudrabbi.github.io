window.API_BASE = window.API_BASE || 'https://portfolio-backend-u.vercel.app/api';
var API_BASE = window.API_BASE;

function getCvDownloadUrl() {
  return 'https://drive.google.com/file/d/1ezs8hs6v_8_XickPu8nDRnsOSmf9bYvE/view?usp=sharing';
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
