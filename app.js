/* Align: checklist app */
(function () {
  'use strict';
  const P = window.Plan;
  const KEY = 'align.v1';
  const MAXW = 60;

  const DEFAULT = { v: 1, start: '2026-11-02', checks: {}, ui: { w: null, d: null } };
  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return { ...DEFAULT, ...s, checks: s.checks || {}, ui: { ...DEFAULT.ui, ...(s.ui || {}) } };
      }
    } catch (e) { /* fall through */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ }
  }

  /* ---------- dates ---------- */
  function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function addDays(dt, n) { const x = new Date(dt); x.setDate(x.getDate() + n); return x; }
  function sessionDate(w, d) { return addDays(parseDate(S.start), (w - 1) * 7 + d); }
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDay = (dt) => MON[dt.getMonth()] + ' ' + dt.getDate();
  const fmtRange = (a, b) => (a.getMonth() === b.getMonth() ? MON[a.getMonth()] + ' ' + a.getDate() + '\u2013' + b.getDate() : fmtDay(a) + ' \u2013 ' + fmtDay(b));
  function todayPos() {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((t - parseDate(S.start)) / 86400000);
    if (diff < 0) return { w: 1, d: 0 };
    return { w: Math.min(MAXW, Math.floor(diff / 7) + 1), d: diff % 7 };
  }
  function nextTraining(w, d) {
    for (let i = 0; i < 21; i++) {
      const idx = w * 7 + d + i - 7;
      const ww = Math.floor(idx / 7) + 1, dd = idx % 7;
      if (ww > MAXW) break;
      if (P.session(ww, dd)) return { w: ww, d: dd };
    }
    return null;
  }

  /* ---------- helpers ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function svg(path, size, sw) {
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('width', size);
    el.setAttribute('height', size);
    el.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', path);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', sw || 2.4);
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    el.append(p);
    return el;
  }
  const chevL = () => svg('M15 5l-7 7 7 7', 22, 2.4);
  const chevR = () => svg('M9 5l7 7-7 7', 22, 2.4);
  const tick = () => svg('M5 12.5l4.5 4.5L19 7.5', 18, 3);

  const GROUPS = { wu: 'Warm-up', str: 'Posture and core', mob: 'Mobility', test: 'Tests' };

  /* ---------- state helpers ---------- */
  function checked(sess) {
    const c = S.checks[sess.id] || {};
    return sess.items.filter((it) => c[it.id]).length;
  }
  function toggle(sess, it) {
    const c = S.checks[sess.id] || (S.checks[sess.id] = {});
    if (c[it.id]) delete c[it.id]; else c[it.id] = 1;
    if (!Object.keys(c).length) delete S.checks[sess.id];
    save();
    render(true);
  }
  function reset(sess) {
    delete S.checks[sess.id];
    save();
    render(true);
  }

  function current() {
    let { w, d } = S.ui;
    if (w == null || d == null) {
      const t = todayPos();
      w = t.w; d = t.d;
      if (!P.session(w, d)) {
        const n = nextTraining(w, d);
        if (n) { w = n.w; d = n.d; }
      }
      S.ui.w = w; S.ui.d = d;
    }
    return { w, d };
  }
  function go(w, d) {
    S.ui.w = Math.max(1, Math.min(MAXW, w));
    S.ui.d = d;
    save();
    render();
    window.scrollTo(0, 0);
  }
  function stepWeek(n) {
    const { w, d } = current();
    const nw = Math.max(1, Math.min(MAXW, w + n));
    if (nw === w) return;
    go(nw, d);
  }

  /* ---------- render ---------- */
  function render(keepScroll) {
    const y = window.scrollY;
    const { w, d } = current();
    const wi = P.weekInfo(w);
    const sess = P.session(w, d);
    const root = document.getElementById('app');
    const mainEl = main(w, d, wi, sess);
    mainEl.className = sess && sess.test ? 'test' : wi.cls;
    const headEl = header(w, d, wi);
    headEl.classList.add(wi.cls);
    root.className = '';
    root.replaceChildren(headEl, mainEl);
    if (keepScroll) window.scrollTo(0, y);
  }

  function header(w, d, wi) {
    const t = todayPos();
    const first = sessionDate(w, 0), last = sessionDate(w, 6);
    const isNow = t.w === w && t.d === d;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const s = P.session(w, i);
      const done = s ? checked(s) : 0;
      const p = s ? Math.round((done / s.items.length) * 100) : 0;
      const cl = ['day'];
      if (!s) cl.push('rest');
      if (s && done === s.items.length) cl.push('full');
      if (i === d) cl.push('on');
      if (t.w === w && t.d === i) cl.push('today');
      days.push(h('button', {
        class: cl.join(' '), 'aria-label': P.DAYS[i] + ' ' + fmtDay(sessionDate(w, i)) + (s ? ', ' + s.title : ', rest'),
        'aria-pressed': i === d ? 'true' : 'false', onclick: () => go(w, i),
        style: s && s.test ? '--ph:var(--test)' : null,
      },
        h('span', { class: 'day-n' }, P.DAYS[i]),
        h('span', { class: 'day-ring', style: '--p:' + p }, h('span', null, sessionDate(w, i).getDate()))));
    }
    return h('header', { class: 'top' },
      h('div', { class: 'wk-row' },
        h('button', { class: 'nav', 'aria-label': 'Previous week', onclick: () => stepWeek(-1), disabled: w <= 1 }, chevL()),
        h('div', { class: 'wk' },
          h('div', { class: 'wk-num' }, 'Week ' + w),
          h('div', { class: 'wk-sub' },
            h('span', { class: 'blk' }, wi.name),
            wi.test ? h('span', { class: 'tag' }, 'Test week') : null,
            h('span', { class: 'wk-range' }, fmtDay(first) + ' – ' + fmtDay(last)))),
        h('button', { class: 'today-btn', onclick: () => { S.ui.w = null; S.ui.d = null; save(); render(); window.scrollTo(0, 0); }, disabled: isNow }, 'Today'),
        h('button', { class: 'nav', 'aria-label': 'Next week', onclick: () => stepWeek(1), disabled: w >= MAXW }, chevR())),
      h('nav', { class: 'days', 'aria-label': 'Days' }, days));
  }

  function main(w, d, wi, sess) {
    if (!sess) {
      const nx = nextTraining(w, d);
      return h('main', null,
        h('div', { class: 'rest-card' },
          h('h2', null, w === 1 ? 'Starts ' + fmtDay(sessionDate(2, 1)) : 'Rest day'),
          nx ? h('button', { class: 'go', onclick: () => go(nx.w, nx.d) }, 'Next: ' + P.DAYS[nx.d] + ' ' + fmtDay(sessionDate(nx.w, nx.d))) : null));
    }
    const c = S.checks[sess.id] || {};
    const done = checked(sess);
    const all = done === sess.items.length;
    const rows = [];
    let lastK = null;
    let cur = null;
    for (const it of sess.items) {
      if (it.k !== lastK) {
        rows.push(h('div', { class: 'group' }, GROUPS[it.k]));
        cur = h('div', { class: 'list' });
        rows.push(cur);
        lastK = it.k;
      }
      const on = !!c[it.id];
      cur.append(h('button', { class: 'row' + (on ? ' done' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => toggle(sess, it) },
        h('span', { class: 'box' }, tick()),
        h('span', { class: 'body' },
          h('span', { class: 'line' }, h('span', { class: 'name' }, it.name), it.dose ? h('span', { class: 'dose' }, it.dose) : null),
          h('span', { class: 'cue', style: 'display:block' }, it.cue))));
    }
    return h('main', null,
      h('div', { class: 'sess-head' },
        h('div', null,
          h('h1', null, sess.title),
          h('p', { class: 'sess-meta' }, P.DAYS[d] + ' ' + fmtDay(sessionDate(w, d)) + ' · ' + sess.min + ' min · ' + done + '/' + sess.items.length)),
        done ? h('button', { class: 'reset', onclick: () => reset(sess) }, 'Reset') : null),
      rows,
      all ? h('div', { class: 'done-banner' }, 'Done') : null);
  }

  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
