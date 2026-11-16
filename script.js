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

// ---------------------------------------------------------------
// Experience tab: up/down moving dots + animated graph on the right
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('experience');
  if (!section) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Background canvas (behind the content)
  const bg = document.createElement('canvas');
  bg.className = 'exp-bg';
  bg.setAttribute('aria-hidden', 'true');
  section.prepend(bg);

  // Side panel with graph canvas (added at the end, CSS places it on the right)
  const side = document.createElement('aside');
  side.className = 'exp-side';
  side.setAttribute('aria-hidden', 'true');
  const graph = document.createElement('canvas');
  graph.className = 'exp-graph';
  side.appendChild(graph);
  section.appendChild(side);

  const bgCtx = bg.getContext('2d');
  const gCtx = graph.getContext('2d');
  let w = 0, h = 0, gw = 0, gh = 0, dots = [];
  let startTime = performance.now();

  // Edit these values (0 to 1) to match your focus areas
  const bars = [
    { label: 'ECC', value: 0.72 },
    { label: 'S/4HANA', value: 0.88 },
    { label: 'HANA DB', value: 0.80 },
    { label: 'Linux', value: 0.66 },
    { label: 'Monitoring', value: 0.84 },
    { label: 'Upgrades', value: 0.76 }
  ];

  function setupCanvas(canvas, ctx, width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resizeAll() {
    w = section.clientWidth;
    h = section.clientHeight;
    gw = graph.clientWidth;
    gh = graph.clientHeight;
    if (!w || !h || !gw || !gh) return; // section is hidden
    setupCanvas(bg, bgCtx, w, h);
    setupCanvas(graph, gCtx, gw, gh);
    const count = Math.min(70, Math.floor((w * h) / 14000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 0.25 + Math.random() * 0.6,
      dir: Math.random() < 0.5 ? -1 : 1,
      r: 1.2 + Math.random() * 1.6
    }));
  }

  function moveDots() {
    dots.forEach(d => {
      d.y += d.speed * d.dir;
      if (d.y < 0) { d.y = 0; d.dir = 1; }
      if (d.y > h) { d.y = h; d.dir = -1; }
    });
  }

  function drawBg() {
    bgCtx.clearRect(0, 0, w, h);
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          bgCtx.strokeStyle = `rgba(23, 105, 170, ${0.25 * (1 - d / 130)})`;
          bgCtx.lineWidth = 1;
          bgCtx.beginPath();
          bgCtx.moveTo(a.x, a.y);
          bgCtx.lineTo(b.x, b.y);
          bgCtx.stroke();
        }
      }
    }
    dots.forEach(d => {
      bgCtx.beginPath();
      bgCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      bgCtx.fillStyle = 'rgba(23, 105, 170, 0.5)';
      bgCtx.fill();
    });
  }

  function drawGraph(now) {
    const t = (now - startTime) / 1000;
    gCtx.clearRect(0, 0, gw, gh);
    gCtx.fillStyle = '#9db0c9';
    gCtx.font = '600 11px system-ui, sans-serif';
    gCtx.fillText('FOCUS AREAS', 16, 26);

    const left = 16 + 84;
    const barMax = gw - 16 - left;
    const rowTop = 50;
    const rowH = (gh - rowTop - 14) / bars.length;

    bars.forEach((b, i) => {
      const cy = rowTop + rowH * i + rowH / 2;
      const grow = Math.min(1, Math.max(0, (t - i * 0.2) / 1.2));
      const ease = 1 - Math.pow(1 - grow, 3);
      const val = Math.min(1, b.value + Math.sin(t * 1.1 + i) * 0.025);
      const bw = barMax * val * ease;

      gCtx.fillStyle = '#c4d0e0';
      gCtx.font = '12px system-ui, sans-serif';
      gCtx.fillText(b.label, 16, cy + 4);

      gCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      gCtx.fillRect(left, cy - 5, barMax, 10);

      const grad = gCtx.createLinearGradient(left, 0, left + barMax, 0);
      grad.addColorStop(0, '#1769aa');
      grad.addColorStop(1, '#49b5d4');
      gCtx.fillStyle = grad;
      gCtx.fillRect(left, cy - 5, bw, 10);

      if (ease > 0.99) {
        gCtx.beginPath();
        gCtx.arc(left + bw, cy, 3 + Math.sin(t * 3 + i) * 1.5, 0, Math.PI * 2);
        gCtx.fillStyle = 'rgba(0, 220, 240, 0.95)';
        gCtx.shadowColor = 'rgba(0, 220, 240, 0.8)';
        gCtx.shadowBlur = 8;
        gCtx.fill();
        gCtx.shadowBlur = 0;
      }
    });
  }

  let wasVisible = false;
  function loop(now) {
    const visible = section.classList.contains('show');
    if (visible && !wasVisible) {   // tab just opened: measure and restart bar growth
      resizeAll();
      startTime = now;
    }
    wasVisible = visible;
    if (visible && w && gw && dots.length) {
      moveDots();
      drawBg();
      drawGraph(now);
    }
    requestAnimationFrame(loop);
  }

  if ('ResizeObserver' in window) new ResizeObserver(resizeAll).observe(section);
  requestAnimationFrame(loop);
});
