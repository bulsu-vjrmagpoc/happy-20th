/* ==========================================================================
   Birthday music — a soft music-box "Happy Birthday" synthesized live with the
   Web Audio API (the melody is public domain; no audio file needed).
   • starts only after a user gesture (browsers block autoplay)
   • a single instance, looping gently until muted
   • yields to the "Ngiti" song player and vice versa
   ========================================================================== */

(function () {
  const STORE_KEY = "bday20-music-muted";
  const BEAT = 0.62;                                   // seconds per beat (3/4, unhurried)
  const GAP = 3;                                       // pause between repeats
  const F = { F2: 87.31, G2: 98, A2: 110, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196,
              G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  const MELODY = [
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
    ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3]
  ];
  const CH = { C: ["C3", "E3", "G3"], G: ["G2", "B2", "D3"], G7: ["G2", "B2", "F3"], F: ["F2", "A2", "C3"] };
  const CHORDS = [[1, 3, "C"], [4, 3, "G"], [7, 3, "G7"], [10, 3, "C"], [13, 3, "C"], [16, 3, "F"], [20, 2, "C"], [22, 1, "G"], [23, 3, "C"]];
  const SONG_BEATS = MELODY.reduce((a, [, b]) => a + b, 0);

  let ctx = null, master = null, bus = null, nodes = [], loopTimer = null;
  let started = false, on = false, pausedForSong = false;
  const btn = document.getElementById("musicToggle");

  let muted = false;
  try { muted = localStorage.getItem(STORE_KEY) === "1"; } catch (e) { /* storage unavailable */ }

  function setup() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);

    // gentle room reverb from a generated impulse
    const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = .32;
    bus = ctx.createGain();
    bus.connect(master);
    bus.connect(verb).connect(wet).connect(master);
    return true;
  }

  function keep(n) { nodes.push(n); n.onended = () => { nodes = nodes.filter((x) => x !== n); }; return n; }

  function bell(freq, t, dur) {                         // music-box tone
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.22, t + .006);
    g.gain.exponentialRampToValueAtTime(.0008, t + Math.max(1.4, dur + .9));
    g.connect(bus);
    [[1, 1, "sine"], [2, .32, "sine"], [3, .08, "triangle"], [4.01, .05, "sine"]].forEach(([m, a, type]) => {
      const o = keep(ctx.createOscillator());
      const og = ctx.createGain(); og.gain.value = a;
      o.type = type; o.frequency.value = freq * m;
      o.connect(og).connect(g);
      o.start(t); o.stop(t + Math.max(1.5, dur + 1));
    });
  }

  function pad(freqs, t, dur) {                          // soft sustained chord
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.05, t + .3);
    g.gain.setValueAtTime(.05, t + dur - .15);
    g.gain.linearRampToValueAtTime(0, t + dur + .5);
    lp.connect(g).connect(bus);
    freqs.forEach((f) => [-4, 4].forEach((cents) => {
      const o = keep(ctx.createOscillator());
      o.type = "triangle"; o.frequency.value = f; o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(t + dur + .6);
    }));
  }

  function playOnce(t0) {
    let beat = 0;
    MELODY.forEach(([n, b]) => { bell(F[n], t0 + beat * BEAT, b * BEAT); beat += b; });
    CHORDS.forEach(([s, l, c]) => pad(CH[c].map((n) => F[n]), t0 + s * BEAT, l * BEAT));
    const next = t0 + SONG_BEATS * BEAT + GAP;
    loopTimer = setTimeout(() => { if (on) playOnce(next); }, Math.max(0, (next - ctx.currentTime - .4) * 1000));
  }

  function fadeTo(v, time = .4) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(v, t + time);
  }

  function play() {
    if (!ctx && !setup()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (on) return;
    on = true; pausedForSong = false;
    clearTimeout(loopTimer);
    fadeTo(.5, .6);
    playOnce(ctx.currentTime + .15);
    window.dispatchEvent(new CustomEvent("gift:audio", { detail: "birthday" }));
    render();
  }

  function stop() {
    if (!on) return;
    on = false;
    clearTimeout(loopTimer);
    fadeTo(0, .35);
    const old = nodes.slice(); nodes = [];
    setTimeout(() => old.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } }), 400);
    render();
  }

  function render() {
    if (!btn) return;
    btn.hidden = !started;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Mute the birthday music" : "Play the birthday music");
  }

  if (btn) btn.addEventListener("click", () => {
    if (on) { stop(); muted = true; } else { muted = false; play(); }
    try { localStorage.setItem(STORE_KEY, muted ? "1" : "0"); } catch (e) { /* storage unavailable */ }
  });

  // the other song took over → step aside quietly
  window.addEventListener("gift:audio", (e) => {
    if (e.detail === "song" && on) { stop(); pausedForSong = true; }
  });

  window.BirthdayMusic = {
    // called from the "Open your surprise" click — a real user gesture
    start() {
      started = true;
      if (!muted) play(); else render();
    },
    isOn: () => on
  };
})();
