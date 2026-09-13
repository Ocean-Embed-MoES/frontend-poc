# OceanEmbed
<!-- impeccable:product-schema 1 -->

## Platform
web

## Purpose and users
OceanEmbed proposes daily reconstruction of subsurface ocean temperature from satellite observations for the North Indian Ocean. The public landing introduces the concept to SIH judges, scientists, and visitors. The desktop explorer demonstrates how researchers could inspect ocean fields, depth profiles, and changes over time.

## Current scope
The approved landing retains exactly three sections: Earth hero, dashboard CTA, and architecture CTA. Dashboard entry navigates to `/dashboard/`; the architecture CTA opens the dedicated `/architecture/` showcase. The landing remains responsive and preserves its approved visual identity.

The interactive desktop dashboard includes temperature at 15 depths, surface salinity, sea surface height, wind stress curl, grid/current/station overlays, map pan and zoom, ocean-cell selection, a clickable latitude–depth temperature section, profile and history charts, coordinate entry, regional presets, date stepping and playback, saved locations, and CSV profile export. The date range is the 2023 calendar year. Geography covers 5–30° N and 45–105° E on a 0.25° grid.

The workspace has a minimum width of 1120px. The sidebar and inspector scroll independently; small windows retain the desktop arrangement. Shareable URL state includes variable, depth index, date, coordinates, region, and map/section view. Up to eight saved coordinate pairs persist in localStorage, with a session fallback when storage is unavailable.

## Architecture showcase
The responsive `/architecture/` page explains the proposed system through a conceptual Three.js assembly with six selectable layers: observations, temporal fusion, attention encoder, satellite embedding, reconstruction decoder, and temperature output. Exploded/assembled states, rotation, reset, and motion pause expose the spatial model. A synchronized U-Net diagram includes tensor dimensions, skip connections, stage explanations, and replayable signal flow. Twelve input features can be filtered by observed, derived, and context categories, with native expandable explanations. Training and validation content includes selectable depth-loss zones and clearly separates proposed evaluation from measured results.

The downloadable `/architecture-design.md` is a local copy of the supplied architecture specification. This page is a conceptual software explanation, not a physical device or evidence of a trained model. Reduced motion retains immediate controls. If WebGL is unavailable, a static assembly and stage explanations remain available while unavailable model controls are disabled.

## Brand commitments
The user approved pure black backgrounds, white text, minimalist composition, an Earth hero, and purposeful animation. Preserve that identity with Manrope and Phosphor regular. The dashboard carries the same visual language through dark tonal surfaces and compact controls, with scientific color reserved for its maps, sections, and legends.

## Evidence
Scientific requirements: `problem_statement.md`. Proposed scientific implementation: `architecture_design_v3_final.md`. Original broader website brief: `Brief.md`. The approved landing is extended by an interactive desktop dashboard and a dedicated architecture product showcase. Local Earth textures come from the user-supplied `models/earth (2).zip`. Coastlines and country boundaries use local Natural Earth geography supplied through `world-atlas`.

## Data integrity
Every ocean value is deterministic synthetic demonstration data. Temperature, salinity, sea level, wind, currents, reference curves, and sample stations are illustrative; they are not satellite observations, ARGO measurements, or trained model predictions. Dashboard provenance is visible in the interface and exported CSV. The inspector's profile and history remain temperature charts; regional trends follow the selected variable. Early January history contains only the available dates.

Architecture descriptions remain a proposed system design. There is no real ocean API integration, trained inference backend, authentication, or server-side persistence. Do not imply measured model performance, INCOIS endorsement, or operational data availability. Actual dataset/model integration remains future work.
