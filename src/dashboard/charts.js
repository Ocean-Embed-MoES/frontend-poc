import { profile, history, DEPTHS } from "./data";

export function renderProfile(svg, state) {
  const points = profile(state.lon, state.lat, state.date);
  const x = (value) => 40 + (value / 33) * 221,
    y = (depth) => 25 + (depth / 1000) * 206;
  const path = (key) =>
    points.map((p) => `${x(p[key])},${y(p.depth)}`).join(" ");
  const selected = points[state.depthIndex];
  svg.setAttribute(
    "aria-label",
    `Temperature profile at ${state.lat} north, ${state.lon} east. ${selected.value.toFixed(2)} degrees at ${selected.depth} metres.`,
  );
  svg.innerHTML = `<text x="5" y="12" class="axis-title">Depth (m)</text>${[0, 200, 500, 700, 1000].map((d) => `<line x1="40" x2="261" y1="${y(d)}" y2="${y(d)}" class="chart-grid"/><text x="31" y="${y(d) + 3}" text-anchor="end">${d.toLocaleString()}</text>`).join("")}${[0, 10, 20, 30].map((t) => `<text x="${x(t)}" y="253" text-anchor="middle">${t}</text>`).join("")}<text x="151" y="273" text-anchor="middle" class="axis-title">Temperature (°C)</text><polyline points="${path("reference")}" class="reference-line"/><polyline points="${path("value")}" class="profile-line"/><line x1="40" x2="261" y1="${y(selected.depth)}" y2="${y(selected.depth)}" class="selection-rule"/><circle cx="${x(selected.value)}" cy="${y(selected.depth)}" r="4" class="profile-point"/>`;
}
export function renderHistory(svg, state) {
  const points = history(
    state.lon,
    state.lat,
    DEPTHS[state.depthIndex],
    state.date,
  );
  const low = Math.floor(
      Math.min(...points.map((p) => Math.min(p.value, p.reference))) - 0.5,
    ),
    high = Math.ceil(
      Math.max(...points.map((p) => Math.max(p.value, p.reference))) + 0.5,
    );
  const x = (i) =>
      points.length === 1 ? 151 : 40 + (i / (points.length - 1)) * 221,
    y = (v) => 231 - ((v - low) / (high - low)) * 206;
  svg.setAttribute(
    "aria-label",
    `Temperature history for the selected point and depth. ${points.length} available daily samples ending on ${state.date}.`,
  );
  svg.innerHTML = `<text x="5" y="12" class="axis-title">Temperature (°C)</text>${[
    0, 0.25, 0.5, 0.75, 1,
  ]
    .map((f) => {
      const v = low + (high - low) * f;
      return `<line x1="40" x2="261" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/><text x="31" y="${y(v) + 3}" text-anchor="end">${v.toFixed(1)}</text>`;
    })
    .join(
      "",
    )}${points.map((p, i) => (i % 2 === 0 ? `<text x="${x(i)}" y="253" text-anchor="middle">${p.date.slice(8)}</text>` : "")).join("")}<text x="151" y="273" text-anchor="middle" class="axis-title">Day of month</text><polyline points="${points.map((p, i) => `${x(i)},${y(p.reference)}`).join(" ")}" class="reference-line"/><polyline points="${points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}" class="profile-line"/>${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="2.5" class="profile-point"/>`).join("")}`;
}
export function renderSparkline(svg, points) {
  svg.setAttribute("viewBox", "0 0 140 45");
  const min = Math.min(...points.map((p) => p.value)) - 0.08,
    max = Math.max(...points.map((p) => p.value)) + 0.08;
  const path = points
    .map(
      (p, i) =>
        `${(i / Math.max(1, points.length - 1)) * 136 + 2},${40 - ((p.value - min) / (max - min)) * 35}`,
    )
    .join(" ");
  svg.innerHTML =
    points.length === 1
      ? '<circle cx="70" cy="22" r="2" fill="#b9c9c8"/>'
      : `<polyline points="${path}" fill="none" stroke="#b9c9c8" stroke-width="1.3" vector-effect="non-scaling-stroke"/>`;
}
