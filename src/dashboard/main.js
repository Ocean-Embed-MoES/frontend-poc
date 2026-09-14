import "../style.css";
import "./icons.css";
import "./style.css";
import { gsap } from "gsap";
import {
  DEPTHS,
  LAYERS,
  PALETTE,
  PRESETS,
  sample,
  profile,
  history,
  regionName,
  coordinates,
  formatDate,
  shiftDate,
  valueRange,
} from "./data";
import { renderProfile, renderHistory, renderSparkline } from "./charts";

const $ = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
const validDate = (value) =>
  /^2023-\d{2}-\d{2}$/.test(value || "") &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const numberParam = (key, fallback, min, max) => {
  const raw = params.get(key);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};
const state = {
  layer: LAYERS[params.get("layer")] ? params.get("layer") : "temperature",
  depthIndex: Math.round(numberParam("depth", 7, 0, 14)),
  date: validDate(params.get("date")) ? params.get("date") : "2023-06-15",
  lon: numberParam("lon", 88, 45, 104.75),
  lat: numberParam("lat", 15, 5, 29.75),
  region: PRESETS[params.get("region")] ? params.get("region") : "nio",
  view: params.get("view") === "section" ? "section" : "map",
  chart: "profile",
  grid: true,
  currents: false,
  stations: true,
};
if (state.view === "section") state.layer = "temperature";
let oceanMap = null,
  playInterval = null,
  toastTimeout = null,
  dialogOpener = null;
let saved = [];
try {
  const data = JSON.parse(localStorage.getItem("oceanembed-saved") || "[]");
  if (Array.isArray(data))
    saved = data
      .filter(
        (p) =>
          Number.isFinite(p.lon) &&
          Number.isFinite(p.lat) &&
          p.lon >= 45 &&
          p.lon < 105 &&
          p.lat >= 5 &&
          p.lat < 30,
      )
      .slice(0, 8);
} catch {
  /* Storage can be unavailable in private browsing. */
}

function toast(message) {
  clearTimeout(toastTimeout);
  $("#dashboard-toast").textContent = message;
  $("#dashboard-toast").classList.add("visible");
  toastTimeout = setTimeout(
    () => $("#dashboard-toast").classList.remove("visible"),
    3500,
  );
}
function persistURL() {
  const p = new URLSearchParams({
    layer: state.layer,
    depth: String(state.depthIndex),
    date: state.date,
    lon: state.lon.toFixed(2),
    lat: state.lat.toFixed(2),
    region: state.region,
    view: state.view,
  });
  window.history.replaceState(null, "", `${location.pathname}?${p}`);
}
function effectiveDepth() {
  return state.layer === "temperature" ? DEPTHS[state.depthIndex] : 0;
}
function renderSaved() {
  $("#saved-count").textContent = saved.length;
  $("#saved-locations").innerHTML = saved.length
    ? saved
        .map(
          (p, i) =>
            `<div class="saved-row"><button class="saved-point" data-saved="${i}"><i class="ph ph-bookmark-simple" aria-hidden="true"></i><span>${regionName(p.lon)}<small>${coordinates(p.lon, p.lat)}</small></span></button><button class="bare-icon remove-saved" data-remove="${i}" aria-label="Remove saved location ${coordinates(p.lon, p.lat)}" title="Remove saved location"><i class="ph ph-x" aria-hidden="true"></i></button></div>`,
        )
        .join("")
    : '<p class="sidebar-empty">Save a point on the map<br/>to return to it here.</p>';
  const exists = saved.some((p) => p.lon === state.lon && p.lat === state.lat);
  $("#save-location").setAttribute("aria-pressed", String(exists));
  $("#save-location").setAttribute(
    "aria-label",
    exists ? "Remove selected location from saved" : "Save selected location",
  );
  $("#save-location").title = exists
    ? "Remove saved location"
    : "Save location";
}
function saveStorage() {
  try {
    localStorage.setItem("oceanembed-saved", JSON.stringify(saved));
  } catch {
    toast("Location saved for this session. Browser storage is unavailable.");
  }
  renderSaved();
}

function update() {
  const depth = effectiveDepth(),
    layer = LAYERS[state.layer],
    values = sample(state.lon, state.lat, depth, state.date);
  $("#active-layer-label").textContent =
    state.view === "section" ? "Temperature cross-section" : layer.name;
  $("#map-depth-label").textContent =
    state.view === "section"
      ? `Along ${state.lon.toFixed(2)}° E`
      : depth === 0
        ? "At the ocean surface"
        : `${depth.toLocaleString()} m below surface`;
  $(".map-resolution").textContent =
    state.view === "section" ? "Gray areas: land" : "0.25° grid";
  $("#map-panel").classList.toggle("section-view", state.view === "section");
  all(".overlays input").forEach((input) => {
    input.disabled = state.view === "section";
    input.closest("label").title = input.disabled
      ? "Available in Ocean map"
      : "";
  });
  $("#map-panel").setAttribute(
    "aria-labelledby",
    state.view === "section" ? "section-tab" : "map-tab",
  );
  all("[data-view]").forEach((b) => {
    const selected = b.dataset.view === state.view;
    b.setAttribute("aria-selected", selected);
    b.tabIndex = selected ? 0 : -1;
  });
  all('[name="layer"]').forEach((input) => {
    input.checked = input.value === state.layer;
  });
  $("#observation-date").value = state.date;
  $("#previous-day").disabled = state.date === "2023-01-01";
  $("#next-day").disabled = state.date === "2023-12-31";
  $("#region-select").value = state.region;
  $("#dashboard-depth").value = state.depthIndex;
  $("#dashboard-depth").disabled = state.layer !== "temperature";
  $("#dashboard-depth").setAttribute(
    "aria-valuetext",
    `${DEPTHS[state.depthIndex]} metres`,
  );
  $("#dashboard-depth-output").innerHTML =
    `${depth.toLocaleString()} <span>m</span>`;
  $("#depth-mode-note").textContent =
    state.layer === "temperature" ? "15 standard levels" : "Surface-only layer";
  $(".depth-strip").classList.toggle(
    "surface-only",
    state.layer !== "temperature",
  );
  all("[data-depth]").forEach((button) => {
    button.disabled = state.layer !== "temperature";
    button.classList.toggle(
      "selected",
      Number(button.dataset.depth) === state.depthIndex,
    );
  });
  const range =
    state.view === "section" ? [3, 31] : valueRange(state.layer, depth);
  $("#legend-title").textContent = layer.name;
  $("#legend-unit").textContent = layer.unit;
  $("#legend-gradient").style.background =
    `linear-gradient(90deg,${PALETTE.join(",")})`;
  $("#legend-ticks").innerHTML = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (f) =>
        `<span>${(range[0] + (range[1] - range[0]) * f).toFixed(state.layer === "ssh" ? 2 : state.layer === "wind" ? 1 : 0)}</span>`,
    )
    .join("");
  $("#selected-region").textContent = regionName(state.lon);
  $("#selected-coordinates").textContent = coordinates(state.lon, state.lat);
  $("#selected-grid-id").textContent =
    `Grid cell ${Math.floor((30 - state.lat) / 0.25)} : ${Math.floor((state.lon - 45) / 0.25)}`;
  $("#selected-value-label").textContent =
    state.layer === "temperature"
      ? `Temperature at ${depth.toLocaleString()} m`
      : layer.name;
  $("#selected-value").innerHTML =
    `${values[state.layer].toFixed(layer.decimals)} <span>${layer.unit}</span>`;
  $("#selected-value-description").textContent =
    state.layer === "temperature" ? "Temperature field" : "Surface field";
  const surface = sample(state.lon, state.lat, 0, state.date);
  $("#surface-temperature").textContent =
    `${surface.temperature.toFixed(2)} °C`;
  $("#surface-salinity").textContent = `${surface.salinity.toFixed(2)} PSU`;
  $("#surface-ssh").textContent =
    `${surface.ssh >= 0 ? "+" : ""}${surface.ssh.toFixed(3)} m`;
  $("#surface-current").textContent = `${surface.current.toFixed(2)} m/s`;
  $("#coordinate-lat").value = state.lat;
  $("#coordinate-lon").value = state.lon;
  const chartState = {
    ...state,
    depthIndex: state.layer === "temperature" ? state.depthIndex : 0,
  };
  state.chart === "profile"
    ? renderProfile($("#inspector-chart"), chartState)
    : renderHistory($("#inspector-chart"), chartState);
  const availableDays = history(state.lon, state.lat, depth, state.date).length;
  $("#chart-context").textContent =
    state.chart === "profile"
      ? "Dashed line: reference profile."
      : `Temperature at ${depth.toLocaleString()} m. ${availableDays} available daily ${availableDays === 1 ? "sample" : "samples"}.`;
  $("#overview-date").textContent = formatDate(state.date);
  for (const name of ["bengal", "arabian"]) {
    const p = PRESETS[name];
    const value = sample(p.lon, p.lat, depth, state.date)[state.layer];
    $(`#${name}-value`).innerHTML =
      `${value.toFixed(layer.decimals)} <span>${layer.unit}</span>`;
    const trend = history(p.lon, p.lat, depth, state.date, state.layer);
    $(`#${name}-sparkline`).setAttribute(
      "aria-label",
      `${layer.name}: ${trend.length} available daily samples`,
    );
    renderSparkline($(`#${name}-sparkline`), trend);
  }
  renderSaved();
  oceanMap?.update(state);
  persistURL();
}
function select(lon, lat, depthIndex) {
  state.lon = lon;
  state.lat = lat;
  if (depthIndex !== undefined) state.depthIndex = depthIndex;
  $("#coordinate-error").textContent = "";
  update();
}
function setDate(date) {
  if (!validDate(date)) {
    toast("Choose a valid date between 1 January and 31 December 2023.");
    $("#observation-date").value = state.date;
    return;
  }
  state.date = date;
  update();
}
function setRegion(name) {
  state.region = name;
  oceanMap?.region(PRESETS[name]);
  if (name !== "nio") {
    state.lon = PRESETS[name].lon;
    state.lat = PRESETS[name].lat;
  }
  update();
}

all('[name="layer"]').forEach((input) =>
  input.addEventListener("change", () => {
    state.layer = input.value;
    if (state.layer !== "temperature") state.view = "map";
    update();
  }),
);
[
  ["show-grid", "grid"],
  ["show-currents", "currents"],
  ["show-stations", "stations"],
].forEach(([id, key]) =>
  $("#" + id).addEventListener("change", (event) => {
    state[key] = event.target.checked;
    update();
  }),
);
$("#region-select").addEventListener("change", (event) =>
  setRegion(event.target.value),
);
$("#observation-date").addEventListener("change", (event) =>
  setDate(event.target.value),
);
$("#previous-day").addEventListener("click", () =>
  setDate(shiftDate(state.date, -1)),
);
$("#next-day").addEventListener("click", () =>
  setDate(shiftDate(state.date, 1)),
);
$("#dashboard-depth").addEventListener("input", (event) => {
  state.depthIndex = Number(event.target.value);
  update();
});
all("[data-depth]").forEach((button) =>
  button.addEventListener("click", () => {
    state.depthIndex = Number(button.dataset.depth);
    update();
  }),
);
all("[data-preset]").forEach((button) =>
  button.addEventListener("click", () => setRegion(button.dataset.preset)),
);
$("#zoom-in").addEventListener("click", () => oceanMap?.zoom(1.35));
$("#zoom-out").addEventListener("click", () => oceanMap?.zoom(1 / 1.35));
$("#reset-map").addEventListener("click", () =>
  oceanMap?.region(PRESETS[state.region]),
);

function connectTabs(selector, onChange) {
  const tabs = all(selector);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.setAttribute("aria-selected", t === tab);
        t.tabIndex = t === tab ? 0 : -1;
      });
      onChange(tab);
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const target =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      tabs[target].focus();
      tabs[target].click();
    });
  });
}
connectTabs("[data-view]", (tab) => {
  state.view = tab.dataset.view;
  if (state.view === "section") state.layer = "temperature";
  update();
});
connectTabs("[data-chart]", (tab) => {
  state.chart = tab.dataset.chart;
  $("#inspector-chart").setAttribute("aria-labelledby", tab.id);
  update();
});

$("#save-location").addEventListener("click", () => {
  const index = saved.findIndex(
    (p) => p.lon === state.lon && p.lat === state.lat,
  );
  if (index >= 0) {
    saved.splice(index, 1);
    toast("Location removed from saved.");
  } else {
    if (saved.length >= 8) {
      toast("You can save up to 8 locations. Remove one to add another.");
      return;
    }
    saved.push({ lon: state.lon, lat: state.lat });
    toast("Location saved.");
  }
  saveStorage();
});
$("#saved-locations").addEventListener("click", (event) => {
  const savedButton = event.target.closest("[data-saved]"),
    removeButton = event.target.closest("[data-remove]");
  if (savedButton) {
    const p = saved[Number(savedButton.dataset.saved)];
    select(p.lon, p.lat);
    state.region = p.lon >= 80 ? "bengal" : "arabian";
    oceanMap?.region(PRESETS[state.region]);
    update();
  }
  if (removeButton) {
    saved.splice(Number(removeButton.dataset.remove), 1);
    saveStorage();
    toast("Saved location removed.");
  }
});

$("#coordinate-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const latInput = $("#coordinate-lat"),
    lonInput = $("#coordinate-lon");
  const lat = Number(latInput.value),
    lon = Number(lonInput.value);
  latInput.removeAttribute("aria-invalid");
  lonInput.removeAttribute("aria-invalid");
  const badLat =
      latInput.value === "" || !Number.isFinite(lat) || lat < 5 || lat >= 30,
    badLon =
      lonInput.value === "" || !Number.isFinite(lon) || lon < 45 || lon >= 105;
  if (badLat || badLon) {
    $("#coordinate-error").textContent =
      "Use latitude 5–29.75° N and longitude 45–104.75° E.";
    const input = badLat ? latInput : lonInput;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  const snappedLat = Math.min(29.75, Math.round(lat * 4) / 4),
    snappedLon = Math.min(104.75, Math.round(lon * 4) / 4);
  if (!oceanMap?.isOcean(snappedLon, snappedLat)) {
    $("#coordinate-error").textContent =
      "This point is on land. Choose an ocean location.";
    latInput.setAttribute("aria-invalid", "true");
    latInput.focus();
    return;
  }
  select(snappedLon, snappedLat);
  state.region = "nio";
  oceanMap.region(PRESETS.nio);
  update();
  toast(`Located ${coordinates(snappedLon, snappedLat)}.`);
});

function stopPlayback() {
  clearInterval(playInterval);
  playInterval = null;
  $("#play-dates").innerHTML = '<i class="ph ph-play" aria-hidden="true"></i>';
  $("#play-dates").setAttribute("aria-label", "Play daily sequence");
  $("#play-dates").title = "Play daily sequence";
}
$("#play-dates").addEventListener("click", () => {
  if (playInterval) {
    stopPlayback();
    return;
  }
  if (state.date === "2023-12-31") setDate("2023-01-01");
  $("#play-dates").innerHTML = '<i class="ph ph-pause" aria-hidden="true"></i>';
  $("#play-dates").setAttribute("aria-label", "Pause daily sequence");
  $("#play-dates").title = "Pause daily sequence";
  playInterval = setInterval(() => {
    if (state.date === "2023-12-31") {
      stopPlayback();
      return;
    }
    setDate(shiftDate(state.date, 1));
  }, 1800);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopPlayback();
});

$("#export-data").addEventListener("click", () => {
  const header =
    "dataset,date,latitude_deg_n,longitude_deg_e,depth_m,temperature_c,illustrative_reference_c,salinity_psu,sea_surface_height_m";
  const rows = profile(state.lon, state.lat, state.date).map((p) => {
    const s = sample(state.lon, state.lat, p.depth, state.date);
    return [
      "SYNTHETIC_DEMONSTRATION",
      state.date,
      state.lat,
      state.lon,
      p.depth,
      p.value.toFixed(3),
      p.reference.toFixed(3),
      s.salinity.toFixed(3),
      s.ssh.toFixed(4),
    ].join(",");
  });
  const url = URL.createObjectURL(
    new Blob([header + "\n" + rows.join("\n") + "\n"], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `oceanembed-demo-${state.date}-${state.lat}N-${state.lon}E.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Profile exported with all 15 depth levels.");
});

const dialog = $("#dashboard-dialog");
function openInfo(kind, opener) {
  dialogOpener = opener;
  stopPlayback();
  $("#dashboard-dialog-content").innerHTML =
    kind === "data"
      ? '<h2 id="dashboard-dialog-title">The North Indian Ocean.</h2><p class="dialog-intro">Explore temperature, salinity, sea level, and surface circulation across the Bay of Bengal and Arabian Sea.</p><div class="pipeline-details"><article><h3>One connected grid</h3><p>The workspace covers 5–30° N and 45–105° E at 0.25° resolution. Coastlines and country boundaries use Natural Earth geography.</p></article><article><h3>From surface to depth</h3><p>Select a location, change the date, and move through fifteen standard depth levels. The map, profile, and regional summaries follow your selection.</p></article></div>'
      : '<h2 id="dashboard-dialog-title">Find your way below.</h2><div class="pipeline-details guide-details"><article><h3>Explore the map</h3><p>Click an ocean cell to inspect its values. Drag to pan, scroll to zoom, or use the map buttons. Arrow keys pan a focused map; + and − zoom.</p></article><article><h3>Move through depth</h3><p>Use the depth slider or labelled shortcuts. The selected layer and charts update together. Salinity, sea level, and wind stress curl are surface-only layers.</p></article><article><h3>See another dimension</h3><p>Depth section shows a latitude–depth slice along the selected longitude. Click inside the section to select a point and depth.</p></article><article><h3>Keep your discoveries</h3><p>Bookmark locations in the inspector, compare regional presets, step through dates, and export all 15 depth values as a CSV.</p></article></div>';
  dialog.showModal();
  $("#close-dashboard-dialog").focus();
}
$("#dataset-info").addEventListener("click", (event) =>
  openInfo("data", event.currentTarget),
);
$("#help-button").addEventListener("click", (event) =>
  openInfo("help", event.currentTarget),
);
$("#close-dashboard-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => dialogOpener?.focus());

update();
import("./map")
  .then(({ createOceanMap }) => {
    oceanMap = createOceanMap($("#ocean-map"), select, toast);
    if (!oceanMap.isOcean(state.lon, state.lat)) {
      state.lon = 88;
      state.lat = 15;
      toast("The saved URL pointed outside the ocean. Showing Bay of Bengal.");
    }
    oceanMap.region(PRESETS[state.region]);
    $("#grid-count").textContent =
      `${oceanMap.count.toLocaleString()} ocean cells · 15 depth levels`;
    $("#map-loading").hidden = true;
    update();
    document.documentElement.dataset.dashboard = "ready";
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      gsap.from(".dashboard-header,.workspace-toolbar,.workspace-body", {
        opacity: 0,
        y: 6,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
      });
  })
  .catch((error) => {
    $("#map-loading").innerHTML =
      'The map could not load. <button id="retry-map">Try again</button>';
    $("#retry-map").addEventListener("click", () => location.reload());
    console.error("Ocean map initialization failed", error);
  });
window.addEventListener(
  "pagehide",
  () => {
    stopPlayback();
    oceanMap?.dispose();
    clearTimeout(toastTimeout);
  },
  { once: true },
);
