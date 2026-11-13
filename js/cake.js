/* ==========================================================================
   Cake — two-tier pearl cake with 20 interactive candles (first section).
   • click a candle → its flame goes out with a wisp of smoke
   • click the cake itself → glide to the birthday celebration section
   ========================================================================== */

(function () {
  const G = window.GIFT || {};
  const C = G.cake || {};
  const stage = document.getElementById("cakeArt");
  if (!stage) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const W = 600, H = 500, CX = 300;
  const B = { rx: 206, top: 262, bot: 404, ry: 40 };   // bottom tier
  const T = { rx: 128, top: 160, bot: 262, ry: 25 };   // top tier
  const r1 = (n) => Math.round(n * 10) / 10;
  const arcY = (x, cy, rx, ry) => cy + ry * Math.sqrt(Math.max(0, 1 - ((x - CX) / rx) ** 2));
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function body(t) {
    const L = CX - t.rx, R = CX + t.rx;
    return `M${L} ${t.top}L${L} ${t.bot}A${t.rx} ${t.ry} 0 0 0 ${R} ${t.bot}L${R} ${t.top}A${t.rx} ${t.ry} 0 0 1 ${L} ${t.top}Z`;
  }
  function glaze(t, band) {                              // glossy band + drips along the front rim
    const L = CX - t.rx, R = CX + t.rx;
    let d = `M${L} ${t.top}A${t.rx} ${t.ry} 0 0 0 ${R} ${t.top}L${R} ${t.top + band}`;
    const pts = [];
    for (let x = R; x >= L; x -= 4) pts.push(x);
    pts.forEach((x) => { d += `L${r1(x)} ${r1(arcY(x, t.top, t.rx, t.ry) + band)}`; });
    d += "Z";
    for (let x = L + 14; x < R - 10; x += 13 + rnd() * 16) {
      // tapered drip: wide where it leaves the glaze, narrowing, then a round bead at the tip
      const y = arcY(x, t.top, t.rx, t.ry) + band - 3, len = 6 + rnd() * (t === B ? 20 : 15), w = 3.2 + rnd() * 2.2, bw = w * .78;
      d += `M${r1(x - w * 1.6)} ${r1(y)}C${r1(x - w)} ${r1(y + 2)} ${r1(x - bw)} ${r1(y + len * .45)} ${r1(x - bw)} ${r1(y + len)}` +
        `A${r1(bw)} ${r1(bw)} 0 0 0 ${r1(x + bw)} ${r1(y + len)}C${r1(x + bw)} ${r1(y + len * .45)} ${r1(x + w)} ${r1(y + 2)} ${r1(x + w * 1.6)} ${r1(y)}Z`;
    }
    return d;
  }
  function pearls(t, r, gap) {
    let s = "";
    for (let x = CX - t.rx + r; x <= CX + t.rx - r; x += gap) s += `<circle cx="${r1(x)}" cy="${r1(arcY(x, t.bot, t.rx, t.ry) - r * .4)}" r="${r}" fill="url(#ckPearl)"/>`;
    return s;
  }
  function band(t, y1, y2) {
    const L = CX - t.rx, R = CX + t.rx;
    return `M${L} ${y1}A${t.rx} ${t.ry} 0 0 0 ${R} ${y1}L${R} ${y2}A${t.rx} ${t.ry} 0 0 1 ${L} ${y2}Z`;
  }

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="ckSide" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#7F8CC4"/><stop offset=".14" stop-color="#CBD6F6"/><stop offset=".42" stop-color="#FFFFFF"/>
        <stop offset=".66" stop-color="#E9EFFF"/><stop offset=".88" stop-color="#AEBBE6"/><stop offset="1" stop-color="#7A86BC"/>
      </linearGradient>
      <radialGradient id="ckTop" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#EEF2FF"/><stop offset="1" stop-color="#C9D3F2"/></radialGradient>
      <linearGradient id="ckGlaze" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5F79D8"/><stop offset=".3" stop-color="#A9C2FF"/><stop offset=".48" stop-color="#E3ECFF"/>
        <stop offset=".62" stop-color="#B8A9F5"/><stop offset=".85" stop-color="#7C8FE6"/><stop offset="1" stop-color="#5368C4"/>
      </linearGradient>
      <linearGradient id="ckBand" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#6E7BAE"/><stop offset=".4" stop-color="#F4F7FF"/><stop offset=".55" stop-color="#C7D2EE"/><stop offset="1" stop-color="#66729F"/>
      </linearGradient>
      <radialGradient id="ckPearl" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#DDE5F7"/><stop offset="1" stop-color="#8A97C2"/></radialGradient>
      <radialGradient id="ckPlate" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".6" stop-color="#BFD2FF" stop-opacity=".25"/><stop offset="1" stop-color="#7F95D6" stop-opacity=".45"/></radialGradient>
      <radialGradient id="ckLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE7B8" stop-opacity=".9"/><stop offset="1" stop-color="#FFE7B8" stop-opacity="0"/></radialGradient>
      <linearGradient id="ckInk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3A8C"/><stop offset=".5" stop-color="#4F5FC4"/><stop offset="1" stop-color="#2A2F72"/></linearGradient>
      <linearGradient id="ckStar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#A9B8E2"/><stop offset="1" stop-color="#6B78A8"/></linearGradient>
    </defs>

    <!-- glass cake stand -->
    <ellipse cx="${CX}" cy="452" rx="270" ry="40" fill="#0B1030" opacity=".45"/>
    <ellipse cx="${CX}" cy="440" rx="268" ry="44" fill="url(#ckPlate)" stroke="rgba(230,240,255,.75)" stroke-width="1.4"/>
    <ellipse cx="${CX}" cy="436" rx="250" ry="36" fill="none" stroke="rgba(160,230,255,.45)" stroke-width="1"/>

    <!-- bottom tier -->
    <path d="${body(B)}" fill="url(#ckSide)"/>
    <path d="${band(B, B.bot - 34, B.bot - 20)}" fill="url(#ckBand)"/>
    <path d="${band(B, B.bot - 34, B.bot - 33)}" fill="rgba(255,255,255,.8)"/>
    <ellipse cx="${CX}" cy="${B.top}" rx="${B.rx}" ry="${B.ry}" fill="url(#ckTop)"/>
    <path d="${glaze(B, 12)}" fill="url(#ckGlaze)"/>
    <path d="M${CX - B.rx + 10} ${B.top + 6}A${B.rx} ${B.ry} 0 0 0 ${CX + B.rx - 10} ${B.top + 6}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/>
    ${pearls(B, 5.5, 13)}
    <text x="${CX}" y="358" text-anchor="middle" class="ck-line1" fill="url(#ckInk)">${esc(C.line1 || "Happy 20th Birthday")}</text>
    <text x="${CX}" y="396" text-anchor="middle" class="ck-line2" fill="url(#ckInk)">${esc(C.line2 || "My love")}</text>

    <!-- top tier -->
    <ellipse cx="${CX}" cy="${T.bot + 4}" rx="${T.rx + 6}" ry="${T.ry + 4}" fill="#5E6BA6" opacity=".25"/>
    <path d="${body(T)}" fill="url(#ckSide)"/>
    <ellipse cx="${CX}" cy="${T.top}" rx="${T.rx}" ry="${T.ry}" fill="url(#ckTop)"/>
    <path d="${glaze(T, 10)}" fill="url(#ckGlaze)"/>
    <path d="M${CX - T.rx + 8} ${T.top + 5}A${T.rx} ${T.ry} 0 0 0 ${CX + T.rx - 8} ${T.top + 5}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.4"/>
    ${pearls(T, 4.2, 11)}
    <path d="M300 214C301.6 224 304 226.4 314 228 304 229.6 301.6 232 300 242 298.4 232 296 229.6 286 228 296 226.4 298.4 224 300 214Z" fill="url(#ckStar)"/>

    <!-- warm candlelight on the icing (fades as candles go out) -->
    <ellipse class="ck-light" cx="${CX}" cy="${T.top}" rx="150" ry="46" fill="url(#ckLight)"/>
  </svg>`;

  /* ---------- markup: cake body (button) + candles ---------- */
  stage.insertAdjacentHTML("afterbegin", `<button class="cake__body" id="cakeBody" type="button" aria-label="Open your birthday celebration">${svg}</button><div class="candles" id="candles" role="group" aria-label="20 birthday candles"></div>`);
  const holder = document.getElementById("candles");

  const spots = [];
  const ring = (n, rx, ry, off) => { for (let i = 0; i < n; i++) { const a = off + (i / n) * Math.PI * 2; spots.push([CX + rx * Math.cos(a), T.top + ry * Math.sin(a)]); } };
  ring(13, 104, 19, -Math.PI / 2 + .12);
  ring(7, 52, 9.5, -Math.PI / 2 + .45);
  spots.sort((a, b) => a[1] - b[1]);                      // back to front

  const lit = new Set();
  spots.forEach(([x, y], i) => {
    const depth = (y - (T.top - 19)) / 38;                 // 0 = back, 1 = front
    const b = document.createElement("button");
    b.type = "button";
    b.className = "candle";
    b.style.cssText = `left:${(x / W) * 100}%;top:${(y / H) * 100}%;z-index:${10 + Math.round(y)};--s:${(.84 + depth * .16).toFixed(3)};--d:${(-Math.random() * 2).toFixed(2)}s;--f:${(.9 + Math.random() * .5).toFixed(2)}s`;
    b.setAttribute("aria-label", `Blow out candle ${i + 1}`);
    b.innerHTML = '<span class="candle__flame"><i></i></span><span class="candle__wick"></span><span class="candle__stick"></span><span class="candle__smoke"><i></i><i></i><i></i></span>';
    b.addEventListener("click", (e) => { e.stopPropagation(); blow(b); });
    holder.appendChild(b);
    lit.add(b);
  });

  /* ---------- status + interaction ---------- */
  const countEl = document.getElementById("candleCount");
  const statusEl = document.getElementById("cakeStatus");
  const relight = document.getElementById("relight");

  function update() {
    const n = lit.size;
    stage.style.setProperty("--lit", (n / 20).toFixed(3));
    if (countEl) countEl.textContent = n;
    stage.classList.toggle("is-dark", n === 0);
    if (statusEl) statusEl.classList.toggle("is-done", n === 0);
    if (relight) relight.hidden = n === 20;
  }

  function blow(b) {
    if (!lit.has(b)) return;
    lit.delete(b);
    b.classList.add("is-out");
    b.setAttribute("aria-label", "Candle blown out");
    b.disabled = true;
    update();
    if (lit.size === 0) {
      const done = document.getElementById("cakeDone");
      if (done) done.textContent = C.done || "Your wish is on its way.";
      const r = stage.getBoundingClientRect();
      if (window.GiftFX) setTimeout(() => window.GiftFX.burst(r.left + r.width / 2, r.top + r.height * .3, 110, { power: [5, 14] }), 350);
    }
  }

  if (relight) relight.addEventListener("click", () => {
    holder.querySelectorAll(".candle").forEach((b, i) => {
      setTimeout(() => {
        b.classList.remove("is-out"); b.disabled = false;
        b.setAttribute("aria-label", "Blow out candle");
        lit.add(b); update();
      }, reduceMotion ? 0 : i * 45);
    });
  });

  /* ---------- the cake itself → birthday celebration ---------- */
  let wipe = null;
  function goBirthday() {
    const target = document.getElementById("birthday");
    if (!target) return;
    if (reduceMotion) { target.scrollIntoView(); return; }
    if (!wipe) { wipe = document.createElement("div"); wipe.className = "page-wipe"; wipe.setAttribute("aria-hidden", "true"); document.body.appendChild(wipe); }
    wipe.classList.add("is-on");
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = "auto";
      target.scrollIntoView();
      document.documentElement.style.scrollBehavior = "";
      target.classList.remove("is-arriving"); void target.offsetWidth; target.classList.add("is-arriving");
      wipe.classList.remove("is-on");
    }, 650);
  }
  document.getElementById("cakeBody").addEventListener("click", goBirthday);
  const go = document.getElementById("cakeGo");
  if (go) go.addEventListener("click", goBirthday);

  // wish heading: "Make a wish, birthday boy!" → second clause in italics
  const wishEl = document.getElementById("cakeWish");
  if (wishEl) {
    const w = C.wish || "Make a wish, birthday boy!";
    const k = w.indexOf(",");
    wishEl.innerHTML = k > 0 ? `${esc(w.slice(0, k + 1))} <em>${esc(w.slice(k + 1).trim())}</em>` : esc(w);
  }

  update();
})();
