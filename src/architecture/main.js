import "../style.css";
import "../dashboard/icons.css";
import "./style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { stages, features, zones } from "./content";
import { buildNetwork } from "./diagram";

gsap.registerPlugin(ScrollTrigger);
const $ = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let model = null,
  lenis = null,
  motion = null,
  trace = null,
  paused = false,
  active = 3;
let destroyed = false;
const study = $("#assembly-study");
$(".assembly-labels").innerHTML = stages
  .map(
    (stage, i) =>
      `<button class="assembly-label" data-layer="${i}" aria-pressed="${i === active}" aria-label="Inspect ${stage.label}"><span class="label-index">${String(i + 1).padStart(2, "0")}</span><span><strong>${stage.label}</strong><small>${stage.shape}</small></span></button>`,
  )
  .join("");
$(".fallback-stack").innerHTML = stages
  .map((stage, i) => `<span style="--sheet:${i}">${stage.short}</span>`)
  .join("");
$(".stage-tabs").innerHTML = stages
  .map(
    (stage, i) =>
      `<button role="tab" id="tab-${stage.id}" data-stage="${i}" aria-controls="stage-detail" aria-selected="${i === active}" tabindex="${i === active ? 0 : -1}"><span>${String(i + 1).padStart(2, "0")}</span>${stage.short}</button>`,
  )
  .join("");
$("#feature-list").innerHTML = features
  .map(
    (feature, i) =>
      `<details class="feature-row" data-kind="${feature.kind}"><summary><span class="feature-symbol">${feature.symbol}</span><span class="feature-name">${feature.name}<small>${feature.source}</small></span><span class="feature-number">${String(i + 1).padStart(2, "0")}</span><i class="ph ph-plus" aria-hidden="true"></i></summary><p>${feature.why}</p></details>`,
  )
  .join("");
buildNetwork($("#network-diagram"));
function selectStage(index, animate = false) {
  active = index;
  const stage = stages[index];
  all("[data-layer]").forEach((button, i) =>
    button.setAttribute("aria-pressed", i === index),
  );
  all("[data-stage]").forEach((button, i) => {
    button.setAttribute("aria-selected", i === index);
    button.tabIndex = i === index ? 0 : -1;
  });
  all("[data-network-stage]").forEach((group) =>
    group.classList.toggle(
      "network-active",
      group.dataset.networkStage === stage.id,
    ),
  );
  const detail = $("#stage-detail");
  detail.setAttribute("aria-labelledby", `tab-${stage.id}`);
  detail.innerHTML = `<div class="stage-story"><h3>${stage.title}</h3><p>${stage.description}</p></div><dl class="stage-spec"><div><dt>Operation</dt><dd>${stage.operation}</dd></div><div><dt>Output tensor · C × H × W</dt><dd>${stage.output}</dd></div></dl>`;
  model?.select(index);
  if (animate && !reduced.matches)
    gsap.fromTo(
      detail.children,
      { opacity: 0.3, y: 8 },
      { opacity: 1, y: 0, duration: 0.32, ease: "power3.out", overwrite: true },
    );
}
selectStage(active);
all("[data-layer]").forEach((button) =>
  button.addEventListener("click", () =>
    selectStage(Number(button.dataset.layer)),
  ),
);
all("[data-stage]").forEach((button) =>
  button.addEventListener("click", (event) =>
    selectStage(Number(button.dataset.stage), event.detail !== 0),
  ),
);
$(".stage-tabs").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? 5
        : (active + (event.key === "ArrowRight" ? 1 : 5)) % 6;
  selectStage(next);
  $(`[data-stage="${next}"]`).focus();
});
all("[data-assembly]").forEach((button) =>
  button.addEventListener("click", (event) => {
    const exploded = button.dataset.assembly === "exploded";
    all("[data-assembly]").forEach((b) =>
      b.setAttribute("aria-pressed", b === button),
    );
    model?.setExpansion(exploded ? 1 : 0, event.detail === 0);
    study.classList.toggle("is-assembled", !exploded);
  }),
);
$("#rotate-model").addEventListener("click", (event) =>
  model?.rotate(event.detail === 0),
);
$("#reset-model").addEventListener("click", (event) =>
  model?.reset(event.detail === 0),
);
function syncPause() {
  const button = $("#pause-motion");
  button.setAttribute("aria-pressed", paused);
  button.setAttribute(
    "aria-label",
    paused ? "Resume ambient motion" : "Pause ambient motion",
  );
  button.title = paused ? "Resume motion" : "Pause motion";
  button.innerHTML = `<i class="ph ph-${paused ? "play" : "pause"}" aria-hidden="true"></i>`;
  if (paused || reduced.matches) {
    trace?.progress(1);
    model?.settle();
  }
}
$("#pause-motion").addEventListener("click", () => {
  paused = !paused;
  syncPause();
});
all("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    let count = 0;
    all("[data-filter]").forEach((b) =>
      b.setAttribute("aria-pressed", b === button),
    );
    all(".feature-row").forEach((row) => {
      row.hidden = filter !== "all" && row.dataset.kind !== filter;
      if (!row.hidden) count++;
      else row.open = false;
    });
    $("#feature-count").textContent = count;
    $(".feature-count>span:last-child").innerHTML =
      filter === "all"
        ? "input channels<br />one fused surface state"
        : `${filter} channels<br />of 12 total inputs`;
    ScrollTrigger.refresh();
  }),
);
all(".feature-row").forEach((row) =>
  row.addEventListener("toggle", () => ScrollTrigger.refresh()),
);
all("[data-zone]").forEach((button) =>
  button.addEventListener("click", () => {
    all("[data-zone]").forEach((b) =>
      b.setAttribute("aria-pressed", b === button),
    );
    $("#zone-explanation").textContent = zones[button.dataset.zone];
  }),
);
function replay(instant = false) {
  trace?.kill();
  const paths = all(".trace-paths path");
  gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1, opacity: 1 });
  if (reduced.matches || instant) {
    gsap.set(paths, { strokeDashoffset: 0, opacity: 0.7 });
    return;
  }
  trace = gsap.timeline({
    onComplete() {
      gsap.to(paths, { opacity: 0, duration: 0.6 });
      $("#signal-replay").innerHTML =
        'Trace again <i class="ph ph-play" aria-hidden="true"></i>';
    },
  });
  paths.forEach((path, i) =>
    trace.to(
      path,
      { strokeDashoffset: 0, duration: 0.24, ease: "none" },
      i * 0.19,
    ),
  );
}
$("#signal-replay").addEventListener("click", (event) =>
  replay(event.detail === 0),
);
function setupMotion() {
  motion?.revert();
  lenis?.destroy();
  lenis = null;
  if (reduced.matches) {
    model?.settle();
    return;
  }
  lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  motion = gsap.context(() => {
    gsap.from(".assembly-copy h1", {
      y: 28,
      opacity: 0,
      duration: 1.2,
      ease: "expo.out",
    });
    gsap.from(".assembly-copy>p,.assembly-copy>.text-action", {
      y: 14,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      delay: 0.16,
      ease: "power3.out",
    });
    gsap.from(".assembly-study", {
      opacity: 0,
      duration: 1.2,
      delay: 0.12,
      ease: "power2.out",
    });
    ScrollTrigger.create({
      trigger: ".assembly-hero",
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => model?.setScroll(self.progress),
    });
    gsap.from(".signal-workbench", {
      y: 35,
      opacity: 0,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".signal-workbench",
        start: "top 88%",
        once: true,
      },
    });
    ScrollTrigger.create({
      trigger: ".network-scroll",
      start: "top 65%",
      once: true,
      onEnter: () => {
        if (!paused) replay();
      },
    });
    gsap.from(".loss-zones button", {
      x: 22,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: ".loss-study", start: "top 80%", once: true },
    });
  });
}
setupMotion();
function preferenceChanged() {
  setupMotion();
  syncPause();
}
reduced.addEventListener("change", preferenceChanged);
function tick(time, delta) {
  lenis?.raf(time * 1000);
  model?.update(Math.min(delta / 1000, 0.04), paused || reduced.matches);
}
gsap.ticker.add(tick);
all('a[href^="#"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    const done = () => {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      history.replaceState(null, "", link.getAttribute("href"));
    };
    if (lenis && event.detail !== 0)
      lenis.scrollTo(target, { offset: -36, duration: 1.25, onComplete: done });
    else {
      target.scrollIntoView({ behavior: "instant" });
      done();
    }
  }),
);
import("./assembly")
  .then(({ createAssembly }) => {
    if (destroyed) return;
    model = createAssembly({
      canvas: $("#assembly-canvas"),
      container: study,
      reduced,
      onSelect: selectStage,
    });
    model.select(active);
    study.classList.add("scene-ready");
    if (!reduced.matches) {
      model.setExpansion(0, true);
      model.setExpansion(1);
    }
  })
  .catch(() => {
    study.classList.add("scene-failed");
    all(".assembly-controls button").forEach((button) => {
      button.disabled = true;
      button.title = "3D view unavailable. Use the labeled stages below.";
    });
  });
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener(
  "pagehide",
  (event) => {
    if (event.persisted) return;
    destroyed = true;
    model?.dispose();
    trace?.kill();
    motion?.revert();
    lenis?.destroy();
    gsap.ticker.remove(tick);
    reduced.removeEventListener("change", preferenceChanged);
  },
  { once: true },
);
