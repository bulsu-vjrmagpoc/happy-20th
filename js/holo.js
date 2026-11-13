/* ==========================================================================
   Holo — the holographic wireframe flower + blueprint diagram, drawn as SVG.
   Fills every [data-holo] and [data-diagram] element on the page.
     <div data-holo></div>                 full flower with stem
     <div data-holo="head"></div>          flower head only
     <div data-holo="guides"></div>        flower + construction lines
     <div data-diagram></div>              top-down blueprint schematic
   ========================================================================== */

(function () {
  let uid = 0;
  const f = (n) => Math.round(n * 10) / 10;

  // a petal pointing up from (0,0), with a softly ruffled tip
  function petalPath(len, w) {
    return `M0 0 C${f(-w * .55)} ${f(-len * .15)} ${f(-w)} ${f(-len * .55)} ${f(-w * .72)} ${f(-len * .84)}` +
      ` Q${f(-w * .38)} ${f(-len * 1.03)} 0 ${f(-len * .93)} Q${f(w * .36)} ${f(-len * 1.06)} ${f(w * .74)} ${f(-len * .85)}` +
      ` C${f(w)} ${f(-len * .55)} ${f(w * .55)} ${f(-len * .15)} 0 0Z`;
  }

  function veins(len, w) {
    let s = `<path d="M0 0 Q4 ${f(-len * .5)} 0 ${f(-len * .9)}" class="hv-rib"/>`;
    [-.62, -.32, .3, .6].forEach((k) => {
      s += `<path d="M0 ${f(-len * .06)} Q${f(w * k * .5)} ${f(-len * .45)} ${f(w * k)} ${f(-len * .8)}" class="hv-vein"/>`;
    });
    return s;
  }

  function ring(count, len, w, offset, grad, p, squash) {
    let s = "";
    for (let i = 0; i < count; i++) {
      const a = offset + (360 / count) * i;
      const sc = squash ? 1 - .14 * Math.abs(Math.sin((a * Math.PI) / 180)) : 1;
      const d = petalPath(len * sc, w);
      s += `<g transform="rotate(${f(a)})">` +
        `<path d="${d}" fill="url(#${p}${grad})" class="hv-fill"/>` +
        `<path d="${d}" fill="url(#${p}mesh)"/>` +
        `<path d="${d}" fill="url(#${p}sheen)"/>` +
        `<path d="${d}" fill="url(#${p}tipglow)"/>` +
        `<path d="${d}" class="hv-edge"/>` + veins(len * sc, w) + `</g>`;
    }
    return s;
  }

  function flower(mode) {
    const p = "hf" + (++uid) + "-";
    const pearl = mode === "pearl";                     // pearl-white lotus with golden stamens
    const stem = mode !== "head" && !pearl;
    const guides = mode === "guides";
    const vb = stem ? "-320 -320 640 900" : "-320 -320 640 640";

    let stamens = "";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + .2;
      const r = 62 + (i % 3) * 18;
      const x = f(Math.cos(a) * r), y = f(Math.sin(a) * r);
      stamens += `<path d="M0 0 Q${f(x * .4 + 6)} ${f(y * .4 - 6)} ${x} ${y}" class="hv-stamen"/><circle cx="${x}" cy="${y}" r="${i % 3 ? 2.4 : 3.4}" class="hv-anther"/>`;
    }

    const G1 = pearl
      ? `<stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".3" stop-color="#D6E6FF" stop-opacity=".8"/><stop offset=".55" stop-color="#8FB8FF" stop-opacity=".75"/><stop offset=".78" stop-color="#E4DCFF" stop-opacity=".8"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".9"/>`
      : `<stop offset="0" stop-color="#7FF3FF" stop-opacity=".95"/><stop offset=".28" stop-color="#3F7BFF" stop-opacity=".8"/><stop offset=".52" stop-color="#9C7BFF" stop-opacity=".85"/><stop offset=".7" stop-color="#FF8DC0" stop-opacity=".7"/><stop offset=".86" stop-color="#7DF0FF" stop-opacity=".9"/><stop offset="1" stop-color="#2A47D6" stop-opacity=".8"/>`;
    const G2 = pearl
      ? `<stop offset="0" stop-color="#F2F6FF" stop-opacity=".9"/><stop offset=".35" stop-color="#A9C8FF" stop-opacity=".8"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset=".8" stop-color="#C8B8FF" stop-opacity=".75"/><stop offset="1" stop-color="#8FD8FF" stop-opacity=".8"/>`
      : `<stop offset="0" stop-color="#B597FF" stop-opacity=".85"/><stop offset=".3" stop-color="#5FD6FF" stop-opacity=".85"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".75"/><stop offset=".72" stop-color="#6A63FF" stop-opacity=".8"/><stop offset="1" stop-color="#3FE0F0" stop-opacity=".85"/>`;
    const head = pearl
      ? `<g filter="url(#${p}bloom)" opacity=".45">${ring(8, 285, 112, 22.5, "g1", p, true).replace(/<path d="[^"]*" class="hv-edge"\/>|<path[^>]*class="hv-(rib|vein)"\/>/g, "")}</g>
         <g class="hv-ring hv-ring--back">${ring(8, 285, 112, 22.5, "g1", p, true)}</g>
         <g class="hv-ring">${ring(6, 215, 104, 0, "g2", p, true)}</g>
         <g class="hv-ring hv-ring--front">${ring(5, 150, 84, 36, "g1", p, false)}</g>
         <circle r="62" fill="url(#${p}core)"/>
         <g class="hv-gold">${stamens}</g>`
      : `<g filter="url(#${p}bloom)" opacity=".38">${ring(6, 260, 128, 0, "g1", p, true).replace(/<path d="[^"]*" class="hv-edge"\/>|<path[^>]*class="hv-(rib|vein)"\/>/g, "")}</g>
        <g class="hv-ring hv-ring--back">${ring(6, 260, 128, 0, "g1", p, true)}</g>
        <g class="hv-ring hv-ring--front">${ring(5, 175, 96, 36, "g2", p, false)}</g>
        <circle r="58" fill="url(#${p}core)"/>
        ${stamens}`;
    const core = pearl
      ? `<stop offset="0" stop-color="#FFFDF4"/><stop offset=".35" stop-color="#FFE7A8" stop-opacity=".85"/><stop offset="1" stop-color="#A9C8FF" stop-opacity="0"/>`
      : `<stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="#BFF6FF" stop-opacity=".9"/><stop offset="1" stop-color="#6E7CFF" stop-opacity="0"/>`;

    const leaf = (tr, sc) => `<g transform="${tr} scale(${sc})"><path d="${petalPath(150, 52)}" fill="url(#${p}g2)" class="hv-fill hv-fill--leaf"/>` +
      `<path d="${petalPath(150, 52)}" fill="url(#${p}mesh)"/><path d="${petalPath(150, 52)}" class="hv-edge"/>${veins(150, 52)}</g>`;

    const guideLines = guides ? `<g class="hv-guides">
      <circle r="300"/><circle r="214" stroke-dasharray="2 6"/><circle r="128"/>
      <path d="M-320 0H320M0 -320V320M-226 -226L226 226M226 -226L-226 226"/>
      <rect x="-300" y="-300" width="600" height="600"/>
      <path d="M-300 -282h18M-300 -264h10M282 300v-18M264 300v-10"/>
    </g>` : "";

    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${p}g1" x1="0" y1="0" x2="1" y2="1">${G1}</linearGradient>
        <linearGradient id="${p}g2" x1="1" y1="0" x2="0" y2="1">${G2}</linearGradient>
        <linearGradient id="${p}stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#E6F6FF" stop-opacity=".8"/><stop offset=".5" stop-color="#7FB4FF" stop-opacity=".45"/><stop offset="1" stop-color="#9C7BFF" stop-opacity=".1"/>
        </linearGradient>
        <radialGradient id="${p}sheen" cx=".5" cy=".95" r=".9">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset=".45" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${p}tipglow" cx=".5" cy=".1" r=".6">
          <stop offset="0" stop-color="#9FF6FF" stop-opacity=".55"/><stop offset=".5" stop-color="#FF9CC9" stop-opacity=".18"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${p}core">${core}</radialGradient>
        <pattern id="${p}mesh" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <path d="M0 0H9M0 0V9" stroke="#E8F6FF" stroke-opacity=".16" stroke-width=".6" fill="none"/>
        </pattern>
        <filter id="${p}bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
      </defs>
      ${guideLines}
      ${stem ? `<g class="hv-stemgroup">
        <path d="M0 30 C26 190 -46 330 -14 580" stroke="url(#${p}stem)" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M-2 30 C22 190 -48 330 -16 580" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.2" fill="none"/>
        ${leaf("translate(-6 300) rotate(-58)", 1)}${leaf("translate(-22 420) rotate(52)", .82)}
      </g>` : ""}
      <g class="hv-head">${head}</g>
    </svg>`;
  }

  function diagram() {
    const p = "hd" + (++uid) + "-";
    let petals = "";
    for (let i = 0; i < 6; i++) {
      const d = petalPath(92, 48);
      petals += `<g transform="rotate(${i * 60 + 30})"><path d="${d}" class="hd-petal"/><path d="${d}" fill="url(#${p}grid)"/><path d="M0 0V-84" class="hd-rib"/></g>`;
    }
    let ticks = "";
    for (let i = 0; i < 36; i++) ticks += `<path d="M0 -112V${i % 3 ? -108 : -104}" transform="rotate(${i * 10})"/>`;
    return `<svg viewBox="-130 -130 260 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs><pattern id="${p}grid" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H7M0 0V7" stroke="currentColor" stroke-opacity=".22" stroke-width=".5" fill="none"/></pattern></defs>
      <g class="hd-frame"><rect x="-124" y="-124" width="248" height="248"/><path d="M-130 0h22M108 0h22M0 -130v22M0 108v22"/><circle r="112"/><circle r="60" stroke-dasharray="2 4"/></g>
      <g class="hd-ticks">${ticks}</g>
      <g class="hd-petals">${petals}</g>
      <circle r="14" class="hd-core"/><circle r="5" class="hd-dot"/>
    </svg>`;
  }

  window.Holo = { flower, diagram };
  document.querySelectorAll("[data-holo]").forEach((el) => { el.innerHTML = flower(el.dataset.holo); });
  document.querySelectorAll("[data-diagram]").forEach((el) => { el.innerHTML = diagram(); });
})();
