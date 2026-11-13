/* ==========================================================================
   Sliding photo puzzle (N×N, one empty cell in the bottom-right).
   • Shuffle = a long chain of random *legal* slides from the solved state,
     so every board it produces is guaranteed solvable.
   • Click/tap a tile in the gap's row or column to slide it (and any tiles
     between) into the gap. Arrow keys move a neighbour into the gap.
   ========================================================================== */

(function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Artwork used only while no puzzle photo has been added.
  function defaultArtwork(name) {
    const rose = (x, y, s) => {
      let p = `<g transform="translate(${x} ${y}) scale(${s})"><circle r="34" fill="#6E1020"/>`;
      for (let i = 0; i < 6; i++) p += `<path d="M0,0 C-26,-6 -26,-36 0,-38 C26,-36 26,-6 0,0Z" transform="rotate(${i * 60})" fill="#B3243A" stroke="#E2506A" stroke-width="1"/>`;
      for (let i = 0; i < 5; i++) p += `<path d="M0,0 C-18,-4 -18,-24 0,-26 C18,-24 18,-4 0,0Z" transform="rotate(${30 + i * 72})" fill="#D92D45" stroke="#F07085" stroke-width="1"/>`;
      return p + `<circle r="8" fill="#6E1020"/></g>`;
    };
    const blossom = (x, y, s) => {
      let p = `<g transform="translate(${x} ${y}) scale(${s})">`;
      for (let i = 0; i < 5; i++) p += `<ellipse cy="-10" rx="7.5" ry="10" transform="rotate(${i * 72})" fill="#2856C5" stroke="#7FA2FF" stroke-width="1"/>`;
      return p + `<circle r="4" fill="#F4F0EA"/></g>`;
    };
    let confetti = "";
    const cols = ["#D92D45", "#2856C5", "#F4F0EA", "#A9B9D9", "#D9DDE5"];
    for (let i = 0; i < 70; i++) {
      const x = (i * 137.5) % 900, y = (i * 263.7) % 900;
      if (Math.hypot(x - 450, y - 470) < 250) continue;
      confetti += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${8 + (i % 3) * 4}" height="${16 + (i % 4) * 3}" rx="2" fill="${cols[i % 5]}" transform="rotate(${(i * 47) % 180} ${x.toFixed(0)} ${y.toFixed(0)})" opacity=".85"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
      <defs>
        <radialGradient id="r" cx=".1" cy=".1" r=".8"><stop offset="0" stop-color="#D92D45" stop-opacity=".7"/><stop offset="1" stop-color="#D92D45" stop-opacity="0"/></radialGradient>
        <radialGradient id="b" cx=".9" cy=".9" r=".8"><stop offset="0" stop-color="#2856C5" stop-opacity=".85"/><stop offset="1" stop-color="#2856C5" stop-opacity="0"/></radialGradient>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5A70"/><stop offset=".5" stop-color="#F4F0EA"/><stop offset="1" stop-color="#5D86F0"/></linearGradient>
      </defs>
      <rect width="900" height="900" fill="#10131C"/><rect width="900" height="900" fill="url(#r)"/><rect width="900" height="900" fill="url(#b)"/>
      ${confetti}
      <circle cx="450" cy="470" r="250" fill="none" stroke="#F4F0EA" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 10"/>
      ${rose(120, 120, 1.6)}${rose(200, 220, .9)}${blossom(250, 120, 1.6)}
      ${rose(780, 780, 1.6)}${rose(690, 690, .9)}${blossom(640, 790, 1.6)}
      ${blossom(790, 140, 2)}${blossom(110, 760, 2)}
      <text x="450" y="210" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="34" letter-spacing="12" fill="#F4F0EA">HAPPY BIRTHDAY</text>
      <text x="450" y="600" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="400" fill="url(#g)">20</text>
      <text x="450" y="720" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="54" fill="#F4F0EA">${esc(name)}</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function create({ el, image, onMove, onSolve }) {
    let n = 4, total = 16;
    let pos = [];        // pos[tileId] = cell index; tile (total-1) is the hidden last tile
    let empty = 15;
    let tiles = [];
    let playing = false, solved = false, moves = 0;

    // Resolve to an absolute URL: a relative url() inside a CSS variable is
    // resolved against css/styles.css (where var() is used), not the page.
    const imageUrl = image.startsWith("data:") ? image : new URL(image, document.baseURI).href;
    el.style.setProperty("--puzzle-img", `url("${imageUrl}")`);
    el.tabIndex = 0;
    const shine = document.createElement("div");
    shine.className = "board__shine";

    const cellOf = (id) => pos[id];
    const rc = (cell) => [Math.floor(cell / n), cell % n];

    function place(id) {
      const [r, c] = rc(pos[id]);
      tiles[id].style.transform = `translate(${c * 100}%, ${r * 100}%)`;
      tiles[id].classList.toggle("is-correct", pos[id] === id);
    }

    function markMovable() {
      const [er, ec] = rc(empty);
      tiles.forEach((t, id) => {
        if (id === total - 1) return;
        const [r, c] = rc(pos[id]);
        t.classList.toggle("is-movable", playing && (r === er || c === ec));
      });
    }

    function placed() { let k = 0; for (let id = 0; id < total - 1; id++) if (pos[id] === id) k++; return k; }

    function report() { onMove && onMove({ moves, placed: placed(), total: total - 1 }); }

    function setup(size) {
      n = size; total = n * n;
      el.style.setProperty("--n", n);
      el.innerHTML = "";
      tiles = [];
      pos = [...Array(total).keys()];
      empty = total - 1;
      for (let id = 0; id < total; id++) {
        const t = document.createElement("button");
        t.type = "button";
        t.className = "tile" + (id === total - 1 ? " tile--last" : "");
        t.tabIndex = -1;
        t.dataset.id = id;
        const [r, c] = [Math.floor(id / n), id % n];
        t.innerHTML = `<span class="tile__face" style="background-position:${(c / (n - 1)) * 100}% ${(r / (n - 1)) * 100}%"></span>`;
        t.setAttribute("aria-label", `Tile ${id + 1}`);
        el.appendChild(t);
        tiles.push(t);
        place(id);
      }
      el.appendChild(shine);
      playing = false; solved = false; moves = 0;
      el.classList.remove("is-solved");
      el.classList.add("is-idle");
      markMovable();
      report();
    }

    // swap the tile in `cell` with the empty cell (no checks)
    function slideCell(cell) {
      const id = pos.findIndex((p, i) => p === cell && i !== total - 1);
      pos[id] = empty;
      empty = cell;
      pos[total - 1] = empty;
      return id;
    }

    function shuffle() {
      const steps = n * n * n * 10;
      let prev = -1;
      do {
        for (let s = 0; s < steps; s++) {
          const [r, c] = rc(empty);
          const opts = [];
          if (r > 0) opts.push(empty - n);
          if (r < n - 1) opts.push(empty + n);
          if (c > 0) opts.push(empty - 1);
          if (c < n - 1) opts.push(empty + 1);
          const choices = opts.filter((o) => o !== prev);
          const next = choices[Math.floor(Math.random() * choices.length)];
          prev = empty;
          slideCell(next);
        }
      } while (placed() > Math.floor((total - 1) / 3));
      // walk the gap back to the bottom-right corner (still only legal moves)
      while (empty % n !== n - 1) slideCell(empty + 1);
      while (Math.floor(empty / n) !== n - 1) slideCell(empty + n);
    }

    function start() {
      setup(n);
      shuffle();
      tiles.forEach((t, id) => { place(id); if (id !== total - 1) t.tabIndex = -1; });
      playing = true;
      el.classList.remove("is-idle");
      markMovable();
      report();
    }

    // slide the line of tiles between `cell` and the gap
    function tryMove(cell) {
      if (!playing) return false;
      const [r, c] = rc(cell), [er, ec] = rc(empty);
      if (cell === empty || (r !== er && c !== ec)) return false;
      const step = r === er ? (c < ec ? -1 : 1) : (r < er ? -n : n);
      while (empty !== cell) {
        const id = slideCell(empty + step);
        place(id);
        moves++;
      }
      markMovable();
      report();
      if (placed() === total - 1) finish();
      return true;
    }

    function finish() {
      playing = false; solved = true;
      markMovable();
      setTimeout(() => {
        el.classList.add("is-solved");
        place(total - 1);
        onSolve && onSolve({ moves });
      }, 250);
    }

    el.addEventListener("click", (e) => {
      const t = e.target.closest(".tile");
      if (!t || !playing || t.classList.contains("tile--last")) return;
      const id = +t.dataset.id;
      if (!tryMove(cellOf(id))) {
        t.classList.remove("is-blocked"); void t.offsetWidth; t.classList.add("is-blocked");
      }
    });

    // swipe on touch screens: swipe a tile toward the gap
    let sx = null, sy = null;
    el.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (sx === null || !playing) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;       // a tap — handled by click
      e.preventDefault();
      const [er, ec] = rc(empty);
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && ec > 0) tryMove(empty - 1); else if (dx < 0 && ec < n - 1) tryMove(empty + 1);
      } else {
        if (dy > 0 && er > 0) tryMove(empty - n); else if (dy < 0 && er < n - 1) tryMove(empty + n);
      }
    });

    el.addEventListener("keydown", (e) => {
      if (!playing) return;
      const [er, ec] = rc(empty);
      const map = { ArrowUp: er < n - 1 ? empty + n : -1, ArrowDown: er > 0 ? empty - n : -1, ArrowLeft: ec < n - 1 ? empty + 1 : -1, ArrowRight: ec > 0 ? empty - 1 : -1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      if (map[e.key] >= 0) tryMove(map[e.key]);
    });

    return {
      setup,
      start,
      peek: (on) => el.classList.toggle("is-peek", on),
      get playing() { return playing; },
      get solved() { return solved; },
      get size() { return n; }
    };
  }

  window.Puzzle = { create, defaultArtwork };
})();
