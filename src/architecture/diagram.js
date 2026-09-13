const NS = "http://www.w3.org/2000/svg";
export function buildNetwork(svg) {
  const parts = [];
  const text = (x, y, value, cls = "") =>
    `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${value}</text>`;
  const block = (x, y, w, h, label, sub, stage, bright = false) => {
    parts.push(
      `<g data-network-stage="${stage}"><path class="block-top" d="M${x} ${y}l12 -9h${w}l-12 9z"/><path class="block-side" d="M${x + w} ${y}l12 -9v${h}l-12 9z"/><rect class="block-face ${bright ? "bright" : ""}" x="${x}" y="${y}" width="${w}" height="${h}"/>${Array.from({ length: Math.floor(h / 12) - 1 }, (_, i) => `<path class="block-grid" d="M${x + 5} ${y + 12 + i * 12}h${w - 10}"/>`).join("")}${text(x + w / 2, y + h + 26, label, "block-label")}${text(x + w / 2, y + h + 44, sub, "block-sub")}</g>`,
    );
  };
  const links = [
    "M148 207H222",
    "M278 207H356",
    "M410 207H443V241H459",
    "M503 241H530V269H550",
    "M588 269H634V280H651",
    "M715 280H753V269H785",
    "M823 269H843V241H876",
    "M920 241H940V207H961",
    "M1015 207H1060",
  ];
  parts.push(
    `<defs><marker id="signal-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1l6 3-6 3" fill="none" stroke="#858589"/></marker></defs><g class="flow-paths">${links.map((d) => `<path d="${d}" marker-end="url(#signal-arrow)"/>`).join("")}</g><g class="trace-paths">${links.map((d) => `<path d="${d}" pathLength="1"/>`).join("")}</g>`,
  );
  parts.push(
    `<g class="skip-paths"><path d="M383 130V64Q383 52 395 52H976Q988 52 988 64V130"/><path d="M481 178V99Q481 87 493 87H886Q898 87 898 99V178"/><path d="M569 222V145Q569 133 581 133H792Q804 133 804 145V222"/></g>${text(684, 36, "Spatial detail via skip connections", "skip-label")}`,
  );
  for (let i = 3; i >= 0; i--)
    block(70 + i * 8, 121 - i * 8, 54, 172, "", "", "inputs");
  parts.push(
    text(109, 336, "84 channels", "block-label") +
      text(109, 354, "100 × 240", "block-sub"),
  );
  block(224, 160, 54, 94, "12", "100 × 240", "fusion");
  block(358, 130, 52, 154, "64", "100 × 240", "encoder");
  block(459, 178, 44, 126, "128", "50 × 120", "encoder");
  block(550, 222, 38, 94, "256", "25 × 60", "encoder");
  block(651, 246, 64, 69, "512", "12 × 30", "embedding", true);
  block(785, 222, 38, 94, "256", "25 × 60", "decoder");
  block(876, 178, 44, 126, "128", "50 × 120", "decoder");
  block(961, 130, 54, 154, "64", "100 × 240", "decoder");
  parts.push(
    `<g data-network-stage="output">${Array.from({ length: 15 }, (_, i) => `<path class="output-sheet" d="M1065 ${122 + i * 11}l22 -12h58l-22 12z"/>`).join("")}${text(1108, 336, "15 depths", "block-label")}${text(1108, 354, "100 × 240", "block-sub")}</g>`,
  );
  parts.push(
    text(246, 122, "Temporal", "group-label") +
      text(246, 140, "fusion", "group-label") +
      text(477, 403, "ENCODER + CBAM", "group-label") +
      text(683, 403, "EMBEDDING", "group-label") +
      text(900, 403, "DECODER + CBAM", "group-label"),
  );
  const group = document.createElementNS(NS, "g");
  group.innerHTML = parts.join("");
  svg.append(group);
}
