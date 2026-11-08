/* Align: 24-week posture, posterior chain, hip and ankle plan. Pure functions, no DOM. */
(function (root) {
  'use strict';

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const BLOCKS = {
    1: { name: 'Foundation', cls: 'b1' },
    2: { name: 'Load', cls: 'b2' },
    3: { name: 'Control', cls: 'b3' },
    4: { name: 'Maintain', cls: 'b3' },
  };
  const WEEKS = 24;
  const TRAIN = { 1: 'A', 3: 'B', 5: 'C' };
  const MAINT = { 3: 'B', 5: 'C' };
  /* Test days follow the Phase calendar: Tue Nov 10, Sat Dec 26, Sat Feb 20, Sat Apr 17 */
  const TESTS = { '2-1': 1, '8-5': 1, '16-5': 1, '24-5': 1 };

  function weekInfo(w) {
    if (w > WEEKS) return { w, b: 4, wib: w - WEEKS, deload: false, test: false, name: BLOCKS[4].name, cls: BLOCKS[4].cls };
    const b = Math.ceil(w / 8);
    const wib = ((w - 1) % 8) + 1;
    return { w, b, wib, deload: wib === 8, test: wib === 8, name: BLOCKS[b].name, cls: BLOCKS[b].cls };
  }

  /* ---------- movement library ---------- */
  /* u: 's' hold seconds, 'r' reps. side: per side. rep: seconds per rep for the time estimate. */
  const M = {
    breath: { n: 'Breathing 90/90', c: 'On your back, feet on a wall, hips and knees at 90. Breathe in 4 s, out 6 s, ribs down.', u: 's', k: 'wu' },
    wallslide: { n: 'Wall Slide, Lift-off', c: 'Back and forearms on the wall, ribs down. Slide up, lift the forearms off at the top.', u: 'r', rep: 4, k: 'str' },
    prony: { n: 'Prone Y Raise', c: 'Chest down, thumbs up, arms in a Y. Lift from the shoulder blades, not the low back.', u: 'r', rep: 4, k: 'str' },
    pullapart: { n: 'Band Pull-apart', c: 'Arms straight at chest height. Pull the band apart, shoulder blades down and back.', u: 'r', rep: 3, k: 'str' },
    facepull: { n: 'Band Face Pull', c: 'Pull to the forehead with hands apart. Finish with the thumbs rotated back.', u: 'r', rep: 3, k: 'str' },
    pushplus1: { n: 'Incline Push-up Plus', c: 'At the top, push the surface away until the shoulder blades spread. Hold 1 s.', u: 'r', rep: 4, k: 'str' },
    pushplus2: { n: 'Push-up Plus', c: 'At the top, push the floor away until the shoulder blades spread. Hold 1 s.', u: 'r', rep: 4, k: 'str' },
    pushplus3: { n: 'Feet-elevated Push-up Plus', c: 'Feet on a bench. Push the floor away at the top until the shoulder blades spread.', u: 'r', rep: 4, k: 'str' },
    hplank1: { n: 'Hollowed Plank', c: 'Forearms down. Draw the belly in and up, ribs down, glutes tight. Stop when it sags.', u: 's', k: 'str' },
    hplank2: { n: 'Feet-elevated Hollowed Plank', c: 'Feet on a bench. Same hollow, ribs down, glutes tight. Stop when it sags.', u: 's', k: 'str' },
    tap: { n: 'Plank Shoulder Tap', c: 'Hands under shoulders, feet wide. Tap each shoulder without the hips rocking.', u: 'r', rep: 3, k: 'str' },
    sideplank: { n: 'Side Plank', c: 'Elbow under the shoulder, hips stacked, one line from head to feet.', u: 's', side: 1, k: 'str' },
    rplank1: { n: 'Reverse Plank, Knees Bent', c: 'Hands behind the hips, feet flat. Lift to a line from shoulders to knees. Shoulders down and back, chin tucked.', u: 's', k: 'str' },
    rplank2: { n: 'Reverse Plank', c: 'Hands behind the hips, legs straight, heels down. Lift to one line. Shoulders down and back, chin tucked.', u: 's', k: 'str' },
    rplank3: { n: 'Single-leg Reverse Plank', c: 'Reverse plank, then lift one leg to hip height without the hips dropping.', u: 's', side: 1, k: 'str' },
    chin: { n: 'Chin Tuck', c: 'Slide the head straight back, eyes level. Hold 5 s.', u: 'r', rep: 7, k: 'str', h5: 1 },
    bridge1: { n: 'Glute Bridge', c: 'Ribs down, drive through the heels, finish in a line from shoulders to knees.', u: 'r', rep: 4, k: 'str' },
    bridge2: { n: 'Single-leg Bridge', c: 'One foot up, ribs down, drive through the heel, hips level.', u: 'r', rep: 4, side: 1, k: 'str' },
    txext: { n: 'Thoracic Extension, Roller', c: 'Roller under the mid-back, hands behind the head. Extend over it one level at a time, ribs down.', u: 'r', rep: 5, k: 'str' },
    openbook: { n: 'Open Book', c: 'Side-lying, knees stacked. Rotate the top arm open and follow it with the eyes.', u: 'r', rep: 5, side: 1, k: 'str' },
    wallstand: { n: 'Wall Stand', c: 'Heels, hips, upper back and head touch the wall. Ribs down, chin tucked, three slow breaths.', u: 's', k: 'str' },
    pec: { n: 'Doorway Pec Stretch', c: 'Forearm on the frame, elbow at shoulder height. Step through until the chest opens.', u: 's', side: 1, k: 'mob' },
    hipflex: { n: 'Half-kneeling Hip Flexor', c: 'Back knee down, tuck the pelvis under, squeeze the back glute, lean forward an inch.', u: 's', side: 1, k: 'mob' },
    soleus: { n: 'Soleus Knee-to-wall', c: 'Heel down. Drive the knee over the toes toward the wall.', u: 's', side: 1, k: 'mob' },
    gastroc: { n: 'Gastroc Wall Stretch', c: 'Back leg straight, heel down, lean into the wall.', u: 's', side: 1, k: 'mob' },
    ham: { n: 'Strap Hamstring Contract-relax', c: 'On your back, leg up with a strap. Press into it for 5 s, relax, move deeper.', u: 's', side: 1, k: 'mob' },
    n9090: { n: '90/90 Hip', c: 'Sit tall over the front shin. Lean forward from the hip, then rotate to the back leg.', u: 's', side: 1, k: 'mob' },
    gsq: { n: 'Goblet Squat Hold', c: 'Heels down, elbows inside the knees. Sit in the bottom position.', u: 's', k: 'mob' },
    splitsq: { n: 'Split Squat Hold', c: 'Long stance, back knee low, front heel down. Hold the bottom.', u: 's', side: 1, k: 'mob' },
    cossack: { n: 'Cossack Squat', c: 'Wide stance. Sit into one hip, straight leg toes up, heel of the bent leg down.', u: 'r', rep: 5, side: 1, k: 'mob' },
    nordic: { n: 'Nordic Curl', c: 'Heels anchored. Lower as slowly as you can, catch with your hands.', u: 'r', rep: 7, k: 'mob' },
    heeldrop: { n: 'Heel Drop, Straight Knee', c: 'Toes on a step. Rise on two feet, lower on one for 3 s, full range.', u: 'r', rep: 4, side: 1, k: 'mob' },
    heeldropb: { n: 'Heel Drop, Bent Knee', c: 'Toes on a step, knee soft. Rise on two feet, lower on one for 3 s, full range.', u: 'r', rep: 4, side: 1, k: 'mob' },
    slr: { n: 'Active Straight-leg Raise Hold', c: 'On your back, lift one leg as high as it goes with the knee straight. Other leg flat.', u: 's', side: 1, k: 'mob' },
    hipext: { n: 'Half-kneeling Hip Extension Lift-off', c: 'Half-kneeling, pelvis tucked. Lift the back knee off the floor for 1 s.', u: 'r', rep: 4, side: 1, k: 'mob' },
    tlunge: { n: 'Test: Weight-bearing Lunge', c: 'Toes to the wall, knee to the wall, heel down. Move the foot back until you can just touch. Toe-to-wall distance, each side.', u: 't', t: 100, k: 'test' },
    take: { n: 'Test: Active Knee Extension', c: 'On your back, hip at 90. Straighten the knee without moving the thigh. Angle short of straight, each side.', u: 't', t: 100, k: 'test' },
    tthomas: { n: 'Test: Modified Thomas', c: 'On a bench, hug one knee to the chest. Does the other thigh rest level, knee at 90, each side.', u: 't', t: 90, k: 'test' },
    tsquat: { n: 'Test: Deep Squat', c: 'Feet shoulder width, arms forward. Heels down, chest up, hold 5 s. Note what limits you.', u: 't', t: 60, k: 'test' },
    twall: { n: 'Test: Wall Stand Gap', c: 'Heels and hips on the wall, relaxed. Distance from the back of the head to the wall.', u: 't', t: 60, k: 'test' },
    tplank: { n: 'Test: Hollowed Plank Hold', c: 'Max hold with the hollow. Stop at the first sag. Seconds.', u: 't', t: 90, k: 'test' },
    trplank: { n: 'Test: Reverse Plank Hold', c: 'Max hold, hips in line, shoulders down and back. Stop at the first sag. Seconds.', u: 't', t: 90, k: 'test' },
  };

  function mk(id, sets, v, extra) {
    const m = M[id];
    const it = { id, name: m.n, cue: m.c, k: m.k, u: m.u, side: !!m.side, sets, v };
    if (extra) Object.assign(it, extra);
    if (m.u === 't') { it.dose = ''; it.t = m.t; return it; }
    const sides = m.side ? 2 : 1;
    if (m.u === 's') {
      it.dose = id === 'breath' ? v + ' s' : sets + ' × ' + v + ' s' + (m.side ? ' each side' : '');
      it.t = id === 'breath' ? v : sets * sides * (v + 8);
    } else {
      it.dose = sets + ' × ' + v + (m.side ? ' each side' : '') + (m.h5 ? ' · 5 s hold' : '');
      it.t = sets * sides * (v * (m.rep || 3) + 12);
    }
    return it;
  }

  /* ---------- progression by block and week in block ---------- */
  const PRO = {
    1: { H: [0, 30, 30, 35, 35, 40, 40, 30], r: [10, 10, 10, 10, 12, 12, 12, 10], P: [20, 25, 25, 30, 30, 35, 35, 20] },
    2: { H: [40, 40, 40, 40, 40, 40, 40, 30], r: [10, 10, 12, 12, 12, 12, 12, 10], P: [30, 30, 35, 35, 40, 40, 45, 30] },
    3: { H: [60, 60, 60, 60, 60, 60, 60, 45], r: [10, 10, 10, 12, 12, 12, 12, 10], P: [35, 35, 40, 40, 45, 45, 50, 35] },
  };
  const NORDIC = [[1, 4], [2, 4], [2, 5], [2, 6], [2, 6], [2, 6], [2, 6], [1, 4]];
  const HEELDROP = [[2, 8], [2, 8], [2, 8], [2, 8], [2, 10], [2, 10], [2, 10], [1, 8]];

  function build(wi, slot) {
    const b = wi.b;
    const i = wi.wib - 1;
    const p = PRO[b] || PRO[3];
    const H = p.H[i], r = p.r[i], P = p.P[i];
    const ss = b === 3 ? 1 : 2;
    const pp = 'pushplus' + Math.min(b, 3), hp = b === 1 ? 'hplank1' : 'hplank2', rp = 'rplank' + Math.min(b, 3);
    const L = [];
    const add = (id, s, v, x) => L.push(mk(id, s, v, x));
    const mob = (id) => add(id, ss, H);
    const rp1 = (id) => add(id, 2, id === 'rplank3' ? Math.round(P * 0.7) : P);

    if (b === 1) {
      if (slot === 'A') {
        add('breath', 1, 45); add('wallslide', 2, r); add('prony', 2, r); add(hp, 2, P); rp1(rp); add('chin', 1, 6);
        mob('pec'); mob('hipflex'); mob('soleus');
      } else if (slot === 'B') {
        add('breath', 1, 45); add('pullapart', 2, r + 2); add(pp, 2, r - 2); add('sideplank', 1, P); add('bridge1', 2, r); add('txext', 1, 8);
        mob('ham'); mob('gastroc'); mob('n9090');
      } else {
        add('breath', 1, 45); add('wallslide', 2, r); add(hp, 2, P); rp1(rp); add('chin', 1, 6); add('openbook', 1, 8);
        const Hc = Math.min(H, 35);
        add('hipflex', ss, Hc); add('ham', ss, Hc); add('soleus', ss, Hc); add('gsq', 2, Hc + 10); add('wallstand', 1, 45);
      }
    } else if (b === 2) {
      const bent = i >= 4;
      if (slot === 'A') {
        add('breath', 1, 45); add('prony', 2, r); add('facepull', 2, r); add(hp, 2, P); rp1(rp); add('chin', 1, 6);
        mob('pec'); mob('splitsq');
        if (bent) add('heeldropb', 2, 8); else mob('soleus');
      } else if (slot === 'B') {
        add('breath', 1, 45); add(pp, 2, r - 2); add('sideplank', 1, P); add('bridge2', 2, r - 2); add('txext', 1, 8);
        mob('ham'); mob('gastroc'); add('cossack', 2, 6);
      } else {
        add('breath', 1, 45); add('prony', 2, r); add(hp, 2, P); rp1(rp); add('chin', 1, 6);
        mob('splitsq'); mob('ham');
        const nd = NORDIC[i]; add('nordic', nd[0], nd[1]);
        const hd = HEELDROP[i]; add('heeldrop', hd[0], hd[1]); add('wallstand', 1, 45);
      }
    } else if (b === 3) {
      if (slot === 'A') {
        add('breath', 1, 45); add('prony', 2, r); add('facepull', 2, r); add('tap', 2, 8); rp1('rplank3'); add('chin', 1, 6);
        mob('pec'); mob('hipflex'); mob('soleus'); add('hipext', 1, 6);
      } else if (slot === 'B') {
        add('breath', 1, 45); add(pp, 2, r - 2); add('sideplank', 1, P); add('bridge2', 2, r - 2); add('txext', 1, 8);
        mob('ham'); mob('gastroc'); mob('n9090'); add('slr', 1, 8);
      } else {
        add('breath', 1, 45); add('prony', 2, r); add(hp, 2, P); add('rplank3', 1, Math.round(P * 0.7));
        mob('hipflex'); mob('ham'); mob('splitsq'); add('slr', 2, 8);
        add('nordic', 2, 6); add('heeldrop', 2, 10); add('wallstand', 1, 45);
      }
    } else {
      /* Maintain: Thu and Sat, about 12 min */
      if (slot === 'B') {
        add('breath', 1, 45); add('prony', 2, 10); add('facepull', 2, 12); add('hplank2', 1, 40); add('rplank3', 1, 25);
        add('pec', 1, 60); add('hipflex', 1, 60); add('soleus', 1, 60);
      } else {
        add('breath', 1, 45); add('pushplus3', 2, 10); add('sideplank', 1, 40); add('bridge2', 1, 10); add('txext', 1, 8);
        add('ham', 1, 60); add('gastroc', 1, 60); add('n9090', 1, 60); add('wallstand', 1, 45);
      }
    }
    const ord = { wu: 0, str: 1, mob: 2, test: 1 };
    return L.map((x, n) => [x, n]).sort((p, q) => ord[p[0].k] - ord[q[0].k] || p[1] - q[1]).map((x) => x[0]);
  }

  function testSession() {
    const L = [mk('breath', 1, 45), mk('tlunge'), mk('take'), mk('tthomas'), mk('tsquat'), mk('twall'), mk('tplank'), mk('trplank')];
    L.push(mk('prony', 2, 10), mk('facepull', 2, 12), mk('chin', 1, 6));
    return L;
  }

  function minutes(items) { return Math.round(items.reduce((a, x) => a + x.t, 0) / 60); }

  /* d: 0 Mon .. 6 Sun. Returns null on a rest day. */
  function session(w, d) {
    const wi = weekInfo(w);
    if (w === 1) return null;
    const map = w > WEEKS ? MAINT : TRAIN;
    const slot = map[d];
    if (!slot) return null;
    const isTest = !!TESTS[w + '-' + d];
    const items = isTest ? testSession() : build(wi, slot);
    const title = isTest ? 'Test day' : { A: 'Upper and hips', B: 'Core and posterior chain', C: 'Full session' }[slot];
    const key = (w > WEEKS ? 'M' : 'B' + wi.b) + slot;
    return { w, d, slot, title, items, wi, test: isTest, min: minutes(items), id: w + '-' + d, key };
  }

  root.Plan = { DAYS, BLOCKS, WEEKS, weekInfo, session, TRAIN, MAINT, M };
  if (typeof module !== 'undefined') module.exports = root.Plan;
})(typeof window !== 'undefined' ? window : globalThis);
