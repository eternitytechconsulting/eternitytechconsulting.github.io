// Page navigation
function showPage(id) {
  const target = document.getElementById(id);
  if (!target) return;
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('show', page.id === id));
  document.querySelectorAll('.tab-btn').forEach(button => {
    const active = button.dataset.page === id;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Responsive navigation
function toggleMenu() {
  const nav = document.getElementById('mainNav');
  const button = document.querySelector('.menu-toggle');
  const isOpen = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', String(isOpen));
  button.textContent = isOpen ? '×' : '☰';
}
function closeMenu() {
  const nav = document.getElementById('mainNav');
  const button = document.querySelector('.menu-toggle');
  nav.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
  button.textContent = '☰';
}

// Expand/collapse premium SOP descriptions
function toggleDetails(button) {
  const details = button.nextElementSibling;
  if (!details) return;
  const isOpen = details.classList.toggle('open');
  button.textContent = isOpen ? 'Hide details −' : 'View details +';
  button.setAttribute('aria-expanded', String(isOpen));
}

// Countdown to the published SAP Business Suite 7 mainstream-maintenance date.
// The target is a general milestone, not a statement about every SAP product/release.
function updateCountdown() {
  const target = new Date('2028-01-01T00:00:00+05:30'); // End of 31 Dec 2027, India time
  const remaining = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value).padStart(2, '0');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
