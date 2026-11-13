/* ==========================================================================
   Crystal atmosphere — gives every section the birthday page's look:
   holographic blooms, thin light trails, crystal shards and sparkles.
   Runs before holo.js so the [data-holo] blooms it adds get drawn.
   ========================================================================== */
(function () {
  const SPARK = '<path d="M12 0C12.6 8 16 11.4 24 12 16 12.6 12.6 16 12 24 11.4 16 8 12.6 0 12 8 11.4 11.4 8 12 0Z"/>';
  const SHARD = '<path d="M20 2C34 22 34 58 20 78 6 58 6 22 20 2Z"/><path d="M20 2V78"/>';
  const sections = ["home", "memories", "letters", "flowers", "song", "puzzle", "surprise"];

  sections.forEach((id, i) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const el = document.createElement("div");
    el.className = "crystal crystal--" + (i % 2 ? "r" : "l");   // alternate the side the big bloom sits on
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="crystal__bloom crystal__bloom--main"><div class="holo" data-holo></div></div>' +
      '<div class="crystal__bloom crystal__bloom--small"><div class="holo" data-holo="head"></div></div>' +
      '<svg class="crystal__trails" viewBox="0 0 1600 900" preserveAspectRatio="none" focusable="false">' +
        '<path d="M-40 640 C 260 500, 560 470, 860 540"/><path d="M880 920 C 1140 780, 1400 740, 1640 800"/></svg>' +
      [1, 2, 3].map((n) => '<svg class="crystal__shard crystal__shard--' + n + '" viewBox="0 0 40 80" focusable="false">' + SHARD + "</svg>").join("") +
      [1, 2, 3].map((n) => '<svg class="crystal__spark crystal__spark--' + n + '" viewBox="0 0 24 24" focusable="false">' + SPARK + "</svg>").join("");
    sec.prepend(el);
  });
})();
