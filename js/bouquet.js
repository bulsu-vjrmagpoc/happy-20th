/* ==========================================================================
   Bouquet — a hand-built SVG illustration.
   Flowers are reusable <symbol>s placed with buildBouquet(); every flower
   sits in its own .bq-bloom group so it can bloom in on a stagger.
   ========================================================================== */

(function () {
  const GATHER = { x: 300, y: 588 };          // where the stems meet (under the ribbon)

  // deterministic randomness so the bouquet looks the same every visit
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = rng(2020);
  const r1 = (n) => Math.round(n * 10) / 10;

  /* ---------- symbol definitions ---------- */

  function petal(R, W) {
    return `M0,0 C${-W * .95},${-R * .18} ${-W * .85},${-R * .96} 0,${-R} C${W * .85},${-R * .96} ${W * .95},${-R * .18} 0,0Z`;
  }

  function roseSymbol() {
    let s = `<circle r="40" fill="url(#roseBase)"/>`;
    const ring = (n, R, W, off, grad, edge) => {
      for (let i = 0; i < n; i++) {
        s += `<path d="${petal(R, W)}" transform="rotate(${off + i * 360 / n})" fill="url(#${grad})" stroke="${edge}" stroke-width=".9"/>`;
      }
    };
    ring(6, 44, 30, 0, "rosePetalOuter", "rgba(196,58,72,.45)");
    ring(5, 32, 24, 30, "rosePetalMid", "rgba(206,70,82,.5)");
    ring(4, 21, 17, 12, "rosePetalInner", "rgba(214,84,96,.55)");
    s += `<circle r="11" fill="url(#roseHeart)"/>`;
    s += `<path d="M-7,3 C-10,-6 -2,-12 6,-8 C11,-5 9,3 2,5 C-3,6 -4,0 0,-2" fill="none" stroke="#24030A" stroke-width="2" stroke-linecap="round"/>`;
    s += `<path d="M-9,-2 C-8,-10 2,-14 9,-7" fill="none" stroke="rgba(214,90,100,.55)" stroke-width="1" stroke-linecap="round"/>`;
    // a soft top-light
    s += `<circle r="44" fill="url(#roseLight)"/>`;
    return `<symbol id="bq-rose" overflow="visible">${s}</symbol>`;
  }

  function blueSymbol() {
    // a cluster of small five-petal blue florets (forget-me-not / delphinium look)
    const floret = (x, y, r, rot) => {
      let f = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(rot)})">`;
      for (let i = 0; i < 5; i++) {
        f += `<ellipse cx="0" cy="${r1(-r * .55)}" rx="${r1(r * .42)}" ry="${r1(r * .55)}" transform="rotate(${i * 72})" fill="url(#bluePetal)" stroke="rgba(16,36,100,.4)" stroke-width=".5"/>`;
      }
      return f + `<circle r="${r1(r * .22)}" fill="#F6EBC0"/><circle r="${r1(r * .1)}" fill="#C9A23A"/></g>`;
    };
    let s = "";
    for (let i = 0; i < 7; i++) {
      const a = i * 51 + rand() * 20, d = 15 + rand() * 6;
      s += floret(Math.cos(a * Math.PI / 180) * d, Math.sin(a * Math.PI / 180) * d, 9 + rand() * 3, rand() * 72);
    }
    s += floret(0, 0, 13, 10);
    for (let i = 0; i < 4; i++) {
      const a = rand() * Math.PI * 2;
      s += `<circle cx="${r1(Math.cos(a) * 28)}" cy="${r1(Math.sin(a) * 28)}" r="3" fill="#3C66D2"/>`;
    }
    return `<symbol id="bq-blue" overflow="visible">${s}</symbol>`;
  }

  function callaSymbol() {
    // base at 0,0, opens upward and to the right
    return `<symbol id="bq-calla" overflow="visible">
      <path d="M0,0 C-15,-12 -23,-46 -19,-73 C-16,-93 -3,-105 13,-108 C25,-110 37,-105 42,-97 C33,-97 25,-92 20,-82 C13,-62 15,-30 8,-10 C5,-4 3,-1 0,0Z" fill="url(#callaBody)"/>
      <path d="M13,-108 C25,-110 37,-105 42,-97 C33,-97 25,-92 20,-82 C17,-90 11,-99 13,-108Z" fill="url(#callaLip)"/>
      <path d="M-3,-80 C0,-92 6,-100 13,-106 C10,-98 6,-90 4,-80Z" fill="rgba(170,160,140,.35)"/>
      <path d="M12,-58 C13,-70 15,-80 18,-86" fill="none" stroke="url(#spadix)" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M-14,-30 C-12,-50 -10,-66 -6,-80" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M2,-4 C8,-20 9,-40 12,-58" fill="none" stroke="rgba(120,120,100,.25)" stroke-width="1"/>
    </symbol>`;
  }

  function tulipSymbol() {
    return `<symbol id="bq-tulip" overflow="visible">
      <path d="M0,0 C-21,-2 -25,-31 -17,-54 C-11,-47 -5,-45 0,-51 C5,-45 11,-47 17,-54 C25,-31 21,-2 0,0Z" fill="url(#tulipBack)"/>
      <path d="M0,-1 C-13,-4 -15,-32 0,-58 C15,-32 13,-4 0,-1Z" fill="url(#tulipFront)"/>
      <path d="M0,-6 C-1,-24 -1,-40 0,-54" fill="none" stroke="rgba(160,150,130,.35)" stroke-width=".9"/>
      <path d="M-9,-10 C-12,-24 -11,-38 -6,-48" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
    </symbol>`;
  }

  function leafSymbols() {
    return `
      <symbol id="bq-leaf" overflow="visible">
        <path d="M0,0 C9,-14 10,-40 0,-62 C-10,-40 -9,-14 0,0Z" fill="url(#leafDark)"/>
        <path d="M0,-2 L0,-58" stroke="rgba(160,190,160,.18)" stroke-width=".8"/>
      </symbol>
      <symbol id="bq-euca" overflow="visible">
        <ellipse cx="0" cy="-10" rx="8.5" ry="10.5" fill="url(#eucaGrad)"/>
        <ellipse cx="-2" cy="-13" rx="4" ry="5" fill="rgba(200,220,210,.07)"/>
      </symbol>`;
  }

  function defs() {
    return `<defs>
      <radialGradient id="roseBase"><stop offset="0" stop-color="#3A050E"/><stop offset="1" stop-color="#21030A"/></radialGradient>
      <linearGradient id="rosePetalOuter" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2E040C"/><stop offset=".55" stop-color="#6C0F1D"/><stop offset="1" stop-color="#93202E"/></linearGradient>
      <linearGradient id="rosePetalMid" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2A030A"/><stop offset=".6" stop-color="#7A1322"/><stop offset="1" stop-color="#A42737"/></linearGradient>
      <linearGradient id="rosePetalInner" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#26030A"/><stop offset=".6" stop-color="#861727"/><stop offset="1" stop-color="#B0303F"/></linearGradient>
      <radialGradient id="roseHeart" cx=".45" cy=".4"><stop offset="0" stop-color="#7B1424"/><stop offset="1" stop-color="#2A030A"/></radialGradient>
      <radialGradient id="roseLight" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="rgba(255,190,190,.14)"/><stop offset=".5" stop-color="rgba(255,190,190,0)"/><stop offset="1" stop-color="rgba(0,0,0,.35)"/></radialGradient>

      <radialGradient id="bluePetal" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#1A3B92"/><stop offset=".55" stop-color="#2856C5"/><stop offset="1" stop-color="#7A9DF2"/></radialGradient>

      <linearGradient id="callaBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFDF7"/><stop offset=".55" stop-color="#F1EBDD"/><stop offset="1" stop-color="#BDB4A3"/></linearGradient>
      <linearGradient id="callaLip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCD4C4"/></linearGradient>
      <linearGradient id="spadix" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#B8903F"/><stop offset="1" stop-color="#EBC874"/></linearGradient>

      <linearGradient id="tulipBack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9E3D6"/><stop offset="1" stop-color="#B9B19F"/></linearGradient>
      <linearGradient id="tulipFront" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#D9DCCB"/><stop offset=".35" stop-color="#F7F3EA"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>

      <linearGradient id="leafDark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1B2E23"/><stop offset=".5" stop-color="#2D4736"/><stop offset="1" stop-color="#162519"/></linearGradient>
      <radialGradient id="eucaGrad" cx=".4" cy=".35"><stop offset="0" stop-color="#5A7064"/><stop offset="1" stop-color="#2B3D34"/></radialGradient>

      <linearGradient id="paperBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2A30"/><stop offset="1" stop-color="#121215"/></linearGradient>
      <linearGradient id="paperWingL" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#141417"/><stop offset=".7" stop-color="#26262C"/><stop offset="1" stop-color="#303037"/></linearGradient>
      <linearGradient id="paperWingR" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#101012"/><stop offset=".7" stop-color="#1E1E23"/><stop offset="1" stop-color="#28282E"/></linearGradient>
      <linearGradient id="paperFrontL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34343B"/><stop offset="1" stop-color="#1A1A1E"/></linearGradient>
      <linearGradient id="paperFrontC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25252B"/><stop offset="1" stop-color="#0E0E10"/></linearGradient>
      <linearGradient id="paperFrontR" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D1D21"/><stop offset="1" stop-color="#0B0B0D"/></linearGradient>
      <linearGradient id="silverLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7E8494"/><stop offset=".5" stop-color="#F4F6FA"/><stop offset="1" stop-color="#7E8494"/></linearGradient>
      <linearGradient id="satin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0566C"/><stop offset=".35" stop-color="#A91F35"/><stop offset=".6" stop-color="#D92D45"/><stop offset="1" stop-color="#6E1020"/></linearGradient>
      <linearGradient id="veilGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2E2E35"/><stop offset=".5" stop-color="#1A1A1F"/><stop offset="1" stop-color="#0E0E11"/></linearGradient>
      <radialGradient id="sealGrad" cx=".35" cy=".3"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#D9DDE5"/><stop offset="1" stop-color="#8C93A3"/></radialGradient>
      ${roseSymbol()}${blueSymbol()}${callaSymbol()}${tulipSymbol()}${leafSymbols()}
    </defs>`;
  }

  /* ---------- placement helpers ---------- */

  // quadratic bezier from gather point to (x,y); returns {d, angle at tip}
  function stemPath(x, y, bend = 0) {
    const cx = GATHER.x + (x - GATHER.x) * .25 + bend;
    const cy = (GATHER.y + y) / 2;
    const angle = Math.atan2(x - cx, -(y - cy)) * 180 / Math.PI;
    return { d: `M${GATHER.x},${GATHER.y} Q${r1(cx)},${r1(cy)} ${x},${y}`, angle };
  }

  let delay = 0;
  function bloom(inner, step = .09) {
    const g = `<g class="bq-bloom" style="transition-delay:${(delay).toFixed(2)}s">${inner}</g>`;
    delay += step;
    return g;
  }
  const flower = (id, x, y, scale, rot) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})"><g class="bq-head"><use href="#${id}"/></g></g>`;

  // a foliage branch: curved stem with leaves alternating along it
  function branch(x0, y0, x1, y1, bend, count, type, size) {
    const cx = (x0 + x1) / 2 + bend, cy = (y0 + y1) / 2;
    let s = `<path d="M${x0},${y0} Q${cx},${cy} ${x1},${y1}" fill="none" stroke="#24382B" stroke-width="2"/>`;
    for (let i = 1; i <= count; i++) {
      const t = .25 + .75 * (i / count);
      const px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
      const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
      const ang = Math.atan2(dx, -dy) * 180 / Math.PI;
      const side = i % 2 ? 1 : -1;
      const sc = size * (1 - t * .35) * (.85 + rand() * .3);
      const spread = type === "bq-euca" ? 70 : 38;
      s += `<use href="#${type}" transform="translate(${r1(px)} ${r1(py)}) rotate(${r1(ang + side * spread)}) scale(${r1(sc)})"/>`;
    }
    s += `<use href="#${type}" transform="translate(${x1} ${y1}) rotate(${r1(Math.atan2(x1 - cx, -(y1 - cy)) * 180 / Math.PI)}) scale(${r1(size * .7)})"/>`;
    return s;
  }

  function babysBreath(x, y, spread = 34) {
    let s = "";
    const arms = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < arms; i++) {
      const a = -Math.PI / 2 + (rand() - .5) * 2.4;
      const len = spread * (.5 + rand() * .6);
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      s += `<path d="M${x},${y + 12} Q${r1((x + ex) / 2)},${r1(y)} ${r1(ex)},${r1(ey)}" fill="none" stroke="#5E6E57" stroke-width=".7" opacity=".8"/>`;
      const florets = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < florets; k++) {
        const fx = ex + (rand() - .5) * 10, fy = ey + (rand() - .5) * 10;
        s += `<circle cx="${r1(fx)}" cy="${r1(fy)}" r="${r1(1.6 + rand() * 1.6)}" fill="#F4EFE5" opacity="${r1(.75 + rand() * .25)}"/>`;
      }
    }
    return s;
  }

  /* ---------- build ---------- */

  function buildBouquet() {
    delay = 0;
    let s = defs();

    // back paper — two wings + centre sheet
    s += `<g class="bq-sway">`;
    s += `<g class="bq-wing bq-wing--l"><path d="M268,590 L62,236 Q128,196 206,214 L300,560Z" fill="url(#paperWingL)"/>
      <path d="M62,236 Q128,196 206,214" fill="none" stroke="url(#silverLine)" stroke-width="1.1" opacity=".6"/></g>`;
    s += `<g class="bq-wing bq-wing--r"><path d="M332,590 L538,236 Q472,196 394,214 L300,560Z" fill="url(#paperWingR)"/>
      <path d="M538,236 Q472,196 394,214" fill="none" stroke="url(#silverLine)" stroke-width="1.1" opacity=".5"/></g>`;
    s += `<path d="M272,590 L196,150 Q300,118 404,150 L328,590Z" fill="url(#paperBack)"/>`;

    // foliage
    s += bloom(
      branch(300, 470, 128, 252, -30, 6, "bq-euca", 1.25) +
      branch(300, 470, 472, 252, 30, 6, "bq-euca", 1.25) +
      branch(300, 480, 92, 392, 10, 5, "bq-leaf", .95) +
      branch(300, 480, 508, 392, -10, 5, "bq-leaf", .95) +
      branch(300, 460, 214, 150, -24, 5, "bq-euca", 1.05) +
      branch(300, 460, 388, 150, 24, 5, "bq-euca", 1.05) +
      branch(300, 470, 150, 440, 30, 4, "bq-leaf", .9) +
      branch(300, 470, 450, 440, -30, 4, "bq-leaf", .9), .2);

    // stems for the tall flowers
    const callas = [[246, 252, -14], [300, 218, 0], [354, 250, 14]];
    const tulips = [[200, 268, -22], [400, 266, 22], [152, 352, -48], [450, 352, 48]];
    let stems = "";
    callas.concat(tulips).forEach(([x, y]) => {
      stems += `<path d="${stemPath(x, y).d}" fill="none" stroke="#2F4A37" stroke-width="3.2" stroke-linecap="round"/>`;
    });
    s += bloom(stems, .1);

    callas.forEach(([x, y, r]) => { s += bloom(flower("bq-calla", x, y, 1.08, r)); });
    tulips.forEach(([x, y, r], i) => { s += bloom(flower("bq-tulip", x, y, i < 2 ? 1.15 : 1.05, r)); });

    s += bloom(babysBreath(268, 270) + babysBreath(334, 268) + babysBreath(160, 300, 30) + babysBreath(442, 298, 30), .1);

    [[300, 256, 1.15, 0], [214, 322, 1.05, 20], [386, 320, 1.05, -20], [136, 430, .75, 10], [464, 430, .75, -10]].forEach(([x, y, sc, r]) => {
      s += bloom(flower("bq-blue", x, y, sc, r));
    });

    [[300, 320, 1.12, 8], [240, 376, 1, -18], [360, 376, 1, 22], [174, 410, .86, -30], [426, 410, .86, 34], [300, 428, .96, 4]]
      .forEach(([x, y, sc, r]) => { s += bloom(flower("bq-rose", x, y, sc, r), .12); });

    s += bloom(babysBreath(300, 372, 26) + babysBreath(138, 392, 26) + babysBreath(462, 392, 26) + babysBreath(206, 418, 22) + babysBreath(394, 418, 22), .1);

    // front paper (three folded facets) — sits over the stems
    s += `<path d="M106,418 Q160,444 222,446 L286,590 L266,590Z" fill="url(#paperFrontL)"/>`;
    s += `<path d="M222,446 Q300,428 380,446 L314,590 L286,590Z" fill="url(#paperFrontC)"/>`;
    s += `<path d="M380,446 Q440,444 494,418 L334,590 L314,590Z" fill="url(#paperFrontR)"/>`;
    s += `<path d="M106,418 Q160,444 222,446 Q300,428 380,446 Q440,444 494,418" fill="none" stroke="url(#silverLine)" stroke-width="1.3" opacity=".75"/>`;
    s += `<path d="M222,446 L286,590 M380,446 L314,590" stroke="rgba(255,255,255,.05)" stroke-width="1"/>`;

    // below the ribbon: paper flare + cut stems
    s += `<path d="M268,600 L252,694 Q300,708 348,694 L332,600Z" fill="url(#paperFrontC)"/>`;
    s += `<path d="M252,694 Q300,708 348,694" fill="none" stroke="url(#silverLine)" stroke-width="1" opacity=".55"/>`;
    for (let i = 0; i < 7; i++) {
      const x = 284 + i * 5.5;
      s += `<path d="M${x},700 L${r1(x + (i - 3) * 1.6)},${748 + (i % 3) * 5}" stroke="${i % 2 ? '#2F4A37' : '#3B5A44'}" stroke-width="3.4" stroke-linecap="round"/>`;
    }

    // ribbon — a gold trim band and a black satin bow
    s += `<path d="M262,588 Q300,598 338,588 L336,602 Q300,612 264,602Z" fill="#0A0A0C"/>`;
    s += `<path d="M263,592 Q300,602 337,592" fill="none" stroke="url(#silverLine)" stroke-width=".9" opacity=".8"/>`;
    s += `<path d="M296,600 C282,620 270,646 262,676 L276,670 L284,686 C290,654 296,628 304,604Z" fill="url(#satin)"/>`;
    s += `<path d="M304,600 C318,620 330,646 340,672 L326,668 L320,684 C312,654 306,628 296,604Z" fill="url(#satin)"/>`;
    s += `<path d="M300,598 C276,566 228,560 230,588 C232,614 276,612 300,598Z" fill="url(#satin)"/>`;
    s += `<path d="M300,598 C324,566 372,560 370,588 C368,614 324,612 300,598Z" fill="url(#satin)"/>`;
    s += `<path d="M298,596 C278,576 246,572 240,586" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.2"/>`;
    s += `<path d="M302,596 C322,576 354,572 360,586" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1.2"/>`;
    s += `<rect x="289" y="588" width="22" height="20" rx="6" fill="url(#satin)" stroke="rgba(244,246,250,.6)" stroke-width=".8"/>`;

    // tag
    s += `<g class="bq-tag" transform="translate(342 616) rotate(14)">
      <path d="M-30,-2 C-18,-6 -8,-6 0,0" fill="none" stroke="url(#silverLine)" stroke-width=".8"/>
      <rect x="0" y="-14" width="70" height="30" rx="3" fill="#EFE5D3"/>
      <circle cx="7" cy="1" r="2.4" fill="#D92D45"/>
      <text x="40" y="6" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="15" fill="#2B241F">for you</text>
    </g>`;
    s += `</g>`; // /sway

    // veil — closed tissue over the flowers, lifted away on open
    s += `<g class="bq-veil">
      <path d="M112,446 C92,300 160,98 300,86 C440,98 508,300 488,446 Q300,474 112,446Z" fill="url(#veilGrad)"/>
      <path d="M150,440 C140,300 196,140 300,110 M450,440 C460,300 404,140 300,110 M300,110 C292,220 292,330 300,460" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="1.2"/>
      <path d="M112,446 C92,300 160,98 300,86 C440,98 508,300 488,446" fill="none" stroke="url(#silverLine)" stroke-width="1.2" opacity=".55"/>
      <circle cx="300" cy="300" r="30" fill="url(#sealGrad)"/>
      <circle cx="300" cy="300" r="24" fill="none" stroke="rgba(60,66,82,.45)" stroke-width="1"/>
      <text x="300" y="310" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="26" font-style="italic" fill="#2B3142">20</text>
    </g>`;

    return `<svg viewBox="40 70 520 700" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
  }

  window.Bouquet = { build: buildBouquet };
})();
