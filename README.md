# Portfolio site

Static multi-page site built from the content in `Portfolio.pptx`.
No build step, no dependencies — open `index.html` in a browser.

## Pages

| File | What it is |
|---|---|
| `index.html` | Home — hero, stats, 3 featured projects, skills |
| `projects.html` | Full project index with working filter buttons |
| `research.html` | MVS compact modelling, GaN HEMT research, publications |
| `about.html` | Bio, experience timeline, education |
| `contact.html` | Contact form + links |
| `project-*.html` | Six project detail pages |
| `project-evb.html` | **Blank template** — copy this for new projects |
| `images/` | PCB renders, schematics and diagrams extracted from the deck |
| `style.css` | All styling. Theme colours are the CSS variables at the top |

## Still to fill in

Everything else is real content pulled from your deck. These are the gaps:

- [ ] **Equans bullets** (`about.html`) — the deck links to this section but never spells it out
- [ ] **Hobbies paragraph** (`about.html`) — same, slide 20 promises it
- [ ] **Graduation year / coursework** (`about.html`)
- [ ] **Availability date** (`about.html`)
- [ ] **LinkedIn URL** — currently `#` in every page footer and on `contact.html`
- [ ] **CSSTC paper link** (`research.html`) — the `Read the conference paper` button
- [ ] **STM32 design doc link** (`project-stm32-alarm.html`)
- [ ] **Scope capture captions** (`project-gan-platform.html`) — I wrote them from the
      instrument settings visible on screen; you know which node each probe was on and
      what mode the board was in, so tighten them
- [ ] **`resume.pdf`** — drop it in this folder, the nav already links to it
- [ ] **Contact form** — sign up at [formspree.io](https://formspree.io), paste your ID into `contact.html`

## Two things to double-check

1. The deck says **dsPIC32GS502**; your repo's project config says **dsPIC33EP32GS502**.
   I used the repo value. Fix whichever is wrong.
2. The deck says **850 V** GaN BDS on slide 8, but the board silkscreen and the repo
   README both say **900 V**. I used 900 V.

## Re-theming

Everything is driven by the variables at the top of `style.css`:

```css
--accent:     #35e0a1;   /* signal green — the main accent */
--accent-alt: #4cc9f0;   /* probe cyan — spec values */
--bg:         #0a0d10;   /* page background */
```

Change `--accent` and the whole site follows.

## Publishing

1. **GitHub Pages** — push this folder to a repo, Settings → Pages → deploy from branch.
2. **Netlify / Cloudflare Pages** — drag the folder onto their dashboard.
3. Point a custom domain at either.
