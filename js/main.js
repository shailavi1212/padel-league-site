/* ============================================
   PADEL LEAGUE - Main JavaScript
   ============================================ */

// ---- Navbar Scroll Effect ----
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ---- Mobile Menu Toggle ----
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ---- Active Nav Link ----
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
setActiveNav();

// ---- Reveal on Scroll (Intersection Observer) ----
const revealElements = document.querySelectorAll('.reveal');
if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));
}

// ---- Counter Animation ----
function animateCounters() {
  document.querySelectorAll('.counter').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(start + (target - start) * eased);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    requestAnimationFrame(updateCounter);
  });
}

// Trigger counter animation when hero-stats is visible
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statsObserver.observe(heroStats);
}

// ---- FAQ Toggle ----
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.parentElement;
    // Close others
    document.querySelectorAll('.faq-item').forEach(other => {
      if (other !== item) other.classList.remove('open');
    });
    item.classList.toggle('open');
  });
});

// ---- Tab Switching (generic) ----
function initTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const buttons = container.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.getAttribute('data-group') || btn.getAttribute('data-tab');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Dispatch custom event
      container.dispatchEvent(new CustomEvent('tabChange', { detail: { group } }));
    });
  });
}

// ---- Smooth page transitions ----
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (href && href.endsWith('.html') && !href.startsWith('http')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.remove('loaded');
      setTimeout(() => {
        window.location.href = href;
      }, 250);
    });
  }
});

// Fade in on page load
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.add('loaded');
  });
});
