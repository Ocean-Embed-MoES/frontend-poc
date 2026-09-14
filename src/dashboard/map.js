import { geoMercator, geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-50m.json";
import { wheelZoomFactor, zoomAt } from "./zoom";
import {
  sample,
  colorAt,
  valueRange,
  DEPTHS,
  LAYERS,
  coordinates,
} from "./data";

const land = feature(world, world.objects.land);
const countries = feature(world, world.objects.countries);
const regionCountries = countries.features.filter((f) =>
  [
    "356",
    "144",
    "586",
    "004",
    "364",
    "512",
    "887",
    "682",
    "050",
    "104",
    "764",
    "458",
    "360",
    "706",
    "231",
    "262",
    "232",
    "784",
    "634",
    "414",
  ].includes(f.id),
);
const cities = [
  ["INDIA", 79, 25],
  ["PAKISTAN", 67, 29],
  ["OMAN", 57.5, 22],
  ["YEMEN", 48, 16.5],
  ["SRI LANKA", 81.1, 7],
  ["MYANMAR", 96.5, 23],
  ["SAUDI ARABIA", 45.7, 24.5],
  ["THAILAND", 101, 17],
];
const stations = [
  [65, 15],
  [88, 15],
  [72, 11],
  [85, 10],
  [63, 21],
];

export function createOceanMap(canvas, onSelect, onMessage) {
  const ctx = canvas.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 2880;
  maskCanvas.height = 1440;
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const maskProjection = geoEquirectangular()
    .scale(2880 / (2 * Math.PI))
    .translate([1440, 720]);
  maskCtx.beginPath();
  geoPath(maskProjection, maskCtx)(land);
  maskCtx.fill();
  const mask = maskCtx.getImageData(0, 0, 2880, 1440).data;
  function isOcean(lon, lat) {
    if (lon < 45 || lon >= 105 || lat < 5 || lat >= 30) return false;
    const x = Math.min(2879, Math.max(0, Math.floor((lon + 180) * 8)));
    const y = Math.min(1439, Math.max(0, Math.floor((90 - lat) * 8)));
    return mask[(y * 2880 + x) * 4 + 3] < 128;
  }
  const oceanCells = [];
  for (let row = 0; row < 100; row++)
    for (let col = 0; col < 240; col++) {
      const lon = 45 + col * 0.25 + 0.125,
        lat = 30 - row * 0.25 - 0.125;
      if (isOcean(lon, lat)) oceanCells.push({ row, col, lon, lat });
    }
  const raster = document.createElement("canvas");
  raster.width = 240;
  raster.height = 100;
  const rasterCtx = raster.getContext("2d");
  const tooltip = document.querySelector("#map-tooltip");
  const positionLabel = document.querySelector("#hover-coordinates");
  let width = 0,
    height = 0,
    state = null,
    zoom = 1,
    center = [76, 19],
    pan = [0, 0],
    drag = null,
    frame = 0,
    fieldKey = "";
  const projection = geoMercator();
  const path = geoPath(projection, ctx);
  function depth() {
    return state.layer === "temperature" ? DEPTHS[state.depthIndex] : 0;
  }
  function updateProjection() {
    projection
      .center(center)
      .scale(Math.min(width / 1.27, height / 0.87) * zoom)
      .translate([width / 2 + pan[0], height / 2 + pan[1] + 12]);
  }
  function updateRaster() {
    const key = [state.layer, depth(), state.date].join(":");
    if (key === fieldKey) return;
    fieldKey = key;
    const image = rasterCtx.createImageData(240, 100);
    const range = valueRange(state.layer, depth());
    for (const cell of oceanCells) {
      const values = sample(cell.lon, cell.lat, depth(), state.date);
      const rgb = colorAt(values[state.layer], ...range);
      const at = (cell.row * 240 + cell.col) * 4;
      image.data[at] = rgb[0];
      image.data[at + 1] = rgb[1];
      image.data[at + 2] = rgb[2];
      image.data[at + 3] = 235;
    }
    rasterCtx.putImageData(image, 0, 0);
  }
  function drawGeoMap() {
    updateProjection();
    ctx.fillStyle = "#080b0d";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 1;
    for (let lon = 35; lon <= 115; lon += 10) {
      const x = projection([lon, 15])[0];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let lat = -10; lat <= 40; lat += 10) {
      const y = projection([76, lat])[1];
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.imageSmoothingEnabled = false;
    const left = projection([45, 15])[0],
      right = projection([105, 15])[0];
    for (let row = 0; row < 100; row++) {
      const top = projection([45, 30 - row * 0.25])[1];
      const bottom = projection([45, 30 - (row + 1) * 0.25])[1];
      ctx.drawImage(
        raster,
        0,
        row,
        240,
        1,
        left,
        top,
        right - left,
        bottom - top + 0.15,
      );
    }
    if (state.grid) {
      ctx.strokeStyle = "#08151c35";
      ctx.lineWidth = 0.55;
      const top = projection([45, 30])[1],
        bottom = projection([45, 5])[1];
      ctx.beginPath();
      for (let col = 0; col <= 240; col++) {
        const x = left + ((right - left) * col) / 240;
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
      }
      for (let row = 0; row <= 100; row++) {
        const y = projection([45, 30 - row * 0.25])[1];
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
      }
      ctx.stroke();
    }
    ctx.beginPath();
    path(land);
    ctx.fillStyle = "#1a1d20";
    ctx.fill();
    ctx.strokeStyle = "#51575b";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.strokeStyle = "#373c40";
    ctx.lineWidth = 0.5;
    for (const country of regionCountries) {
      ctx.beginPath();
      path(country);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '12px "Manrope Variable", sans-serif';
    for (const [name, lon, lat] of cities) {
      const [x, y] = projection([lon, lat]);
      ctx.fillStyle = "#c0c0c1";
      ctx.fillText(name, x, y);
    }
    ctx.font = 'italic 15px "Manrope Variable", sans-serif';
    ctx.fillStyle = "#d3e0e7a0";
    const arabian = projection([64, 12]);
    ctx.fillText("Arabian Sea", ...arabian);
    const bengal = projection([88, 16.8]);
    ctx.fillText("Bay of Bengal", ...bengal);
    if (state.currents) {
      ctx.strokeStyle = "#ffffff90";
      ctx.fillStyle = "#fff";
      ctx.lineWidth = 1;
      for (let lat = 6.5; lat < 28; lat += 2.1)
        for (let lon = 47; lon < 104; lon += 2.7) {
          if (!isOcean(lon, lat)) continue;
          const s = sample(lon, lat, 0, state.date),
            p = projection([lon, lat]);
          const angle = Math.atan2(-s.v, s.u),
            length = 7 + s.current * 24;
          ctx.save();
          ctx.translate(...p);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(-length / 2, 0);
          ctx.lineTo(length / 2, 0);
          ctx.lineTo(length / 2 - 3, -3);
          ctx.moveTo(length / 2, 0);
          ctx.lineTo(length / 2 - 3, 3);
          ctx.stroke();
          ctx.restore();
        }
    }
    if (state.stations) {
      stations.forEach(([lon, lat], i) => {
        const p = projection([lon, lat]);
        ctx.beginPath();
        ctx.arc(...p, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#15191f";
        ctx.fill();
        ctx.strokeStyle = "#e9f0f3";
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.font = '12px "Manrope Variable",sans-serif';
        ctx.fillStyle = "#fff";
        ctx.fillText(`S${i + 1}`, p[0] + 12, p[1] - 8);
      });
    }
    const p = projection([state.lon, state.lat]);
    ctx.beginPath();
    ctx.arc(...p, 11, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(...p, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(p[0] - 17, p[1]);
    ctx.lineTo(p[0] - 11, p[1]);
    ctx.moveTo(p[0] + 11, p[1]);
    ctx.lineTo(p[0] + 17, p[1]);
    ctx.moveTo(p[0], p[1] - 17);
    ctx.lineTo(p[0], p[1] - 11);
    ctx.moveTo(p[0], p[1] + 11);
    ctx.lineTo(p[0], p[1] + 17);
    ctx.stroke();
    // Geographic edge labels refer to the same projection as the grid.
    ctx.font = '12px "Manrope Variable",sans-serif';
    ctx.fillStyle = "#929b9f";
    ctx.textAlign = "center";
    for (let lon = 40; lon <= 110; lon += 10) {
      const x = projection([lon, 15])[0];
      if (x > 25 && x < width - 25) ctx.fillText(`${lon}°E`, x, height - 10);
    }
    ctx.textAlign = "left";
    for (let lat = 0; lat <= 40; lat += 10) {
      const y = projection([76, lat])[1];
      if (y > 65 && y < height - 65) ctx.fillText(`${lat}°N`, 10, y);
    }
  }
  function drawSection() {
    ctx.fillStyle = "#080b0d";
    ctx.fillRect(0, 0, width, height);
    const box = { x: 65, y: 80, w: width - 110, h: height - 135 };
    const range = valueRange("temperature", 0);
    for (let x = 0; x < 100; x++) {
      const lat = 5 + x * 0.25 + 0.125;
      for (let y = 0; y < 100; y++) {
        const deep = y * 10;
        ctx.fillStyle = isOcean(state.lon, lat)
          ? `rgb(${colorAt(sample(state.lon, lat, deep, state.date).temperature, 3, 31).join(",")})`
          : "#22262a";
        ctx.fillRect(
          box.x + (x / 100) * box.w,
          box.y + (y / 100) * box.h,
          box.w / 100 + 0.3,
          box.h / 100 + 0.3,
        );
      }
    }
    ctx.fillStyle = "#adb1b6";
    ctx.font = '12px "Manrope Variable",sans-serif';
    ctx.textAlign = "right";
    [0, 200, 500, 700, 1000].forEach((d) => {
      const y = box.y + (d / 1000) * box.h;
      ctx.fillText(`${d} m`, box.x - 12, y + 3);
      ctx.strokeStyle = "#ffffff20";
      ctx.beginPath();
      ctx.moveTo(box.x, y);
      ctx.lineTo(box.x + box.w, y);
      ctx.stroke();
    });
    ctx.textAlign = "center";
    [5, 10, 15, 20, 25, 30].forEach((lat) =>
      ctx.fillText(
        `${lat}°N`,
        box.x + ((lat - 5) / 25) * box.w,
        box.y + box.h + 22,
      ),
    );
    ctx.fillText(
      `Latitude along ${state.lon.toFixed(2)}° E`,
      box.x + box.w / 2,
      box.y + box.h + 43,
    );
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const sy = box.y + (DEPTHS[state.depthIndex] / 1000) * box.h;
    ctx.moveTo(box.x, sy);
    ctx.lineTo(box.x + box.w, sy);
    const sx = box.x + ((state.lat - 5) / 25) * box.w;
    ctx.moveTo(sx, box.y);
    ctx.lineTo(sx, box.y + box.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  function draw() {
    frame = 0;
    if (!state || !width || !height) return;
    ctx.setTransform(
      devicePixelRatio > 1 ? Math.min(devicePixelRatio, 2) : 1,
      0,
      0,
      devicePixelRatio > 1 ? Math.min(devicePixelRatio, 2) : 1,
      0,
      0,
    );
    state.view === "section" ? drawSection() : drawGeoMap();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  const observer = new ResizeObserver(() => {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    schedule();
  });
  observer.observe(canvas.parentElement);
  function locatePoint(event) {
    const r = canvas.getBoundingClientRect();
    return [event.clientX - r.left, event.clientY - r.top];
  }
  function applyZoom(factor, anchor = [width / 2, height / 2]) {
    // The map's resting projection is offset 12 pixels below the viewport center.
    const next = zoomAt(
      zoom,
      pan,
      factor,
      [anchor[0], anchor[1] - 12],
      [width, height],
    );
    zoom = next.zoom;
    pan = next.pan;
    updateProjection();
    tooltip.hidden = true;
    schedule();
  }
  const contacts = new Map();
  let pinch = null;
  function gesture() {
    const [a, b] = [...contacts.values()];
    return {
      distance: Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])),
      midpoint: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    };
  }
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    contacts.set(event.pointerId, locatePoint(event));
    if (contacts.size === 2 && state.view === "map") pinch = gesture();
    drag = { start: locatePoint(event), pan: [...pan], moved: false };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", (event) => {
    const [x, y] = locatePoint(event);
    if (contacts.has(event.pointerId)) contacts.set(event.pointerId, [x, y]);
    if (pinch && contacts.size >= 2 && state.view === "map") {
      const next = gesture();
      applyZoom(next.distance / pinch.distance, pinch.midpoint);
      pan = pan.map(
        (value, axis) => value + next.midpoint[axis] - pinch.midpoint[axis],
      );
      pinch = next;
      if (drag) drag.moved = true;
      return;
    }
    if (drag) {
      if (Math.hypot(x - drag.start[0], y - drag.start[1]) > 3)
        drag.moved = true;
      if (state.view === "map") {
        pan = [
          drag.pan[0] + x - drag.start[0],
          drag.pan[1] + y - drag.start[1],
        ];
        schedule();
      }
      tooltip.hidden = true;
      return;
    }
    if (state.view === "section") {
      tooltip.hidden = true;
      return;
    }
    const [lon, lat] = projection.invert([x, y]);
    positionLabel.textContent = coordinates(lon, lat);
    if (!isOcean(lon, lat)) {
      tooltip.hidden = true;
      return;
    }
    const value = sample(lon, lat, depth(), state.date)[state.layer],
      config = LAYERS[state.layer];
    tooltip.innerHTML = `<strong>${value.toFixed(config.decimals)} <span>${config.unit}</span></strong><small>${coordinates(lon, lat)}</small>`;
    tooltip.style.left = `${Math.max(8, Math.min(width - 170, x + 16))}px`;
    tooltip.style.top = `${Math.max(55, Math.min(height - 90, y - 60))}px`;
    tooltip.hidden = false;
  });
  canvas.addEventListener("pointerup", (event) => {
    contacts.delete(event.pointerId);
    if (pinch || contacts.size > 0) {
      pinch = null;
      drag = contacts.size
        ? { start: [...contacts.values()][0], pan: [...pan], moved: true }
        : null;
      canvas.classList.toggle("dragging", Boolean(drag));
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      return;
    }
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    canvas.classList.remove("dragging");
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (moved) return;
    const point = locatePoint(event);
    if (state.view === "section") {
      const lat = 5 + ((point[0] - 65) / (width - 110)) * 25,
        raw = ((point[1] - 80) / (height - 135)) * 1000;
      if (lat < 5 || lat >= 30 || raw < 0 || raw > 1000) return;
      const index = DEPTHS.reduce(
        (best, d, i) =>
          Math.abs(d - raw) < Math.abs(DEPTHS[best] - raw) ? i : best,
        0,
      );
      if (isOcean(state.lon, lat))
        onSelect(state.lon, Math.round(lat * 4) / 4, index);
      else
        onMessage(
          "This cross-section passes through land. Select an ocean column.",
        );
      return;
    }
    const [lon, lat] = projection.invert(point),
      roundedLon = Math.round(lon * 4) / 4,
      roundedLat = Math.round(lat * 4) / 4;
    if (isOcean(roundedLon, roundedLat)) onSelect(roundedLon, roundedLat);
    else
      onMessage(
        "Select an ocean cell inside the highlighted North Indian Ocean grid.",
      );
  });
  canvas.addEventListener("pointercancel", (event) => {
    contacts.delete(event.pointerId);
    pinch = null;
    drag = null;
    canvas.classList.remove("dragging");
  });
  canvas.addEventListener("pointerleave", () => {
    tooltip.hidden = true;
  });
  canvas.addEventListener(
    "wheel",
    (event) => {
      if (state.view !== "map") return;
      event.preventDefault();
      event.stopPropagation();
      applyZoom(
        wheelZoomFactor(event.deltaY, event.deltaMode, event.ctrlKey, height),
        locatePoint(event),
      );
    },
    { passive: false },
  );
  canvas.addEventListener("keydown", (event) => {
    if (state.view !== "map") return;
    const shifts = {
      ArrowLeft: [40, 0],
      ArrowRight: [-40, 0],
      ArrowUp: [0, 40],
      ArrowDown: [0, -40],
    };
    if (shifts[event.key]) {
      event.preventDefault();
      pan[0] += shifts[event.key][0];
      pan[1] += shifts[event.key][1];
      schedule();
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      applyZoom(1.25);
    }
    if (event.key === "-") {
      event.preventDefault();
      applyZoom(1 / 1.25);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const [lon, lat] = projection.invert([width / 2, height / 2]);
      if (isOcean(lon, lat))
        onSelect(Math.round(lon * 4) / 4, Math.round(lat * 4) / 4);
      else
        onMessage(
          "Map center is over land. Pan to the ocean or use the coordinate form.",
        );
    }
  });
  return {
    isOcean,
    count: oceanCells.length,
    update(next) {
      state = next;
      updateRaster();
      schedule();
    },
    zoom(amount) {
      applyZoom(amount);
    },
    region(preset) {
      center = [...preset.center];
      zoom = preset.zoom;
      pan = [0, 0];
      schedule();
    },
    dispose() {
      observer.disconnect();
      cancelAnimationFrame(frame);
    },
  };
}
