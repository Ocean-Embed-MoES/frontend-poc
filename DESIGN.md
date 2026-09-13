---
name: OceanEmbed
description: A monochrome ocean research identity, from orbital introduction to desktop exploration.
colors:
  bg: "#000"
  text: "#fff"
  muted: "#919195"
  rule: "#242427"
  display-secondary: "#858589"
  sidebar: "#060606"
  workspace: "#090909"
  inspector: "#0d0d0d"
  control-surface: "#151515"
  export-surface: "#f4f4f4"
  export-text: "#0a0a0a"
  map-low: "#273865"
  map-blue: "#2f6688"
  map-teal: "#458e98"
  map-green: "#80b5a3"
  map-mid: "#c4c89b"
  map-sand: "#e1ba7c"
  map-high: "#db8d62"
typography:
  display:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "clamp(78px, 8.3vw, 132px)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.065em"
  headline:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "clamp(54px, 5.2vw, 82px)"
    fontWeight: 450
    lineHeight: 1.12
    letterSpacing: "-0.05em"
  workspace-title:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "23px"
    fontWeight: 500
    letterSpacing: "-0.7px"
  body:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "14px"
    lineHeight: 1.9
  workspace-body:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "12px"
  button-label:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: "13px"
    fontWeight: 650
rounded:
  field: "4px"
  compact: "5px"
  control: "6px"
  dialog: "16px"
  pill: "100px"
spacing:
  gutter: "clamp(24px, 5.55vw, 100px)"
  mobile-gutter: "24px"
  control-gap: "9px"
  panel-gap: "20px"
components:
  button-light:
    backgroundColor: "{colors.text}"
    textColor: "{colors.bg}"
    typography: "{typography.button-label}"
    rounded: "{rounded.pill}"
    padding: "19px 25px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.button-label}"
    rounded: "{rounded.pill}"
    padding: "19px 25px"
  button-export:
    backgroundColor: "{colors.export-surface}"
    textColor: "{colors.export-text}"
    rounded: "{rounded.control}"
    padding: "10px 13px"
  coordinate-input:
    backgroundColor: "{colors.control-surface}"
    rounded: "{rounded.field}"
    padding: "8px"
  workspace-nav:
    rounded: "{rounded.control}"
    padding: "10px"
  demo-badge:
    rounded: "{rounded.field}"
    padding: "3px 6px"
  regional-summary:
    rounded: "{rounded.control}"
    padding: "11px 14px"
---

# Design System: OceanEmbed

## Overview

**Creative North Star: "Ocean depth, in focus"**

OceanEmbed carries the approved pure-black, white-text landing identity into a compact scientific workspace. The orbital Earth, depth volume, and learning diagram remain the landing page's dominant visuals. The dashboard gives that same visual restraint a denser expression through a large geographic canvas, quiet controls, and a persistent location inspector.

This is an extraction of the implemented world, not a new visual direction. Self-hosted Manrope and Phosphor regular icons connect both surfaces. Data color explains ocean fields; it does not become decorative brand color.

**Key Characteristics:**

- Pure-black landing canvas and near-black workspace surfaces.
- Large optical landing type and compact dashboard hierarchy.
- Fine separators, restrained rounded controls, and no elevated card treatment.
- Purposeful motion with reduced-motion support.

## Colors

### Primary

White is the primary action and emphasis color. Black provides the landing ground and inverted text on primary actions. Runtime base tokens are in `src/style.css`; dashboard surface styles are in `src/dashboard/style.css`.

### Secondary

The seven-step ocean palette in `src/dashboard/data.js` progresses from deep blue through muted teal and green to sand and warm orange. Use it for the geographic field, depth cross-section, and their quantitative legends. Map temperature bounds change with depth; legends must remain synchronized with the field.

### Neutral

Muted gray supports explanatory copy; display-secondary distinguishes the quieter line of a large headline. Fine rule gray separates sections. Sidebar, workspace, inspector, and control surfaces create subtle tonal boundaries without ornamental color.

**The Data Color Rule.** Keep scientific color inside data visualizations and legends. Interface chrome stays monochrome; coordinate validation may use the existing muted error text and border.

## Typography

Manrope Variable is self-hosted and used throughout, with sans-serif fallback. Landing headings use tight optical tracking and light-to-medium weight. Supporting paragraphs remain normal-reading text with generous line height. Dashboard title, controls, and numeric readouts use a smaller hierarchy; depth, coordinates, and field values use tabular numerals where implemented.

The frontmatter captures desktop roles. Mobile landing display type changes to `clamp(67px, 12.8vw, 96px)` and section headings to `clamp(43px, 8.2vw, 62px)`. Dashboard controls mostly use 10–12px text, with smaller metadata. Phosphor regular is the sole icon family; do not introduce a second icon style.

## Layout

The landing retains exactly three sections: left copy and a large right Earth; exploration copy and depth volume; architecture copy and an open three-stage diagram. The small footer belongs to the third section. Mobile layouts stack copy and visuals with the mobile gutter. Large landing sections cap at 1500px above the wide-screen breakpoint.

The desktop dashboard fills the viewport with a 210px sidebar, flexible central visualization, and 290px inspector. At 1600px and above the sidebar and inspector become 230px and 320px. Header, toolbar, depth strip, regional overview, and status footer surround the remaining map area. The sidebar and inspector own vertical overflow. Minimum workspace width is 1120px; narrower windows scroll horizontally. Minimum height is normally 740px, reduced to 700px at heights up to 800px, so shorter viewports can also overflow vertically. This surface has no mobile rearrangement.

The `/architecture/` showcase extends the open landing composition: a large left headline and monochrome exploded model lead into signal flow, feature explanations, training/validation, and a closing explorer CTA. Architecture sections cap at 1800px and share the global gutter. At 900px and below the hero and content stack; 600px refines mobile labels and changes six stage tabs to two rows. The network diagram retains an 850px minimum width inside its own horizontal scroller. Architecture display type uses `clamp(72px, 6.5vw, 110px)`, weight 480, line-height 1.07, and tracking -0.055em. These are surface-specific variants, not replacements for the existing landing roles.

## Elevation & Depth

Panels remain flat, separated by strokes and small changes in dark surface tone. There are no surface drop shadows. The landing range thumb has a subtle white halo, and architecture input planes use an inset black shade to reinforce their geometric depth. Native dialogs use a dark blurred backdrop, a fine border, and explicit focus restoration.

GSAP choreographs landing entrances and scroll-linked Earth movement; Lenis follows the GSAP ticker. Three.js ambient movement runs only while relevant visuals are visible and respects the pause control. The dashboard uses a brief entrance only; map updates respond directly to interaction. Reduced motion removes entrances, ambient motion, smooth scrolling, and CSS transitions.

Architecture depth comes from actual Three.js geometry, fine wire edges, monochrome planes, and projected leader lines. Assembly and explosion are interruptible, with bounded manual rotation and a pause control. GSAP coordinates entrance, scroll orientation, and signal tracing through Lenis. Reduced-motion and keyboard activations apply immediate state changes. The static fallback keeps labels and scientific explanations readable when WebGL fails.

## Shapes

Landing CTAs use pill silhouettes. Dashboard controls and regional summaries use restrained small-radius rectangles. Native dialogs have broader rounded corners. The orbital wordmark uses three overlapping white ellipses; retain its proportions. Layer selection uses small radio circles, and overlays use compact switches.

## Components

### Buttons

Landing primary actions are white pills with black text, darkening slightly on hover; outlined actions invert on hover. They compress slightly when pressed, with directional icon movement. Dashboard export uses a compact white rectangle; secondary actions use transparent dark surfaces and fine borders. White focus outlines remain visible, with smaller offsets in the dense workspace.

### Inputs and switches

Coordinate inputs have dark fills, fine gray borders, persistent labels, inline errors, and an adjacent locate action. Region and date controls use native browser controls. The depth range selects 15 discrete levels and has labelled shortcut buttons. Surface-only layers disable depth controls while preserving the temperature depth selection. Switches communicate overlay state through thumb position and monochrome fill.

### Navigation and tabs

Sidebar navigation uses muted text, a subtle hover surface, and a brighter filled active row. Map/section and profile/history tabs use an underline for selection and support arrow, Home, and End keys. Navigation back to the landing preserves the approved architecture anchor.

### Badges and regional summaries

The small outlined Demo badge and persistent dataset/status text communicate provenance. Regional summaries pair a numeric value with a muted sparkline and act as region shortcuts. They are dashboard instruments, not a pattern to add to the open landing layout.

### Map and inspector

Canvas2D renders the map and clickable depth section using local geography. Layer, date, depth, location, legend, regional summaries, and inspector update together. The inspector shows temperature depth profile or temperature history, plus surface values; regional sparklines follow the active variable. Coordinate entry and zoom buttons complement canvas gestures. Saved locations and CSV export use explicit local feedback.

### Architecture assembly and signal flow

Six projected layer labels select the matching model layer, network stage, and explanation. Exploded/assembled controls reuse the pill language; rotate, reset, and pause use compact circular buttons. The architecture remains a conceptual learning pipeline, not a hardware object. Solid network paths and dashed skip connections have a visible legend. Tensor dimensions omit batch size and follow the supplied specification. Keep labels and leader lines attached to the actual displayed layers.

Feature explanations use open ruled rows with native disclosures, compact category filters, and an accurate visible count. Stage tabs and filters show selection through white text and fine underlines. Loss-zone controls use monochrome inversion for selection and keep Surface above 1,000 m. The downloadable specification and explorer CTA are ordinary working links. Landing and dashboard navigation now point to `/architecture/`; their approved compositions and controls remain intact.

## Do's and Don'ts

### Do:

- Do preserve the approved three-section landing composition and Earth assets.
- Do use Manrope and Phosphor consistently across both surfaces.
- Do keep map legends, units, depth, date, and selection synchronized.
- Do retain visible focus, reduced motion, and explicit demonstration labels.

### Don't:

- Don't add ornamental badges, decorative stars, fabricated metrics, or card grids to the landing.
- Don't turn the scientific map palette into interface decoration.
- Don't imply that synthetic fields are observations or trained model results.
- Don't silently collapse the desktop dashboard into a mobile layout.
- Don't present the conceptual architecture assembly as physical hardware or measured model performance.
