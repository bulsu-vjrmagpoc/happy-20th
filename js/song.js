/* ==========================================================================
   Song — vinyl turntable player with Spotify-style synced lyrics.
   Plays a local audio file when `song.audio` is set, otherwise YouTube.
   ========================================================================== */

(function () {
  const S = (window.GIFT || {}).song;
  const root = document.getElementById("player");
  if (!S || !root) return;

  const $ = (s) => root.querySelector(s);
  const playBtn = $("#songPlay"), seek = $("#seek"), fill = $("#seekFill"), knob = $("#seekKnob");
  const timeEl = $("#songTime"), durEl = $("#songDur"), status = $("#songStatus");
  const scroller = $("#lyricsScroll"), list = $("#lyricsList");
  const offset = Number(S.lyricsOffset) || 0;
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const setStatus = (html) => { status.innerHTML = html || ""; };

  /* ---------- record label photo ---------- */
  if (S.cover) $("#vinylLabel").style.backgroundImage = `url("${new URL(S.cover, document.baseURI).href}")`;

  /* ---------- lyrics ---------- */
  const lines = (S.lyrics || []).map(([t, text]) => ({ t: t + offset, text }));
  list.innerHTML = "";
  const items = lines.map((l, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lyric" + (l.text === "♪" ? " lyric--note" : "");
    b.textContent = l.text;
    b.setAttribute("aria-label", l.text === "♪" ? `Instrumental, ${fmt(l.t)}` : `${l.text}, ${fmt(l.t)}`);
    b.addEventListener("click", () => { engine.seek(Math.max(0, l.t)); engine.play(); });
    li.appendChild(b);
    list.appendChild(li);
    return b;
  });

  let active = -1, userScrollUntil = 0;
  ["wheel", "touchmove"].forEach((ev) => scroller.addEventListener(ev, () => { userScrollUntil = performance.now() + 3500; }, { passive: true }));

  function syncLyrics(t, force) {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) { if (lines[i].t <= t + .15) idx = i; else break; }
    if (idx === active && !force) return;
    active = idx;
    items.forEach((el, i) => {
      el.classList.toggle("is-active", i === idx);
      el.classList.toggle("is-past", i < idx);
    });
    if (idx >= 0 && performance.now() > userScrollUntil) {
      const el = items[idx];
      const top = el.offsetTop - scroller.clientHeight / 2 + el.offsetHeight / 2;
      scroller.scrollTo({ top, behavior: force ? "auto" : "smooth" });
    }
  }

  /* ---------- engines ---------- */
  let engine;
  let duration = S.duration || 0;

  function audioEngine(src) {
    const a = new Audio();
    a.preload = "metadata";
    a.src = new URL(src, document.baseURI).href;
    a.addEventListener("loadedmetadata", () => { duration = a.duration || duration; render(); });
    a.addEventListener("play", () => setPlaying(true));
    a.addEventListener("pause", () => setPlaying(false));
    a.addEventListener("ended", () => { setPlaying(false); syncLyrics(0, true); });
    a.addEventListener("error", () => setStatus("Couldn't load the song file. Check the <code>audio</code> path in content.js."));
    $("#songSource").hidden = true;
    return {
      play: () => a.play().catch(() => setStatus("Tap play again to start the music.")),
      pause: () => a.pause(),
      seek: (t) => { a.currentTime = t; render(); },
      time: () => a.currentTime || 0,
      playing: () => !a.paused
    };
  }

  function youtubeEngine(id) {
    let player = null, ready = false, wantPlay = false, pendingSeek = null, isPlaying = false, loading = false;
    const ytLink = `https://youtu.be/${id}`;

    function load() {
      if (loading) return;
      loading = true;
      const make = () => {
        player = new YT.Player("ytPlayer", {
          videoId: id,
          width: "100%", height: "100%",
          playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1, disablekb: 1, fs: 0, iv_load_policy: 3 },
          events: {
            onReady: () => {
              ready = true;
              duration = player.getDuration() || duration;
              render();
              if (pendingSeek !== null) { player.seekTo(pendingSeek, true); pendingSeek = null; }
              if (wantPlay) player.playVideo();
            },
            onStateChange: (e) => {
              isPlaying = e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING;
              if (e.data === YT.PlayerState.PLAYING) { duration = player.getDuration() || duration; setStatus(""); }
              setPlaying(isPlaying);
              if (e.data === YT.PlayerState.ENDED) syncLyrics(0, true);
            },
            onError: () => {
              setPlaying(false);
              const local = location.protocol === "file:";
              setStatus(local
                ? `YouTube won't play when the page is opened as a file. Put the site online (or run a local server) — or <a href="${ytLink}" target="_blank" rel="noopener">listen on YouTube</a>.`
                : `This video can't play here right now. <a href="${ytLink}" target="_blank" rel="noopener">Listen on YouTube</a>.`);
            }
          }
        });
      };
      if (window.YT && window.YT.Player) return make();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev && prev(); make(); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => setStatus(`Couldn't reach YouTube. Check the internet connection, or <a href="${ytLink}" target="_blank" rel="noopener">listen on YouTube</a>.`);
      document.head.appendChild(s);
    }

    // load the player shortly before the section comes into view, so play is instant
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "800px 0px" });
    io.observe(root);

    return {
      play: () => { wantPlay = true; load(); if (ready) player.playVideo(); else setStatus("Loading the song…"); },
      pause: () => { wantPlay = false; if (ready) player.pauseVideo(); },
      seek: (t) => { if (ready) player.seekTo(t, true); else pendingSeek = t; render(t); },
      time: () => (ready && player.getCurrentTime ? player.getCurrentTime() : (pendingSeek || 0)),
      playing: () => isPlaying
    };
  }

  engine = S.audio ? audioEngine(S.audio) : youtubeEngine(S.youtubeId);

  /* ---------- UI state ---------- */
  let raf = null;
  // only one soundtrack at a time: tell the birthday music to step aside, and step aside for it
  window.addEventListener("gift:audio", (e) => { if (e.detail === "birthday" && engine.playing()) engine.pause(); });

  function setPlaying(on) {
    if (on && !root.classList.contains("is-playing")) window.dispatchEvent(new CustomEvent("gift:audio", { detail: "song" }));
    root.classList.toggle("is-playing", on);
    playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
    if (on && !raf) loop();
    if (on) setStatus("");
  }
  function loop() {
    render();
    raf = engine.playing() ? requestAnimationFrame(loop) : null;
    if (!raf) render();
  }
  function render(tOverride) {
    const t = tOverride !== undefined ? tOverride : engine.time();
    const p = duration ? Math.min(1, t / duration) : 0;
    fill.style.width = p * 100 + "%";
    knob.style.left = p * 100 + "%";
    timeEl.textContent = fmt(t);
    durEl.textContent = fmt(duration);
    seek.setAttribute("aria-valuemax", Math.round(duration));
    seek.setAttribute("aria-valuenow", Math.round(t));
    seek.setAttribute("aria-valuetext", `${fmt(t)} of ${fmt(duration)}`);
    syncLyrics(t);
  }

  playBtn.addEventListener("click", () => (engine.playing() ? engine.pause() : engine.play()));
  $("#songBack").addEventListener("click", () => { engine.seek(Math.max(0, engine.time() - 10)); });
  $("#songFwd").addEventListener("click", () => { engine.seek(Math.min(duration || Infinity, engine.time() + 10)); });

  /* ---------- seek bar: click / drag / keys ---------- */
  function seekFromEvent(e) {
    const r = seek.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    engine.seek(p * (duration || 0));
  }
  seek.addEventListener("pointerdown", (e) => {
    if (!duration) return;
    seek.setPointerCapture(e.pointerId);
    seek.classList.add("is-dragging");
    seekFromEvent(e);
  });
  seek.addEventListener("pointermove", (e) => { if (seek.classList.contains("is-dragging")) seekFromEvent(e); });
  ["pointerup", "pointercancel"].forEach((ev) => seek.addEventListener(ev, () => seek.classList.remove("is-dragging")));
  seek.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { engine.seek(Math.min(duration, engine.time() + 5)); e.preventDefault(); }
    if (e.key === "ArrowLeft") { engine.seek(Math.max(0, engine.time() - 5)); e.preventDefault(); }
  });

  render(0);
})();
