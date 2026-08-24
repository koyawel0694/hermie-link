/* Link-in-bio page behavior: live status chip + stats from the public
   office feed, scroll reveals, copy-email button. No page names or
   server identifiers are ever read or shown. */

'use strict';

const STATUS_URL = 'https://noypinews.blog/office-status.json';

/* ---------- live status (generic counts only) ---------- */
function setLoading() {
  const t = document.getElementById('status-text');
  if (t) t.textContent = 'checking the farm...';
}

async function refreshStatus() {
  try {
    const r = await fetch(STATUS_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const d = await r.json();
    renderStatus(d);
  } catch (e) {
    // keep the default text; the farm is real even if the fetch fails
    const t = document.getElementById('status-text');
    if (t) t.textContent = 'running on the VPS right now';
  }
}

function renderStatus(d) {
  const chip = document.getElementById('status');
  const txt = document.getElementById('status-text');
  const dot = chip ? chip.querySelector('.dot') : null;

  const gatewayUp = d && d.gateway && d.gateway.state === 'running';
  if (txt) {
    if (gatewayUp) {
      const online = d.bots ? d.bots.online : 0;
      const total = d.bots ? d.bots.total : 0;
      txt.textContent = total
        ? 'running now · ' + online + ' of ' + total + ' pages live'
        : 'running on the VPS right now';
    } else {
      txt.textContent = 'systems are waking up, check back soon';
    }
  }
  if (dot) dot.classList.toggle('amber', !gatewayUp);

  // stats
  const b = document.getElementById('stat-bots');
  if (b && d && d.bots) b.textContent = d.bots.online + '/' + d.bots.total;
  const j = document.getElementById('stat-jobs');
  if (j && d && d.crons) j.textContent = d.crons.enabled;
  const u = document.getElementById('stat-up');
  if (u && d && d.uptimeH) u.textContent = Math.round(d.uptimeH);

  const note = document.getElementById('live-note');
  if (note) note.textContent = 'Numbers above come straight from the server.';
}

/* ---------- scroll reveal (non-blocking) ---------- */
function setupReveals() {
  const els = Array.from(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

/* ---------- copy email ---------- */
function setupCopy() {
  const btn = document.getElementById('copy-email');
  const hint = document.getElementById('copy-hint');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const email = 'daywithjohn@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
      if (hint) { hint.hidden = false; setTimeout(() => { hint.hidden = true; }, 2600); }
    } catch (e) {
      // clipboard may be blocked; fall back to selection
      const r = document.createRange();
      const a = document.createElement('a');
      a.href = 'mailto:' + email; a.textContent = email;
      document.body.appendChild(a); r.selectNode(a);
      try { window.getSelection().removeAllRanges(); window.getSelection().addRange(r); } catch (_) {}
      if (hint) { hint.hidden = false; hint.textContent = 'Email is ' + email; }
    }
  });
}

/* ---------- year ---------- */
function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  setupReveals();
  setupCopy();
  setLoading();
  refreshStatus();
  setInterval(refreshStatus, 60000);
});
