import * as THREE from "three";
import { gsap } from "gsap";

export function createAssembly({ canvas, container, reduced, onSelect }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 5, -5, 0.1, 100);
  camera.position.set(8, 6.8, 12);
  camera.lookAt(0, 0, 0);
  const root = new THREE.Group();
  root.position.x = -0.8;
  scene.add(root);
  const layers = [];
  const resources = new Set();
  const objects = [];
  let width = 1,
    height = 1,
    visible = true,
    dirty = true,
    disposed = false,
    elapsed = 0,
    selected = 3;
  const state = { expansion: 1, angle: -0.16, tilt: 0, scroll: 0 };
  const heights = [3.1, 1.96, 0.78, -0.42, -1.58, -2.96];
  const leaderSvg = container.querySelector(".assembly-leaders");
  const labels = [...container.querySelectorAll(".assembly-label")];
  const leaders = labels.map(() => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    leaderSvg.append(p);
    return p;
  });
  const addLines = (points, group, material) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(...p)),
    );
    resources.add(geometry);
    const line = new THREE.LineSegments(geometry, material);
    group.add(line);
    return line;
  };
  const makeLayer = (index) => {
    const group = new THREE.Group();
    root.add(group);
    const line = new THREE.LineBasicMaterial({
      color: index === 3 ? 0xe1e1e1 : 0x7c7c82,
      transparent: true,
      opacity: 0.8,
    });
    const fine = new THREE.LineBasicMaterial({
      color: 0x707077,
      transparent: true,
      opacity: 0.33,
    });
    const face = new THREE.MeshBasicMaterial({
      color: 0x080809,
      transparent: true,
      opacity: 0.97,
    });
    [line, fine, face].forEach((r) => resources.add(r));
    layers.push({ group, line, fine, face, index });
    return layers[index];
  };
  const sheet = (layer, w, d, y, pattern = "grid") => {
    const geometry = new THREE.BoxGeometry(w, 0.025, d);
    resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, layer.face);
    mesh.position.y = y;
    mesh.userData.stage = layer.index;
    layer.group.add(mesh);
    objects.push(mesh);
    const edges = new THREE.EdgesGeometry(geometry);
    resources.add(edges);
    const border = new THREE.LineSegments(edges, layer.line);
    border.position.y = y;
    layer.group.add(border);
    const points = [];
    for (let x = -w / 2 + 0.22; x < w / 2; x += 0.22)
      points.push([x, y + 0.018, -d / 2], [x, y + 0.018, d / 2]);
    for (let z = -d / 2 + 0.22; z < d / 2; z += 0.22)
      points.push([-w / 2, y + 0.018, z], [w / 2, y + 0.018, z]);
    if (pattern === "grid") addLines(points, layer.group, layer.fine);
    if (pattern === "contour") {
      for (let row = 0; row < 6; row++) {
        const contour = [];
        for (let i = 0; i < 65; i++) {
          const x = -w / 2 + (i * w) / 64;
          const z =
            -d * 0.37 +
            row * d * 0.14 +
            Math.sin(x * 2.3 + row * 0.43) * 0.1 +
            Math.cos(x * 3 - row * 0.7) * 0.055;
          if (i > 0)
            contour.push(
              [
                x - w / 64,
                y + 0.021,
                -d * 0.37 +
                  row * d * 0.14 +
                  Math.sin((x - w / 64) * 2.3 + row * 0.43) * 0.1 +
                  Math.cos((x - w / 64) * 3 - row * 0.7) * 0.055,
              ],
              [x, y + 0.021, z],
            );
        }
        addLines(contour, layer.group, layer.fine);
      }
    }
  };
  const input = makeLayer(0);
  for (let i = 0; i < 5; i++) sheet(input, 3.9, 2.05, i * 0.1, "contour");
  sheet(makeLayer(1), 3.9, 2.05, 0);
  const encoder = makeLayer(2);
  for (let i = 0; i < 3; i++)
    sheet(encoder, 3.25 - i * 0.65, 1.8 - i * 0.32, -i * 0.14);
  const embedding = makeLayer(3);
  const coreGeo = new THREE.BoxGeometry(1.45, 0.42, 1.1);
  resources.add(coreGeo);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xb7b7bb });
  resources.add(coreMat);
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.userData.stage = 3;
  embedding.group.add(core);
  objects.push(core);
  const coreEdge = new THREE.EdgesGeometry(coreGeo);
  resources.add(coreEdge);
  embedding.group.add(new THREE.LineSegments(coreEdge, embedding.line));
  sheet(embedding, 1.8, 1.45, -0.25);
  const pins = [];
  for (let i = 0; i < 12; i++) {
    const x = -0.66 + i * 0.12;
    pins.push(
      [x, 0.03, -0.56],
      [x, 0.03, -0.78],
      [x, 0.03, 0.56],
      [x, 0.03, 0.78],
    );
  }
  for (let i = 0; i < 8; i++) {
    const z = -0.45 + i * 0.13;
    pins.push(
      [-0.73, 0.03, z],
      [-0.98, 0.03, z],
      [0.73, 0.03, z],
      [0.98, 0.03, z],
    );
  }
  addLines(pins, embedding.group, embedding.line);
  const chipCanvas = document.createElement("canvas");
  chipCanvas.width = 512;
  chipCanvas.height = 256;
  const ctx = chipCanvas.getContext("2d");
  ctx.fillStyle = "#b7b7bb";
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = "500 74px sans-serif";
  ctx.fillText("512", 256, 145);
  ctx.font = "20px sans-serif";
  ctx.fillText("SATELLITE EMBEDDING", 256, 195);
  const texture = new THREE.CanvasTexture(chipCanvas);
  resources.add(texture);
  const labelMat = new THREE.MeshBasicMaterial({ map: texture });
  resources.add(labelMat);
  const labelGeo = new THREE.PlaneGeometry(1.4, 1.04);
  resources.add(labelGeo);
  const chipLabel = new THREE.Mesh(labelGeo, labelMat);
  chipLabel.rotation.x = -Math.PI / 2;
  chipLabel.position.y = 0.216;
  embedding.group.add(chipLabel);
  const decoder = makeLayer(4);
  for (let i = 0; i < 3; i++)
    sheet(decoder, 1.95 + i * 0.65, 1.16 + i * 0.32, -i * 0.14);
  const output = makeLayer(5);
  for (let i = 0; i < 15; i++)
    sheet(output, 3.9, 2.05, -i * 0.054, i === 0 ? "contour" : "none");
  const guideMaterial = new THREE.LineBasicMaterial({
    color: 0x55555a,
    transparent: true,
    opacity: 0.25,
  });
  resources.add(guideMaterial);
  const guideGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 3.6, 0),
    new THREE.Vector3(0, -4, 0),
  ]);
  resources.add(guideGeometry);
  root.add(new THREE.Line(guideGeometry, guideMaterial));
  const particles = [];
  const dotGeo = new THREE.SphereGeometry(0.025, 6, 6);
  resources.add(dotGeo);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  resources.add(dotMat);
  for (let i = 0; i < 3; i++) {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    root.add(dot);
    particles.push(dot);
  }
  const projection = new THREE.Vector3();
  function render() {
    if (disposed) return;
    layers.forEach((layer, i) => {
      layer.group.position.y = THREE.MathUtils.lerp(
        0.7 - i * 0.27,
        heights[i],
        state.expansion,
      );
    });
    root.rotation.y = state.angle + state.scroll;
    root.rotation.x = state.tilt;
    root.updateMatrixWorld(true);
    const compact = width < 550;
    layers.forEach((layer, i) => {
      projection.set(i === 3 ? 1 : 2, 0, 0);
      layer.group.localToWorld(projection);
      projection.project(camera);
      const x = (projection.x * 0.5 + 0.5) * width,
        y = (-projection.y * 0.5 + 0.5) * height;
      const lx = compact ? width - 150 : width - 230;
      const ly = compact
        ? 80 + (i * (height - 170)) / 5
        : 77 + (i * (height - 165)) / 5;
      labels[i].style.transform = `translate(${lx}px, ${ly}px)`;
      leaders[i].setAttribute(
        "d",
        `M${x.toFixed(1)} ${y.toFixed(1)}H${Math.max(x + 14, lx - 20).toFixed(1)}L${lx - 8} ${ly + 13}`,
      );
      leaders[i].classList.toggle("selected", i === selected);
    });
    renderer.render(scene, camera);
    dirty = false;
  }
  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    renderer.setSize(width, height, false);
    const span = width < 550 ? 5.3 : 5.0;
    const aspect = width / height;
    camera.left = -span * aspect;
    camera.right = span * aspect;
    camera.top = span;
    camera.bottom = -span;
    camera.updateProjectionMatrix();
    leaderSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    dirty = true;
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const visibility = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) {
      dirty = true;
      render();
    }
  });
  visibility.observe(container);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let drag = null;
  function pointerDown(e) {
    if (e.button !== 0) return;
    drag = {
      x: e.clientX,
      y: e.clientY,
      angle: state.angle,
      tilt: state.tilt,
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
  }
  function pointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    drag.moved ||= Math.abs(dx) + Math.abs(dy) > 5;
    gsap.killTweensOf(state);
    state.angle = drag.angle + dx * 0.005;
    state.tilt = Math.max(-0.18, Math.min(0.18, drag.tilt + dy * 0.002));
    dirty = true;
    render();
  }
  function pointerUp(e) {
    if (!drag) return;
    if (!drag.moved) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / width) * 2 - 1,
        (-(e.clientY - rect.top) / height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(objects, false)[0];
      if (hit) onSelect(hit.object.userData.stage, true);
    }
    drag = null;
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
  }
  function keydown(e) {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        e.key,
      )
    )
      return;
    e.preventDefault();
    gsap.killTweensOf(state);
    if (e.key === "Home") {
      state.angle = -0.16;
      state.tilt = 0;
    } else if (e.key === "ArrowLeft") state.angle -= 0.18;
    else if (e.key === "ArrowRight") state.angle += 0.18;
    else
      state.tilt = Math.max(
        -0.18,
        Math.min(0.18, state.tilt + (e.key === "ArrowUp" ? -0.06 : 0.06)),
      );
    dirty = true;
    render();
  }
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      container.classList.add("scene-failed");
    },
    { once: true },
  );
  resize();
  return {
    setExpansion(expansion, instant = false) {
      gsap.to(state, {
        expansion,
        duration: reduced.matches || instant ? 0 : 1.25,
        ease: "expo.inOut",
        overwrite: "auto",
        onUpdate: render,
      });
    },
    select(index) {
      selected = index;
      layers.forEach((layer, i) => {
        layer.line.color.setHex(i === index ? 0xffffff : 0x7c7c82);
        layer.line.opacity = i === index ? 1 : 0.6;
        layer.fine.opacity = i === index ? 0.62 : 0.28;
      });
      dirty = true;
      render();
    },
    rotate(instant = false) {
      gsap.to(state, {
        angle: state.angle + Math.PI / 4,
        duration: reduced.matches || instant ? 0 : 0.65,
        ease: "power3.out",
        overwrite: "auto",
        onUpdate: render,
      });
    },
    reset(instant = false) {
      gsap.to(state, {
        angle: -0.16,
        tilt: 0,
        duration: reduced.matches || instant ? 0 : 0.65,
        ease: "power3.out",
        overwrite: "auto",
        onUpdate: render,
      });
    },
    setScroll(value) {
      state.scroll = reduced.matches ? 0 : value * 0.15;
      dirty = true;
    },
    update(delta, paused) {
      if (!visible || document.hidden || disposed) return;
      if (!paused) {
        elapsed += delta;
        particles.forEach((dot, i) => {
          dot.position.set(0, 3.6 - ((elapsed * 0.6 + i * 2.5) % 7.5), 0);
          dot.visible = state.expansion > 0.5;
        });
        dirty = true;
      } else
        particles.forEach((dot) => {
          if (dot.visible) {
            dot.visible = false;
            dirty = true;
          }
        });
      if (dirty) render();
    },
    settle() {
      gsap.getTweensOf(state).forEach((t) => t.progress(1));
      state.scroll = 0;
      render();
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      visibility.disconnect();
      gsap.killTweensOf(state);
      resources.forEach((r) => r.dispose());
      renderer.dispose();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("keydown", keydown);
    },
  };
}
