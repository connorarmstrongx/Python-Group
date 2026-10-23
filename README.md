# Python Group — homepage (phase 1)

Static site: plain HTML, CSS and one small JavaScript file. No build step, no dependencies.

## Run locally
    npx serve .        (or: python3 -m http.server 8000)

Open `index.html` through a local server so the fonts and images load.
Deploys as-is to Vercel, Netlify or any static host (set the project root to this folder).

## Structure (flat: every file sits in the repo root)
    index.html, privacy.html, 404.html   Pages
    styles.css                           Design tokens (top of file), layout, motion states
    main.js                              Intro, header, menu, reveals, parallax, craft sequence
    hero-slats.webp, int-*.webp, og.jpg  Imagery (int-* are interiors)
    symbol*.png, logo-*.png, favicon.png Logo files
    vercel.json, robots.txt, sitemap.xml Hosting and SEO config

## Deploy to Vercel
1. Put this folder in a GitHub repo (or run `npx vercel` from this folder).
2. Vercel: Add New > Project > import the repo. Framework preset: Other. No build command, no output directory.
3. Settings > Domains: add pythongroup.co.nz (and www, redirecting to the root).
`vercel.json` sets clean URLs (/privacy), security headers and caching for images.
`robots.txt`, `sitemap.xml`, canonical URLs and share image (og.jpg) are in place.
Search indexing is switched on. To keep the site hidden, set `index, follow` to `noindex, nofollow` in the head of index.html and privacy.html.

## Later
- Replace the PNG logos with traced vector artwork when available (brand guide, p.12).
- Swap in real project photography when ready (update alt text).
- Have privacy.html reviewed by a lawyer; update it if analytics or a CRM is added.

## Imagery
Interiors (`int-*.webp`) are supplied interior images, graded lightly warm.
To swap an image, replace the file in
the repo root (keep the name) or edit the `src`, `width`, `height` and `alt` in index.html.
Aim for 2400px+ wide originals; the current crops are upscaled and soft at large sizes.

## Motion
Everything is gated by the `has-motion` class, set in the head only when the visitor has not
asked for reduced motion. Without it (or without JavaScript) the page is a complete static layout.
