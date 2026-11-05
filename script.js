document.documentElement.classList.add('js');
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Kurse and Projekte: a link to one topic opens the page at the top, then glides slowly down to the card,
// which wiggles once it has arrived (its outline comes from CSS :target).
if (document.querySelector('.topics')) {
  history.scrollRestoration = 'manual';
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let glide = 0;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  function wiggle(card) {
    card.classList.remove('picked');
    void card.offsetWidth;   // restart the animation when the same card is picked again
    card.classList.add('picked');
  }
  function showTopic() {
    const card = document.querySelector('.topics li:target');
    if (!card) return;
    cancelAnimationFrame(glide);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const box = card.getBoundingClientRect();
    const end = Math.max(0, Math.min(box.top + window.scrollY - (window.innerHeight - box.height) / 2,
      document.documentElement.scrollHeight - window.innerHeight));
    if (still || end < 40) {   // already in view from the top, or the visitor prefers no motion
      if (still) window.scrollTo({ top: end, behavior: 'instant' });
      wiggle(card);
      return;
    }
    const duration = Math.min(2200, 1200 + end * 0.7);   // longer way, a little longer glide
    let start = null;
    setTimeout(() => {
      const step = (now) => {
        start ??= now;
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo({ top: end * ease(t), behavior: 'instant' });
        if (t < 1) glide = requestAnimationFrame(step);
        else wiggle(card);
      };
      glide = requestAnimationFrame(step);
    }, 700);   // a short moment at the top first
  }
  window.addEventListener('load', showTopic);
  window.addEventListener('hashchange', showTopic);
  // Clicking the link of the card that is already chosen changes no hash; glide again anyway.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href);
    if (url.pathname === location.pathname && url.hash && url.hash === location.hash) {
      event.preventDefault();
      showTopic();
    }
  });
  // The browser jumps to the card before the page has loaded; go back to the top straight away.
  if (document.querySelector('.topics li:target')) window.scrollTo({ top: 0, behavior: 'instant' });
}

// Phone menu
const toggle = document.querySelector('.menu-toggle');
const links = document.getElementById('navigation');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.textContent = open ? 'Schließen' : 'Menü';
});
// Dropdowns: the arrow button opens a group (tap, click or keyboard); on wide screens hover opens it too (CSS).
const groups = [...document.querySelectorAll('.nav-group')];
function closeGroups(except) {
  groups.forEach((group) => {
    if (group === except) return;
    group.classList.remove('open');
    group.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false');
  });
}
groups.forEach((group) => {
  const button = group.querySelector('.sub-toggle');
  button.addEventListener('click', () => {
    const open = group.classList.toggle('open');
    button.setAttribute('aria-expanded', open);
    closeGroups(group);
  });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-group')) closeGroups();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openGroup = groups.find((group) => group.classList.contains('open') || group.contains(document.activeElement));
  closeGroups();
  if (openGroup) { openGroup.querySelector('.sub-toggle').focus(); return; }
  if (links.classList.contains('open')) { toggle.click(); toggle.focus(); }
});
links.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  closeGroups();
  document.activeElement.blur();   // otherwise the hovered/focused dropdown stays open after the jump
  if (links.classList.contains('open')) toggle.click();
});

// Header shrinks on scroll; the leaf rides the reading-progress bar.
const header = document.querySelector('.header');
const progress = document.querySelector('.progress');
const leaf = document.querySelector('.progress-leaf');
let ticking = false;
function onScroll() {
  ticking = false;
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 20);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, y / max) : 0;
  progress.style.transform = `scaleX(${ratio})`;
  leaf.style.left = `${ratio * 100}%`;
  leaf.style.opacity = ratio > 0.01 ? '1' : '0';
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

// Subjects: language rows show the next phrase each time they open.
const rows = [...document.querySelectorAll('.subject')];
const nextPhrase = new Map();
rows.forEach((row) => {
  const bubble = row.querySelector('.bubble');
  if (!bubble) return;
  const phrases = bubble.dataset.phrases.split('|');
  let i = 1;
  nextPhrase.set(row, () => { bubble.textContent = phrases[i++ % phrases.length]; });
  row.addEventListener('mouseleave', nextPhrase.get(row));
});
// Phones have no hover: the row in the middle of the screen opens instead.
if (window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
  const middle = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.classList.contains('is-active')) return;
      rows.forEach((row) => {
        if (row.classList.contains('is-active')) nextPhrase.get(row)?.();
        row.classList.toggle('is-active', row === entry.target);
      });
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  rows.forEach((row) => middle.observe(row));
}

if (!calm && 'IntersectionObserver' in window) {
  // Blocks fade in as they come into view; siblings follow one after another.
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      seen.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.max(0, siblings.indexOf(el)) * 0.1}s`);
    seen.observe(el);
  });

  // Section headings: words slide up line by line.
  const headingSeen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('lines-in');
      headingSeen.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  const fontReady = Promise.race([document.fonts.load('600 1em Lexend'), new Promise((r) => setTimeout(r, 800))]);
  document.querySelectorAll('main h2:not(.legal h2):not(.topics h2)').forEach((heading) => {
    heading.setAttribute('aria-label', heading.textContent);
    const words = heading.textContent.split(/\s+/).filter(Boolean);
    heading.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><i>${w.replace(/&/g, '&amp;')}</i></span>`).join(' ');
    fontReady.finally(() => {
      let line = -1;
      let top = null;
      heading.querySelectorAll('.w').forEach((word) => {
        if (top === null || Math.abs(word.offsetTop - top) > 4) { line++; top = word.offsetTop; }
        word.style.setProperty('--wd', `${line * 0.12}s`);
      });
      headingSeen.observe(heading);
    });
  });
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
}

// "Coming soon": colour in the notebook squares one by one, pause when all are full, start again.
const squares = document.querySelector('.soon-squares');
if (squares && !calm) {
  const boxes = [...squares.children];
  let lit = 0;
  setInterval(() => {
    lit = lit >= boxes.length + 4 ? 0 : lit + 1;   // four extra steps keep the row full for a short pause
    boxes.forEach((box, i) => box.classList.toggle('on', i < lit));
  }, 320);
}

// Contact form: kontakt.php on the server expects the fields as JSON and sends the request by email.
const form = document.querySelector('.form');
if (form) {
  const say = {
    de: { sending: 'Wird gesendet …', sent: 'Vielen Dank! Deine Anfrage ist bei uns angekommen.', failed: 'Das hat leider nicht geklappt. Bitte versuche es später erneut oder schreib uns eine E-Mail.', preview: 'Das ist eine Vorschau: Hier werden keine Anfragen gesendet.' },
    tr: { sending: 'Gönderiliyor …', sent: 'Teşekkürler! Talebin bize ulaştı.', failed: 'Maalesef olmadı. Lütfen daha sonra tekrar dene ya da bize e-posta yaz.', preview: 'Bu bir önizleme: Buradan talep gönderilmez.' },
    en: { sending: 'Sending …', sent: 'Thank you! We have received your request.', failed: 'Sorry, that didn’t work. Please try again later or send us an email.', preview: 'This is a preview: no requests are sent from here.' },
  }[document.documentElement.lang] ?? {};
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // The preview copy (GitHub Pages, no PHP) marks the form with data-preview and sends nothing.
    if ('preview' in form.dataset) { status.textContent = say.preview; return; }
    const data = {};   // several subjects become one readable value
    new FormData(form).forEach((value, key) => { data[key] = data[key] ? `${data[key]}, ${value}` : value; });
    button.disabled = true;
    status.textContent = say.sending;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(response.statusText);
      form.reset();
      status.textContent = say.sent;
    } catch {
      status.textContent = say.failed;   // the entered details stay, nothing has to be typed again
    } finally {
      button.disabled = false;
    }
  });
}
