export const DEPTHS = [
  0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000,
];
export const PRESETS = {
  nio: { name: "North Indian Ocean", center: [76, 19], zoom: 1 },
  bengal: {
    name: "Bay of Bengal",
    center: [88, 15],
    zoom: 1.85,
    lon: 88,
    lat: 15,
  },
  arabian: {
    name: "Arabian Sea",
    center: [65, 15],
    zoom: 1.85,
    lon: 65,
    lat: 15,
  },
};
export const LAYERS = {
  temperature: { name: "Temperature", unit: "°C", decimals: 2 },
  salinity: { name: "Surface salinity", unit: "PSU", decimals: 2 },
  ssh: { name: "Sea surface height", unit: "m", decimals: 3 },
  wind: { name: "Wind stress curl", unit: "×10⁻⁷ N/m³", decimals: 2 },
};
export const PALETTE = [
  "#273865",
  "#2f6688",
  "#458e98",
  "#80b5a3",
  "#c4c89b",
  "#e1ba7c",
  "#db8d62",
];
export function dayIndex(date) {
  return Math.round(
    (Date.parse(`${date}T12:00:00Z`) - Date.parse("2023-01-01T12:00:00Z")) /
      86400000,
  );
}
export function shiftDate(date, step) {
  const day = Math.max(0, Math.min(364, dayIndex(date) + step));
  return new Date(Date.UTC(2023, 0, day + 1)).toISOString().slice(0, 10);
}
export function sample(lon, lat, depth, date) {
  const day = dayIndex(date);
  const season = Math.sin(((day - 85) / 365) * Math.PI * 2);
  const eddy =
    Math.sin(lon * 0.31 + lat * 0.29 + day * 0.025) *
    Math.cos(lat * 0.47 - lon * 0.16 + day * 0.012);
  const surface =
    29.5 -
    (lat - 5) * 0.125 +
    season * 0.8 +
    eddy * 0.85 -
    Math.max(0, 68 - lon) * 0.055;
  const thermocline = 92 + 24 * Math.sin(lon * 0.14 + lat * 0.13) + eddy * 13;
  const temperature =
    4.2 +
    (surface - 4.2) * Math.exp(-depth / (thermocline + depth * 0.22)) +
    0.08 * eddy;
  const salinity =
    35.3 -
    Math.max(0, lon - 78) * 0.095 +
    Math.cos(lat * 0.26) * 0.32 +
    eddy * 0.15;
  const ssh = 0.16 + eddy * 0.19 + season * 0.06;
  const wind =
    Math.sin(lon * 0.19 + lat * 0.37 + day * 0.04) * Math.cos(lat * 0.12) * 2.7;
  const u = 0.22 * Math.sin(lon * 0.22 + lat * 0.17 + day * 0.03);
  const v = 0.18 * Math.cos(lon * 0.16 - lat * 0.2 + day * 0.02);
  return {
    temperature,
    salinity,
    ssh,
    wind,
    surface,
    u,
    v,
    current: Math.hypot(u, v),
    thermocline,
  };
}
export function profile(lon, lat, date) {
  return DEPTHS.map((depth) => {
    const s = sample(lon, lat, depth, date);
    return {
      depth,
      value: s.temperature,
      reference:
        s.temperature +
        Math.sin(lon + lat * 0.1 + depth * 0.014) *
          0.45 *
          Math.exp(-depth / 400),
    };
  });
}
export function history(lon, lat, depth, date, layer = "temperature") {
  const count = Math.min(7, dayIndex(date) + 1);
  return Array.from({ length: count }, (_, i) => {
    const dateAt = shiftDate(date, i - count + 1),
      s = sample(lon, lat, depth, dateAt),
      value = s[layer];
    return {
      date: dateAt,
      value,
      reference:
        layer === "temperature"
          ? value + Math.sin(dayIndex(dateAt) * 0.19) * 0.25
          : value,
    };
  });
}
export function valueRange(layer, depth) {
  if (layer === "salinity") return [32, 36.5];
  if (layer === "ssh") return [-0.15, 0.45];
  if (layer === "wind") return [-3, 3];
  // Depth-dependent envelope keeps the full synthetic thermal range visible.
  const low = 4.2 + 19 * Math.exp(-depth / (55 + depth * 0.22));
  const high = 4.2 + 28 * Math.exp(-depth / (130 + depth * 0.22));
  return [Math.floor(low - 0.5), Math.ceil(high + 0.5)];
}
export function colorAt(value, min, max) {
  const t =
    Math.max(0, Math.min(1, (value - min) / (max - min))) *
    (PALETTE.length - 1);
  const i = Math.min(PALETTE.length - 2, Math.floor(t));
  const f = t - i;
  const a = PALETTE[i],
    b = PALETTE[i + 1];
  return [1, 3, 5].map((p) =>
    Math.round(
      parseInt(a.slice(p, p + 2), 16) * (1 - f) +
        parseInt(b.slice(p, p + 2), 16) * f,
    ),
  );
}
export function regionName(lon) {
  return lon >= 80 ? "Bay of Bengal" : "Arabian Sea";
}
export function coordinates(lon, lat) {
  return `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;
}
export function formatDate(date) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
