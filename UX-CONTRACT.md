# OceanEmbed behavior contract

## Surfaces and source evidence
Landing: approved minimalist public introduction. Dashboard: desktop scientific exploration workspace requested by the user. Scientific variables and domain follow problem_statement.md and architecture_design_v3_final.md. All rendered ocean values are clearly labelled synthetic demonstration data until actual datasets are supplied.

## Canonical UI map
| Capability | Owner | Decision | Verification |
| --- | --- | --- | --- |
| Selection and synchronized state | src/dashboard/main.js | Single state for location, date, depth, active layer and overlays; URL-backed values | Browser select/change/reload checks |
| Region select | Native select in dashboard/index.html | Browser-owned popup acceptable for a short preset list | Keyboard, change, viewport check |
| Date | Native date input | Explicit 2023 range, UTC date-only computations, previous/next buttons | Boundary and invalid-input checks |
| Depth | Native range | 15 discrete standard depths; named shortcut buttons | Arrow, Home, End and layer behavior |
| Forms | Coordinate form in dashboard/index.html | Owned validation, associated labels and inline errors | Invalid, out-of-range, land and valid coordinate tests |
| Scrollbar | src/style.css | Inherited global monochrome scrollbar; inspector owns overflow | Short desktop and keyboard checks |
| Dialog | Native dialog | Escape and close control, focus restoration | Open/close and keyboard test |
| Feedback | dashboard toast | One polite live status region; field errors stay inline | Export, save, clear feedback |

## Workflow rules
- Map click selects an ocean grid cell. Land clicks preserve the current selection and explain how to recover.
- Drag pans; wheel and +/- zoom; reset fits the selected region. Canvas keyboard controls have visible coordinate-form and zoom-button alternatives.
- A depth change updates map, profile marker, values and regional summaries. Surface-only variables disable depth changes and explicitly label their surface nature; returning to temperature restores the chosen depth.
- Map and depth-section views share date/location/depth; section values are sampled along the selected longitude.
- A date change updates all synthetic fields and charts. Invalid or unavailable dates cannot leave stale labels above different data.
- Profile/history tabs are keyboard navigable and keep one selected tab.
- Saved locations use localStorage only for non-sensitive numeric coordinates. Storage failure retains session functionality.
- CSV exports name synthetic provenance, date, coordinates and depth values explicitly. No server request or external write is involved.
- Narrow screens retain a desktop workspace with horizontal scrolling. This is a desktop-only surface; the landing page remains mobile responsive.
