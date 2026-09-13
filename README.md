# OceanEmbed

A three-section public landing, interactive desktop ocean explorer, and responsive architecture showcase built with Vite and vanilla JavaScript. The landing uses Three.js, GSAP, and Lenis; the dashboard uses Canvas2D, D3 geographic projection, and local Natural Earth geometry.

```sh
npm install
npm run dev
npm test
npm run format:check
npm run build
npm run preview
```

Open `/` for the approved landing, `/dashboard/` for the desktop explorer, or `/architecture/` for the architecture showcase. Vite builds all three HTML entry points; deploy the complete `dist/` directory with directory-index support for `/dashboard/` and `/architecture/`.

The explorer supports temperature at 15 depths from 0 to 1,000 m; surface salinity, sea level, and wind stress curl; optional grid, currents, and station overlays; pan/zoom; clickable ocean cells and depth sections; temperature profiles and history; date playback within 2023; coordinate entry; regional presets; saved locations; and CSV profile export. Active selections are reflected in the URL. Saved locations use browser localStorage and fall back to the current session if storage is unavailable.

All ocean fields, reference curves, and sample stations are **synthetic demonstration data**, clearly labelled in the interface and CSV. Coastlines are real geography. There is no trained model, live ocean API, or observed profile dataset. Architecture information describes a proposed system.

The dashboard is a desktop workspace with a minimum width of 1120px and independent sidebar/inspector scrolling. The landing remains mobile responsive, with keyboard navigation, native dialogs, reduced-motion support, an ambient-motion pause control, offscreen rendering suspension, and WebGL fallbacks. Its dashboard CTA opens the explorer; the architecture CTA opens the dedicated showcase.

The architecture page presents a real Three.js conceptual assembly with exploded/assembled states, selectable labelled layers, rotation/reset, and motion pause. Its U-Net diagram, signal trace, six stage tabs, twelve filterable input features, native disclosures, and selectable loss zones explain the proposed pipeline. Keyboard controls, reduced-motion behavior, and a static WebGL fallback preserve access. The full source specification downloads from `/architecture-design.md`. The architecture layout stacks on mobile, with the dense network diagram owning its horizontal overflow.

Earth textures are optimized from the supplied local model archive; the landing does not load the original large GLB. Keep the archive and its upstream licensing obligations intact. Manrope, Phosphor icons, Earth assets, and Natural Earth data are served locally without runtime font, map-tile, image-service, or ocean-API requests.

Implementation entry points are `src/main.js`, `src/dashboard/main.js`, and `src/architecture/main.js`. Dashboard synthetic data lives in `src/dashboard/data.js`; mapping and chart rendering live in the adjacent modules. Shared identity styles live in `src/style.css`, with dashboard layout and controls in `src/dashboard/style.css`. Architecture content, assembly geometry, SVG diagram, and surface styles live in `src/architecture/`. `DESIGN.md` and `.impeccable/design.json` capture the visual system; `PRODUCT.md` describes product scope; `UX-CONTRACT.md` records interaction behavior.

`npm test` runs six Node test groups covering available history dates, active-variable trends, date boundaries, consistent profile sampling, temperature legend coverage, and color clamping. Browser checks during implementation covered dashboard interaction at 1280×800, 1440×900, and 1600×1000 without browser errors. These checks validate the demonstration interface, not scientific accuracy.

Architecture verification covered 1440×1000 and 1280×800 desktop plus 390×844 mobile, model controls, stage synchronization, keyboard tabs, filters/disclosures, loss selection, route navigation, specification download, reduced motion, and forced WebGL fallback. Build, formatting, existing dashboard tests, and the strict design audit passed; the complete interaction run reported zero page errors. Evidence is in `.impeccable/review/architecture-verification.md`. Its local Playwright verification script uses a preinstalled cache and is not a portable project dependency. Vite retains size advisories for the deferred Three.js and dashboard geography chunks.
