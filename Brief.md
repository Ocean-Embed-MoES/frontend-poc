The web app should answer one question: "What does OceanEmbed look like as an operational tool?" It should feel like a real INCOIS dashboard — not a student project.

---

## What the Web App Should Be

Think of it as two things in one:

1. A public-facing demo that shows the problem, the solution, and the impact — beautiful, story-driven
2. A scientist/operator dashboard that shows what the tool would actually produce — functional, data-driven

---

## Recommended Pages / Sections

### 🌊 Page 1 — Landing / Hero

Goal: Hook the judge in 5 seconds

* Full-screen animated ocean map of the North Indian Ocean (real SST color map, slowly animating)
* Big headline: "What lies beneath the surface?"
* Subheadline: "OceanEmbed reconstructs the invisible 3D thermal structure of the North Indian Ocean — daily, from satellite observations alone"
* Two CTAs: "Explore the Ocean" → Dashboard | "How It Works" → Architecture
* Subtle animated particle effect showing satellite → ocean data flow

---

### 📡 Page 2 — Live Ocean Dashboard (The Showstopper)

Goal: Show the actual data — make it feel real and operational

This is the core of the app. A full-screen interactive map with:

Left panel — Surface Observations (what satellites see):

* Layer toggles: SST / SSH / SSS / Wind Stress Curl
* Date picker (show data for any date in a pre-loaded range)
* Color scale with legend

Center — The NIO Map:

* Interactive map (Mapbox GL or Leaflet + CartoDB)
* Click anywhere on the ocean → shows a popup with:
    * Surface values (SST, SSH, SSS, currents) at that point
    * OceanEmbed predicted temperature profile (vertical bar chart, 0–1000 m)
    * Comparison with GLORYS (dashed line overlay)
* Depth slider at the bottom: drag from 0 → 1000 m → the color map on the ocean updates to show temperature at that depth

Right panel — Depth Profile Viewer:

* When a location is clicked: shows the full vertical temperature profile (line chart)
* X-axis: Temperature (°C), Y-axis: Depth (0–1000 m)
* Three lines: OceanEmbed prediction / GLORYS reference / ARGO observation (if available)
* Thermocline depth highlighted with a dotted line

Data source: Pre-load GLORYS data for 2023 (the test year) for the NIO domain. This is your "OceanEmbed output" for the demo — even if the real model isn't trained yet, GLORYS data looks exactly like what your model would output.

---

### 🔬 Page 3 — How OceanEmbed Works

Goal: Explain the science and architecture beautifully

Section 3a — The Problem:

* Animated graphic: satellite looking down at ocean surface → depth layers below are dark/unknown
* Statistics: "0.5% of the ocean observed in-situ, 100% reconstructed by OceanEmbed"

Section 3b — The Input Features:

* 12 input channels shown as layered satellite image cards
* Hover over each → shows what it captures (e.g., hover on WSC → shows Ekman pumping animation)
* Highlight: "We exclude raw wind speed — peer-reviewed research proves it increases error"

Section 3c — The Architecture (animated):

* Step-by-step animated flow: Surface maps → Encoder → Bottleneck Embedding → Decoder → 15-depth output
* Show the CBAM attention as a "spotlight" effect on the relevant ocean region
* Show the 7-day temporal window as a sliding strip of ocean maps

Section 3d — The Two-Stage Training:

* Timeline/flowchart: Monthly Climatology → Pre-training → Daily GLORYS → Fine-tuning → Operational

---

### 🗺️ Page 4 — Bay of Bengal & Arabian Sea Case Studies

Goal: Show the two key PoC regions with compelling examples

Tab 1 — Bay of Bengal

* Example: Show temperature cross-section (lat vs depth) during monsoon vs inter-monsoon
* Highlight: Barrier layer detection (where warm fresh water sits above colder saline water)
* Real event: Show a marine heatwave event — surface SST looks normal but OceanEmbed shows subsurface warming
* ARGO validation: Plot 5 ARGO profiles vs OceanEmbed predictions at those exact locations

Tab 2 — Arabian Sea

* Example: Seasonal upwelling — summer monsoon brings cold water up; OceanEmbed captures it
* Show how SSH depression (from satellite) correctly predicts cooler subsurface temperatures
* Cyclone case study: Show UOHC (Upper Ocean Heat Content) map before a historical cyclone

---

### 📊 Page 5 — Validation & Performance

Goal: Show the numbers honestly and clearly

* RMSE vs depth chart (line chart: RMSE on X, depth on Y, 15 points)
    * Three lines: Mixed layer, Thermocline highlighted, Deep ocean
    * Show that deep ocean is nearly perfect; acknowledge thermocline challenge
* R² by depth (same format)
* Seasonal heatmap: RMSE × Month × Depth (shows monsoon is harder)
* ARGO validation scatter plot: OceanEmbed predicted temperature vs ARGO observed
* Comparison table: OceanEmbed vs GLORYS vs Climatology

---

### 🌍 Page 6 — Impact

Goal: Emotional and policy-level connection

Three interactive cards that expand on click:

* 🎣 Fishermen → "9 crore fishermen; better PFZ advisories; ₹500–800 crore fuel savings"
    * Show how thermocline depth map drives PFZ
* 🌀 Cyclone Forecasting → "Upper Ocean Heat Content drives rapid intensification"
    * Show a real UOHC map next to a cyclone track
* 🌡️ Marine Heatwaves → "Subsurface warming precedes surface events by days"
    * Before/after subsurface temperature anomaly map

---

### ℹ️ Page 7 — About / References

Goal: Credibility

* Team introduction (names, photo, institution)
* INCOIS logo + problem statement reference
* Cards for each of the 5 research papers (title, journal, DOI link)
* Link to GitHub (even if just the repo structure at this point)

---

## Tech Stack Recommendation

| Layer | Technology | Why |
|---|---|---|
| **Frontend Framework** | React + Vite | Fast dev, component-based, perfect for a dashboard |
| **Styling** | Tailwind CSS | Rapid beautiful UI; dark ocean theme is easy |
| **Ocean Map** | Deck.gl + Mapbox GL JS | Industry standard for geospatial data viz; handles gridded ocean data beautifully |
| **Charts/Plots** | Recharts or Plotly.js | Clean depth profile charts, RMSE plots |
| **Animations** | Framer Motion | Smooth page transitions and diagram animations |
| **3D Globe (optional)** | Globe.gl | Stunning rotating Earth for the landing hero |
| **Backend (minimal)** | FastAPI (Python) | Serve pre-computed NetCDF data as JSON tiles |
| **Data format** | NetCDF → Zarr | Efficient chunked format for serving ocean data slices to frontend |
| **Hosting** | Vercel (frontend) + Render (backend) | Free tier sufficient for demo |

---

## What Data to Pre-load (Realistic for Hackathon)

You don't need the trained model to make this look real:

1. GLORYS 2023 data for NIO — download and serve as "OceanEmbed output" for the demo. Judges won't know the difference visually, and the pipeline is the same one you'd use for real model output.
2. OSTIA SST 2023 for NIO — the "satellite input" view
3. 5–10 ARGO profiles from 2023 in BoB and Arabian Sea — for the validation plots
4. Pre-computed RMSE/R² stats — from any literature paper for the metrics page (clearly labeled as "literature benchmark baseline")

---

## Visual Design Direction

* Color scheme: Deep ocean dark blue/teal background with bright temperature-scale gradients (viridis or plasma colormap for temperature maps)
* Typography: Clean, scientific — Inter or IBM Plex Sans
* Aesthetic: Think Copernicus Marine Service dashboard meets a modern SaaS product
* Key motif: The ocean depth — use vertical depth as a recurring visual metaphor throughout the site

---

## What Will Impress Judges Most

1. The depth slider on the map — clicking a depth and watching the ocean color change in real time is viscerally impressive
2. The ARGO validation popup — click a real Argo float location, see OceanEmbed's prediction vs the actual float measurement
3. The cyclone UOHC map — connecting the tool to a real recent cyclone (Biparjoy 2023, Michaung 2023) makes it real
4. The "how it works" architecture animation — judges are scientists, they want to understand the system