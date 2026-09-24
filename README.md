# Harsh Shukla — Portfolio

Personal site of Harsh Shukla, software engineer (Angular, TypeScript, Node.js) in Noida, India.

**Live:** https://harsh3851.github.io/Portfolio/

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step, no icon font.
IBM Plex Sans and IBM Plex Mono are loaded from Google Fonts and GSAP from jsDelivr; everything else is in this repository.

- Conventional professional layout: hero with portrait and quick facts, key metrics, about, experience timeline, project cards with real screenshots, grouped skills, education, contact
- Scroll choreography with GSAP + ScrollTrigger (CDN): character reveal, photo curtain and parallax, cascades, count-ups, a timeline that draws with scroll, chips that pop; cursor-lit hero grid, spotlight and tilt cards, magnetic buttons, sliding nav indicator, progress bar and ring, circular theme wipe, copy-email toast. If the CDN or JS fails the page is simply static and fully visible
- Light and dark themes (system preference, with a persistent toggle); every animation respects prefers-reduced-motion
- Responsive layout down to 320 px, keyboard-accessible navigation
- Inline SVG icon sprite, optimised images, Open Graph and JSON-LD metadata

## Structure

```
Portfolio/
├── index.html                 # single page: hero, about, experience, projects, skills, contact
├── style.css                  # design tokens, components, responsive rules
├── script.js                  # theme toggle, mobile nav, active section, fade-in, count-up metrics
├── Harsh_Shukla_Resume.pdf    # downloadable resume
└── images/
    ├── harsh.jpg              # portrait (720 px)
    └── og-harsh.jpg           # social preview image
```

## Run locally

Open `index.html` directly, or serve the folder:

```bash
npx --yes serve .
```

## Deploy

GitHub Pages serves the `main` branch. Every push to `main` is live within a minute or two.
