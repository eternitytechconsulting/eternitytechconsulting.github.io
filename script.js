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
  // Save the current section in the URL so a refresh keeps it
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
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
  if (!nav || !button) return;
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
function updateCountdown() {
  const target = new Date('2028-01-01T00:00:00+05:30');
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
  // Open the section named in the URL (for example #sop), or Home if there is none
  const fromUrl = location.hash.slice(1);
  const startPage = document.getElementById(fromUrl)?.classList.contains('page') ? fromUrl : 'home';
  showPage(startPage);

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

// ---------------------------------------------------------------
// Animated transparent dot-network background for the hero section
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
  hero.style.overflow = 'hidden';
  hero.style.isolation = 'isolate';

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '-1', background: 'transparent'
  });
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  const labels = ['SAP S/4HANA', 'SAP BTP', 'AI', 'Cloud', 'Automation', 'Enterprise Apps', 'HANA DB', 'Linux'];
  const LINK_DISTANCE = 150;
  let width = 0, height = 0, nodes = [];

  function createNodes() {
    const count = Math.min(60, Math.floor((width * height) / 16000));
    nodes = Array.from({ length: count }, (_, i) => {
      const isHub = i < labels.length;
      return {
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        hub: isHub, label: isHub ? labels[i] : null, phase: Math.random() * Math.PI * 2
      };
    });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createNodes();
  }

  function update() {
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
      n.phase += 0.02;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DISTANCE) {
          ctx.strokeStyle = `rgba(90, 160, 255, ${0.35 * (1 - d / LINK_DISTANCE)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach(n => {
      if (n.hub) {
        const pulse = 1 + Math.sin(n.phase) * 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 9 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 200, 230, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 220, 240, 0.95)';
        ctx.shadowColor = 'rgba(0, 220, 240, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(170, 190, 210, 0.7)';
        ctx.fillText(n.label, n.x - ctx.measureText(n.label).width / 2, n.y + 22);
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 190, 255, 0.6)';
        ctx.fill();
      }
    });
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  resize();
  loop();
});

/* ======================================
   LIVE SAP CAREER EXPERIENCE COUNTER + GRAPH MARKER
   Career start: 02 November 2023
====================================== */
function updateCareerExperience() {
  const start = new Date(2023, 10, 2);
  const graphEnd = new Date(2028, 0, 1);
  const now = new Date();

  // Years / months / days since the start date
  if (now >= start) {
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months--;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); // days in previous month
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const y = document.getElementById('careerYears');
    const m = document.getElementById('careerMonths');
    const d = document.getElementById('careerDays');
    if (y) y.textContent = years;
    if (m) m.textContent = months;
    if (d) d.textContent = days;
  }

  // Move the marker along the graph line according to today's date
  const path = document.getElementById('careerGrowthPath');
  const marker = document.getElementById('careerNowPoint');
  if (!path || !marker) return;

  const totalLength = path.getTotalLength();
  if (!totalLength) return; // tab hidden; it will run again when the tab opens

  const progress = Math.max(0, Math.min(1, (now - start) / (graphEnd - start)));
  const X_START = 35, X_END = 490;               // graph start and end on the x-axis
  const targetX = X_START + progress * (X_END - X_START);

  // Find the point on the line that matches the date position
  let low = 0, high = totalLength;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (path.getPointAtLength(mid).x < targetX) low = mid; else high = mid;
  }
  const point = path.getPointAtLength(high);
  marker.setAttribute('cx', point.x);
  marker.setAttribute('cy', point.y);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCareerExperience();
  setInterval(updateCareerExperience, 60000);

  // Recalculate when the Experience tab is opened
  document.addEventListener('click', e => {
    if (e.target.closest('.tab-btn, .text-link, .btn')) {
      setTimeout(updateCareerExperience, 80);
    }
  });
});



/* ======================================
   SAP LIBRARY SEARCH + CATEGORY FILTER
====================================== */

let currentLibraryCategory = 'all';

function filterLibrary() {
  const search = document.getElementById('librarySearch');
  const cards = document.querySelectorAll('.library-document-card');
  const noResults = document.getElementById('libraryNoResults');

  if (!search) return;

  const query = search.value.toLowerCase().trim();
  let visibleCount = 0;

  cards.forEach(card => {
    const categories = (card.dataset.category || '').split(' ');
    const text = (card.dataset.search || '') + ' ' + card.innerText;
    const matchesSearch = text.toLowerCase().includes(query);
    const matchesCategory =
      currentLibraryCategory === 'all' ||
      categories.includes(currentLibraryCategory);

    const visible = matchesSearch && matchesCategory;
    card.style.display = visible ? 'flex' : 'none';

    if (visible) visibleCount++;
  });

  if (noResults) {
    noResults.hidden = visibleCount !== 0;
  }
}

function setLibraryFilter(category, button) {
  currentLibraryCategory = category;

  document.querySelectorAll('.library-filter').forEach(filter => {
    filter.classList.remove('active');
  });

  if (button) button.classList.add('active');

  filterLibrary();
}
