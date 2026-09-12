# OceanEmbed landing design

## Authority and surface
Latest user brief: three sections, pure black, white text, minimalist, Earth hero, GSAP + Lenis + Three.js. This user-pinned direction overrides skill defaults banning black or requiring a different visual theme. Surface mode: Persuade. Code-led work with actual 3D visuals from supplied Earth assets; no image-generated mock UI.

## Visual intent
An orbital perspective becomes a study of ocean depth, then a diagram of the learning mechanism. One dominant visual per section. Generous negative space, expressive but controlled sans-serif type, and no ornamental badges, numbered sections, card grids, fabricated metrics, or decorative stars.

## Tokens and runtime mapping
The canonical runtime tokens live in src/style.css :root. Background --bg #000000; text --text #ffffff; secondary --muted #919195; separators --rule #242427. Display secondary #858589. Font: self-hosted Manrope Variable, weights 350–650. Display tracking -0.05em to -0.065em intentionally tight for the brief's large optical type; body normal. Desktop gutters clamp(24px,5.55vw,100px), mobile 24px. Pill buttons only, open section structure. Dialog radius 16px. No surface shadows.

## Layout
Hero: large left-aligned headline and CTA with a much larger Earth on the right. Mobile text then Earth. Dashboard CTA: left copy and right interactive depth volume, stacked on mobile. Architecture CTA: concise heading and explanation above an open three-stage diagram. A small footer lives inside the third section, not a fourth content section.

## Motion
GSAP handles entry choreography and scroll-linked Earth movement. Lenis uses GSAP's ticker, with native touch scroll and immediate keyboard anchor navigation. Three.js rotates Earth and gently adjusts the depth volume only while visible. A pause control stops ambient visuals; reduced-motion disables smooth scrolling, entrances and ambient animation. Signal pulses communicate the architecture's data flow. No scroll hijacking or forced snapping.

## Behavior
Same-page navigation updates the URL hash and moves focus. Dashboard CTA opens an illustrative interactive regional profile. Architecture CTA opens a concise proposed pipeline explanation. Native dialog handles focus trapping and Escape, with explicit focus restoration. The depth slider supports all 15 standard depths and keyboard input. Loading and WebGL errors preserve readable page content; Earth uses a local rendered poster fallback and depth uses a static geometric study.

## Assets
Earth albedo/cloud textures: extracted from user-supplied models/earth (2).zip, resized to 2048×1024 WebP. Keep the source archive and any upstream licensing obligations intact. Icons: Phosphor regular, one family. No external runtime font, image, map, or API dependency.
