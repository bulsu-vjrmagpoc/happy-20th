/* ==========================================================================
   Main — wires content.js into the page and runs every interaction.
   ========================================================================== */

(function () {
  const G = window.GIFT;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };
  const UNLOCK_KEY = "bday20-unlocked";
  const COLORS = ["#6FE7FF", "#3D7BFF", "#9B7BFF", "#FFFFFF", "#C9D6F0", "#D9476E", "#B9A6FF"];  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* ---------- content binding ---------- */
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), G);
  $$("[data-bind]").forEach((el) => { el.textContent = get(el.dataset.bind) ?? ""; });
  $("#year").textContent = new Date().getFullYear();
  document.title = `Happy 20th Birthday, ${G.name}`;

  function paragraphs(container, list, cls = "") {
    container.innerHTML = "";
    (list || []).forEach((t) => {
      const p = document.createElement("p");
      if (cls) p.className = cls;
      p.textContent = t;
      container.appendChild(p);
    });
  }

  const CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.6"/></svg>';
  // a real photo when one is set, otherwise an empty frame (no labels)
  function media(src, alt = "") {
    if (src) {
      const img = new Image();
      img.alt = alt;
      img.loading = "lazy";
      img.decoding = "async";
      img.src = src;
      return img;
    }
    const ph = document.createElement("div");
    ph.className = "ph";
    ph.innerHTML = CAMERA;
    return ph;
  }

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      if (el.style.transitionDelay) setTimeout(() => { el.style.transitionDelay = ""; }, 1600);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .1 });
  const observeReveals = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));

  /* ==========================================================================
     CONFETTI ENGINE — bursts on the global #fx canvas
     ========================================================================== */
  function makeCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const c = { canvas, ctx, w: 0, h: 0 };
    c.resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.w = canvas.clientWidth; c.h = canvas.clientHeight;
      canvas.width = c.w * dpr; canvas.height = c.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    c.resize();
    addEventListener("resize", c.resize);
    return c;
  }

  function drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === "rect") {
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.shape === "circle") {
      ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
    } else if (p.shape === "streamer") {
      ctx.strokeStyle = p.color; ctx.lineWidth = 2.4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-p.h / 2, 0);
      ctx.bezierCurveTo(-p.h / 6, Math.sin(p.tilt) * 8, p.h / 6, -Math.sin(p.tilt) * 8, p.h / 2, 0);
      ctx.stroke();
    } else if (p.shape === "petal") {
      ctx.scale(1, .5 + .5 * Math.abs(Math.cos(p.tilt)));
      ctx.beginPath(); ctx.moveTo(0, -p.w);
      ctx.bezierCurveTo(p.w * .9, -p.w * .6, p.w * .7, p.w * .7, 0, p.w);
      ctx.bezierCurveTo(-p.w * .7, p.w * .7, -p.w * .9, -p.w * .6, 0, -p.w);
      ctx.fill();
    } else if (p.shape === "heart") {
      const s = p.w / 12;
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.bezierCurveTo(-10, 2, -8, -9, 0, -4);
      ctx.bezierCurveTo(8, -9, 10, 2, 0, 9);
      ctx.fill();
    } else if (p.shape === "star") {
      ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const r = i % 2 ? p.w * .4 : p.w; const a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function stepParticle(p) {
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.gravity;
    p.x += p.vx + Math.sin(p.tilt) * p.wobble;
    p.y += p.vy;
    p.rot += p.vr; p.tilt += p.vt;
    p.life -= p.decay;
  }

  const fx = makeCanvas($("#fx"));
  const fxParts = [];
  let fxRunning = false;
  function fxLoop() {
    fx.ctx.clearRect(0, 0, fx.w, fx.h);
    for (let i = fxParts.length - 1; i >= 0; i--) {
      const p = fxParts[i];
      stepParticle(p);
      if (p.life <= 0 || p.y > fx.h + 40) { fxParts.splice(i, 1); continue; }
      drawParticle(fx.ctx, p);
    }
    if (fxParts.length) requestAnimationFrame(fxLoop); else fxRunning = false;
  }
  function addParticles(list) {
    fxParts.push(...list);
    if (!fxRunning) { fxRunning = true; requestAnimationFrame(fxLoop); }
  }
  function confettiPiece(x, y, angle, power, shape) {
    return {
      x, y, shape: shape || pick(["rect", "rect", "rect", "circle", "streamer"]),
      vx: Math.cos(angle) * power, vy: Math.sin(angle) * power,
      w: rand(6, 11), h: rand(10, 18) * (shape === "streamer" ? 2.4 : 1), color: pick(COLORS),
      rot: rand(0, Math.PI * 2), vr: rand(-.2, .2), tilt: rand(0, Math.PI * 2), vt: rand(.05, .2),
      gravity: .22, drag: .985, wobble: .6, life: 1.6, decay: rand(.005, .009)
    };
  }
  function burst(x, y, count = 120, { spread = Math.PI * 2, dir = -Math.PI / 2, power = [6, 15] } = {}) {
    if (reduceMotion) count = Math.round(count / 4);
    const list = [];
    for (let i = 0; i < count; i++) {
      const a = dir + rand(-spread / 2, spread / 2);
      list.push(confettiPiece(x, y, a, rand(power[0], power[1])));
    }
    addParticles(list);
  }
  function celebrate() {
    burst(fx.w * .15, fx.h + 10, 90, { spread: .9, dir: -Math.PI / 2 + .45, power: [14, 24] });
    burst(fx.w * .85, fx.h + 10, 90, { spread: .9, dir: -Math.PI / 2 - .45, power: [14, 24] });
    setTimeout(() => burst(fx.w / 2, fx.h * .35, 110, { power: [5, 13] }), 300);
  }
  function petalBurst(x, y, count = 60) {
    if (reduceMotion) count = 12;
    const list = [];
    for (let i = 0; i < count; i++) {
      const p = confettiPiece(x + rand(-80, 80), y + rand(-40, 40), rand(-Math.PI, 0), rand(2, 7), "petal");
      p.color = pick(["#C2304F", "#8E1F3F", "#D9476E", "#FFFFFF", "#7FDDFF", "#A98BFF"]);
      p.w = rand(5, 9); p.gravity = .05; p.drag = .99; p.wobble = 1.2; p.decay = rand(.003, .006);
      list.push(p);
    }
    addParticles(list);
  }

  // continuous, gentle falling confetti for a canvas (landing, finale)
  function ambientConfetti(canvas, density = 1) {
    const c = makeCanvas(canvas);
    const parts = [];
    let alive = true;
    const target = () => reduceMotion ? 12 : Math.round(Math.min(90, (c.w * c.h) / 16000) * density);
    const make = (anywhere) => {
      const p = confettiPiece(rand(0, c.w), anywhere ? rand(-c.h, c.h) : rand(-60, -10), Math.PI / 2, rand(.5, 1.5));
      p.gravity = 0; p.drag = 1; p.vy = rand(.6, 1.6); p.vx = rand(-.3, .3); p.decay = 0; p.life = rand(.5, .95); p.wobble = .8;
      if (Math.random() < .2) { p.shape = "star"; p.color = pick(["#FFFFFF", "#BFF3FF", "#D9CCFF"]); p.w = rand(2, 4); }
      return p;
    };
    function frame() {
      if (!alive) return;
      while (parts.length < target()) parts.push(make(true));
      c.ctx.clearRect(0, 0, c.w, c.h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        stepParticle(p);
        if (p.y > c.h + 30) { parts[i] = make(false); continue; }
        drawParticle(c.ctx, p);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return () => { alive = false; c.ctx.clearRect(0, 0, c.w, c.h); removeEventListener("resize", c.resize); };
  }

  /* ==========================================================================
     LOADER → LANDING
     ========================================================================== */
  const loader = $("#loader"), loaderBar = $("#loaderBar");
  const t0 = performance.now();
  let pct = 0;
  const tick = setInterval(() => { pct = Math.min(90, pct + rand(6, 14)); loaderBar.style.width = pct + "%"; }, 160);
  const fontsReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  const pageLoaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
  const timeout = new Promise((r) => setTimeout(r, 6000));          // never block the gift on a slow font
  let stopIntroConfetti = null;
  Promise.race([Promise.all([fontsReady, pageLoaded]), timeout]).then(() => {
    const wait = Math.max(0, (reduceMotion ? 200 : 1300) - (performance.now() - t0));
    setTimeout(() => {
      clearInterval(tick);
      loaderBar.style.width = "100%";
      setTimeout(() => {
        loader.classList.add("is-done");
        stopIntroConfetti = ambientConfetti($("#introConfetti"), 1);
      }, 250);
    }, wait);
  });

  const intro = $("#intro");
  function openGift() {
    if (window.BirthdayMusic) window.BirthdayMusic.start();     // this click is the user gesture browsers need for audio
    const r = $("#openGift").getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 160, { power: [6, 18] });
    intro.classList.add("is-opening");
    setTimeout(() => {
      intro.classList.add("is-open");
      document.body.classList.add("is-revealed");
      document.body.classList.remove("is-locked");
      observeReveals();
    }, reduceMotion ? 50 : 650);
    setTimeout(() => {
      intro.classList.add("is-gone");
      stopCountdown();
      stopIntroConfetti && stopIntroConfetti();
      stopIntroConfetti = null;
      if (!reduceMotion) setTimeout(() => burst(fx.w / 2, -20, 80, { dir: Math.PI / 2, spread: 2.4, power: [2, 8] }), 100);
    }, reduceMotion ? 300 : 2000);
  }
  $("#openGift").addEventListener("click", openGift);

  /* ==========================================================================
     BIRTHDAY CALENDAR + LIVE COUNTDOWN (landing)
     ========================================================================== */
  const BDAY = new Date(2026, 10, 20, 0, 0, 0);           // 20 November 2026, local midnight
  const BDAY_END = new Date(2026, 10, 21, 0, 0, 0);
  let countdownTimer = null;

  (function buildCalendar() {
    const grid = $("#calGrid");
    if (!grid) return;
    const y = BDAY.getFullYear(), mo = BDAY.getMonth();
    const lead = new Date(y, mo, 1).getDay();             // weekday of the 1st (0 = Sunday)
    const days = new Date(y, mo + 1, 0).getDate();        // days in the month
    const now = new Date();
    const inMonth = now.getFullYear() === y && now.getMonth() === mo;
    const today = inMonth ? now.getDate() : null;
    const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.2 4 6.3 4c2.3 0 3.9 1.3 5.7 3.4C13.8 5.3 15.4 4 17.7 4c4.1 0 6 4.4 4.3 7.7C19.5 16.4 12 21 12 21z"/></svg>';
    let html = "";
    for (let i = 0; i < lead; i++) html += '<li class="cal__day cal__day--empty" aria-hidden="true"></li>';
    for (let d = 1; d <= days; d++) {
      const cls = ["cal__day"];
      if (d === BDAY.getDate()) cls.push("cal__day--bday");
      if (today !== null) {
        if (d < today) cls.push("is-past");
        if (d === today && d !== BDAY.getDate()) cls.push("is-today");
        if (d > today && d < BDAY.getDate()) cls.push("is-between");
      }
      const label = d === BDAY.getDate() ? ` aria-label="November ${d}, his birthday"` : "";
      const extra = d === BDAY.getDate() ? `<i class="cal__ring"></i><i class="cal__heart">${HEART_SVG}</i>` : "";
      html += `<li class="${cls.join(" ")}"${label}>${extra}<span>${d}</span></li>`;
    }
    grid.innerHTML = html;
  })();

  function tickCountdown() {
    const box = $("#countdown");
    if (!box) return;
    const now = Date.now();
    let ms = Math.max(0, BDAY.getTime() - now);
    const set = (u, v) => { $(`[data-unit="${u}"]`, box).textContent = String(v).padStart(2, "0"); };
    const s = Math.floor(ms / 1000);
    set("d", Math.floor(s / 86400));
    set("h", Math.floor((s % 86400) / 3600));
    set("m", Math.floor((s % 3600) / 60));
    set("s", s % 60);
    if (ms === 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      $(".cal-wrap").classList.add("is-bday");
      $("#calKicker").textContent = now < BDAY_END.getTime() ? "Today is your day" : "Your day, always";
    }
  }
  tickCountdown();
  if (Date.now() < BDAY.getTime()) countdownTimer = setInterval(tickCountdown, 1000);
  function stopCountdown() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

  /* ==========================================================================
     NAVIGATION
     ========================================================================== */
  const navLinks = $$(".nav__links a, .menu__links a");
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main > section").forEach((s) => sectionObserver.observe(s));

  const toggle = $("#navToggle"), menu = $("#mobileMenu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("resize", () => { if (innerWidth > 1100 && document.body.classList.contains("menu-open")) setMenu(false); });

  /* ---------- desktop sparkle trail ---------- */
  if (finePointer && !reduceMotion) {
    let mx = -100, my = -100, last = 0;
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX; my = e.clientY;
      const now = performance.now();
      if (now - last > 70) {
        last = now;
        const s = confettiPiece(mx, my, rand(0, Math.PI * 2), rand(.3, 1.2), "star");
        s.color = pick(["#7FEFFF", "#6E9BFF", "#B49BFF", "#FFFFFF"]); s.w = rand(2, 3.5); s.gravity = .02; s.decay = .025; s.life = 1;
        addParticles([s]);
      }
    });
  }

  // shared with the cake (all-candles-out burst)
  window.GiftFX = { burst, celebrate };

  /* ---------- background: a few particles of light drifting slowly upward ---------- */
  const skyMotes = $("#skyMotes");
  if (skyMotes && !reduceMotion) {
    const count = innerWidth < 600 ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const m = document.createElement("span");
      m.className = "sky-mote";
      m.style.cssText = `left:${rand(2, 98)}%;--s:${rand(2, 5)}px;--c:${pick(["#7FEFFF", "#8FB0FF", "#B49BFF", "#FFFFFF"])};` +
        `--o:${rand(.35, .8)};--x:${rand(-50, 50)}px;--d:${rand(20, 40)}s;--delay:${-rand(0, 40)}s`;
      skyMotes.appendChild(m);
    }
  }

  /* ==========================================================================
     BIRTHDAY
     ========================================================================== */
  $("#birthdayPhoto").appendChild(media(G.birthday.photo, G.name));
  $("#birthdayPhoto").style.cssText = `--zoom:${Number(G.birthday.photoZoom) || 1};--focus:${G.birthday.photoFocus || "50% 50%"}`;
  // "Happy 20th Birthday" + name → three-line editorial heading
  (function () {
    const el = $("#bdayTitle");
    if (!el) return;
    const words = (G.birthday.title || "Happy 20th Birthday").split(" ");
    const first = document.createElement("span"); first.className = "bday__t1"; first.textContent = words.shift();
    const rest = document.createElement("span"); rest.className = "bday__t2"; rest.textContent = words.join(" ") + ",";
    const nm = document.createElement("span"); nm.className = "bday__t3"; nm.textContent = G.name;
    el.append(first, rest, nm);
  })();

  /* ==========================================================================
     MEMORIES + LIGHTBOX (photos only)
     ========================================================================== */
  const gallery = $("#gallery");
  const memories = G.memories || [];
  const TAPES = ["tape--red", "tape--blue", "tape--ivory"];
  memories.forEach((src, i) => {
    const card = document.createElement("figure");
    card.className = `polaroid reveal g${(i % 6) + 1}`;
    card.style.transitionDelay = `${(i % 3) * .1}s`;
    card.innerHTML = `${i % 2 === 0 ? `<span class="tape ${TAPES[(i / 2) % 3]}" aria-hidden="true"></span>` : ""}<div class="polaroid__img"></div>`;
    $(".polaroid__img", card).appendChild(media(src, "A memory of us"));
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open memory ${i + 1} of ${memories.length}`);
    card.addEventListener("click", () => openLightbox(i));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); } });
    gallery.appendChild(card);
  });

  const lb = $("#lightbox"), lbFrame = $("#lightboxFrame");
  let lbIndex = 0, lbReturn = null;
  function showSlide(i) {
    lbIndex = (i + memories.length) % memories.length;
    lbFrame.classList.remove("in");
    setTimeout(() => {
      lbFrame.innerHTML = "";
      const el = media(memories[lbIndex], "A memory of us");
      if (el.tagName === "IMG") el.loading = "eager";
      lbFrame.appendChild(el);
      requestAnimationFrame(() => lbFrame.classList.add("in"));
    }, lb.classList.contains("is-open") ? 200 : 0);
  }
  function openLightbox(i) {
    lbReturn = document.activeElement;
    showSlide(i);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".lightbox__close", lb).focus({ preventScroll: true }), 50);
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbReturn && lbReturn.focus({ preventScroll: true });
  }
  $(".lightbox__prev", lb).addEventListener("click", () => showSlide(lbIndex - 1));
  $(".lightbox__next", lb).addEventListener("click", () => showSlide(lbIndex + 1));
  $("[data-close]", lb).addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lightbox__stage")) closeLightbox(); });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showSlide(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ==========================================================================
     LETTERS
     ========================================================================== */
  const envWrap = $("#envelopes"), modal = $("#letterModal");
  const pad = (n) => String(n).padStart(2, "0");
  let openEnv = null, revealTimers = [];

  (G.letters || []).forEach((l, i) => {
    const num = pad(i + 1);
    const w = document.createElement("div");
    w.className = "env-wrap reveal";
    w.style.transitionDelay = `${(i % 3) * .1}s`;
    w.innerHTML = `
      <button class="env ${l.color === "blue" ? "env--blue" : ""}" type="button">
        <span class="env__back"></span>
        <span class="env__flap"></span>
        <span class="env__card">for you</span>
        <span class="env__front"></span>
        <span class="env__stamp" aria-hidden="true">20</span>
        <span class="seal">${num}</span>
      </button>
      <div class="env__meta">
        <span class="env__no">Letter ${num}</span>
        <h3 class="env__title"></h3>
        <span class="env__status">Sealed</span>
      </div>`;
    $(".env__title", w).textContent = l.title;
    const btn = $(".env", w);
    btn.setAttribute("aria-label", `Open letter ${num}: ${l.title}`);
    btn.addEventListener("click", () => openLetter(i, w));
    envWrap.appendChild(w);
  });

  function openLetter(i, wrap) {
    if (openEnv) return;
    openEnv = wrap;
    wrap.classList.add("is-opening");
    setTimeout(() => showLetter(G.letters[i], i), reduceMotion ? 100 : 1200);
  }

  function showLetter(l, i) {
    $("#letterNum").textContent = `Letter ${pad(i + 1)}`;
    $("#letterTitle").textContent = l.title;
    const body = $("#letterBody"), sign = $("#letterSign");
    paragraphs(body, l.body);
    sign.textContent = G.letterSignature || "";
    sign.classList.remove("in");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modal.scrollTop = 0;
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".paper__close", modal).focus({ preventScroll: true }), 60);
    revealTimers.forEach(clearTimeout);
    const items = [...$$("p", body), sign];
    revealTimers = items.map((p, k) => setTimeout(() => p.classList.add("in"), (reduceMotion ? 0 : 500) + k * (reduceMotion ? 0 : 260)));
  }

  function closeLetter() {
    revealTimers.forEach(clearTimeout);
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (!openEnv) return;
    const w = openEnv;
    openEnv = null;
    setTimeout(() => {
      w.classList.remove("is-opening");
      w.classList.add("is-read");
      $(".env__status", w).textContent = "Read";
    }, 300);
    $(".env", w).focus({ preventScroll: true });
  }
  $$("[data-close]", modal).forEach((b) => b.addEventListener("click", closeLetter));

  /* ==========================================================================
     BOUQUET
     ========================================================================== */
  const flowers = $("#flowers"), bouquet = $("#bouquet"), bouquetBtn = $("#bouquetBtn");
  bouquet.innerHTML = window.Bouquet.build();
  bouquet.classList.add("is-wrapped");
  function toggleBouquet() {
    const open = !flowers.classList.contains("is-bloomed");
    flowers.classList.toggle("is-bloomed", open);
    bouquet.classList.toggle("is-wrapped", !open);
    $("span", bouquetBtn).textContent = open ? "Wrap them back up" : G.bouquet.button;
    if (open) {
      const r = bouquet.getBoundingClientRect();
      setTimeout(() => petalBurst(r.left + r.width / 2, r.top + r.height * .35, 70), 500);
    }
  }
  bouquetBtn.addEventListener("click", toggleBouquet);
  bouquet.addEventListener("click", () => { if (!flowers.classList.contains("is-bloomed")) toggleBouquet(); });

  /* ==========================================================================
     PUZZLE
     ========================================================================== */
  const board = $("#board"), overlay = $("#boardOverlay");
  const startBtn = $("#startBtn"), peekBtn = $("#peekBtn"), chips = $$(".chip");
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  let timerId = null, seconds = 0, size = 4;

  const puzzle = window.Puzzle.create({
    el: board,
    image: G.puzzle.photo || window.Puzzle.defaultArtwork(G.name),
    onMove({ moves, placed, total }) {
      $("#moves").textContent = moves;
      const started = (puzzle && puzzle.playing) || moves > 0;
      const p = started ? Math.round((placed / total) * 100) : 0;
      $("#progressText").textContent = p + "%";
      $("#progressBar").style.width = p + "%";
    },
    onSolve({ moves }) {
      clearInterval(timerId);
      $("#progressText").textContent = "100%";
      $("#progressBar").style.width = "100%";
      document.querySelector(".game").classList.add("is-solved");
      setPeek(false);
      peekBtn.disabled = true;
      startBtn.textContent = "Play again";
      setTimeout(celebrate, 900);
      $("#solvedStats").textContent = `${size}×${size} · ${moves} moves · ${fmt(seconds)}`;
      setTimeout(() => {
        $("#solvedCard").hidden = false;
        unlock();
        $("#solvedCard").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }, 1900);
    }
  });
  puzzle.setup(size);

  // switching difficulty ends any game in progress and shows the new board, ready to start
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => c.setAttribute("aria-checked", c === chip));
    size = +chip.dataset.size;
    puzzle.setup(size);
    resetStats();
    setPeek(false);
    peekBtn.disabled = true;
    startBtn.textContent = "Start";
    overlay.classList.remove("is-hidden");
  }));

  function resetStats() {
    clearInterval(timerId);
    seconds = 0;
    $("#timer").textContent = "0:00";
    $("#moves").textContent = "0";
    $("#progressText").textContent = "0%";
    $("#progressBar").style.width = "0%";
  }
  function setPeek(on) {
    peekBtn.setAttribute("aria-pressed", on);
    peekBtn.textContent = on ? "Hide" : "Peek";
    puzzle.peek(on);
  }

  startBtn.addEventListener("click", () => {
    resetStats();
    document.querySelector(".game").classList.remove("is-solved");
    $("#solvedCard").hidden = true;
    puzzle.start();
    overlay.classList.add("is-hidden");
    startBtn.textContent = "Restart";
    peekBtn.disabled = false;
    setPeek(false);
    timerId = setInterval(() => { seconds++; $("#timer").textContent = fmt(seconds); }, 1000);
    board.focus({ preventScroll: true });
  });
  peekBtn.addEventListener("click", () => setPeek(peekBtn.getAttribute("aria-pressed") !== "true"));

  /* ==========================================================================
     FINAL SURPRISE — locked until the puzzle is solved
     ========================================================================== */
  $("#finalePhoto").appendChild(media(G.surprise.photo, "Us"));
  paragraphs($("#finaleLetter"), G.surprise.letter);

  const gateBtn = $("#gateBtn");
  function unlock(persist = true) {
    if (document.body.classList.contains("is-unlocked")) return;
    document.body.classList.add("is-unlocked");
    if (persist) store.set(UNLOCK_KEY, "1");
    $("#gateTitle").textContent = "Your surprise is ready.";
    $("#gateText").textContent = "You solved the puzzle. Whatever's behind this door is yours.";
    gateBtn.textContent = "Open your final surprise";
    gateBtn.classList.replace("btn--outline-light", "btn--glow");
    $$(".nav__locked").forEach((a) => a.setAttribute("aria-label", "Final Surprise (unlocked)"));
  }
  if (store.get(UNLOCK_KEY) === "1") unlock();
  else $$(".nav__locked").forEach((a) => a.setAttribute("aria-label", "Final Surprise (locked)"));

  // ✎ testing shortcut: add ?preview=vencee to the URL to skip the puzzle.
  // Unlocks for this visit only (nothing is saved) and opens the final surprise right after the gift is opened.
  if (new URLSearchParams(location.search).get("preview") === "vencee") {
    unlock(false);
    const openAfterIntro = () => setTimeout(openFinale, reduceMotion ? 100 : 900);
    if (intro.classList.contains("is-open")) openAfterIntro();
    else new MutationObserver((_, obs) => {
      if (intro.classList.contains("is-open")) { obs.disconnect(); openAfterIntro(); }
    }).observe(intro, { attributes: true, attributeFilter: ["class"] });
  }

  gateBtn.addEventListener("click", (e) => {
    if (!document.body.classList.contains("is-unlocked")) return;    // locked: link scrolls to the puzzle
    e.preventDefault();
    openFinale();
  });
  $("#unlockBtn").addEventListener("click", openFinale);

  const finale = $("#finale");
  let stopFinaleConfetti = null;
  function openFinale() {
    if (!document.body.classList.contains("is-unlocked")) return;
    finale.classList.add("is-open");
    finale.setAttribute("aria-hidden", "false");
    finale.scrollTop = 0;
    document.body.style.overflow = "hidden";
    stopFinaleConfetti = ambientConfetti($("#finaleFx"), .5);
    setTimeout(celebrate, reduceMotion ? 0 : 700);
    setTimeout(() => $("#finaleClose").focus({ preventScroll: true }), 100);
  }
  function closeFinale() {
    finale.classList.remove("is-open");
    finale.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(() => { stopFinaleConfetti && stopFinaleConfetti(); stopFinaleConfetti = null; }, 1200);
    document.documentElement.style.scrollBehavior = "auto";
    $("#surprise").scrollIntoView();
    document.documentElement.style.scrollBehavior = "";
  }
  $("#finaleClose").addEventListener("click", closeFinale);
  $("#finaleReplay").addEventListener("click", celebrate);

  /* ---------- global keys ---------- */
  document.addEventListener("keydown", (e) => {
    if (lb.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showSlide(lbIndex - 1);
      if (e.key === "ArrowRight") showSlide(lbIndex + 1);
      return;
    }
    if (e.key !== "Escape") return;
    if (modal.classList.contains("is-open")) closeLetter();
    else if (finale.classList.contains("is-open")) closeFinale();
    else if (document.body.classList.contains("menu-open")) setMenu(false);
  });
})();
