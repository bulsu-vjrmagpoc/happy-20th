# Happy 20th — Birthday Surprise Website

A self-contained website: no build step, no libraries. Open `index.html` in a browser (double-click works), or upload the whole folder to any static host (GitHub Pages, Netlify Drop, Vercel).

## What you need to add

Everything personal lives in **[`js/content.js`](js/content.js)**. Every line marked `✎` is yours to fill in, and anything in `[brackets]` is a placeholder that shows on the site until you replace it.

| What | Where in `content.js` | Image folder |
|---|---|---|
| His name, your name | `name`, `from` | – |
| Optional one-line intro on the landing page | `landing.intro` | – |
| His photo | `birthday.photo` | `assets/images/portrait/` |
| Your birthday message | `birthday.message` | – |
| Memory photos (no captions, by design) | `memories` | `assets/images/memories/` |
| The five letters | `letters[0..4].body`, `letterSignature` | – |
| Puzzle photo of you two | `puzzle.photo` | `assets/images/puzzle/` |
| Hidden photo + special letter | `surprise.photo`, `surprise.letter`, `surprise.signature` | `assets/images/surprise/` |

**Adding a photo:** copy it into the folder, then write its path in quotes:

```js
photo: "assets/images/portrait/him.jpg",
memories: [
  "assets/images/memories/01.jpg",
  "assets/images/memories/02.jpg",
  // …as many as you like (8–14 looks best)
],
```

While a photo is `null`, an empty frame is shown instead, so nothing ever looks broken.

**Writing a letter:** each item in `body` becomes one paragraph:

```js
body: [
  "First paragraph…",
  "Second paragraph…"
]
```

### Photo tips
- JPG, about 1600px on the long side (≈200–400 KB each) keeps the site fast.
- **Puzzle photo:** pick a picture with clear faces and lots of detail across the whole frame. The centre square of it is used, and plain areas (sky, walls) make tiles hard to tell apart.
- Portrait and hidden photo are shown at 4:5. Memories mix square, 4:5 and 4:3 frames, so the centre of each photo matters most.

## The puzzle

- Easy 3×3, Medium 4×4, Hard 5×5, all using the same photo.
- Tiles are shuffled with real legal moves backwards from the solved picture, so every board can be solved.
- Tap/click a tile in the gap's row or column to slide it; swipe on phones; arrow keys on a keyboard.
- Solving it unlocks the Final Surprise. The unlock is remembered on that device. To lock it again (e.g. after testing it yourself), open the browser console and run `localStorage.clear()`.

## Structure

```
index.html          page structure
css/styles.css      all styling (colour tokens at the top)
js/content.js       ✎ every personal text and photo path
js/main.js          loader, confetti, navigation, gallery, letters, flowers, puzzle UI, final surprise
js/bouquet.js       the bouquet illustration (SVG drawn in code)
js/puzzle.js        the sliding-puzzle engine
assets/images/      your photos
```
