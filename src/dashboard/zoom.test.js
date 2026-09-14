import test from "node:test";
import assert from "node:assert/strict";
import { wheelZoomFactor, zoomAt } from "./zoom.js";

test("wheel zoom preserves the point beneath the cursor after a pan", () => {
  const zoom = 1.4,
    pan = [85, -32],
    anchor = [620, 190],
    size = [800, 500];
  const next = zoomAt(zoom, pan, 1.6, anchor, size);
  for (let axis = 0; axis < 2; axis++) {
    const original = (anchor[axis] - size[axis] / 2 - pan[axis]) / zoom;
    const after = (anchor[axis] - size[axis] / 2 - next.pan[axis]) / next.zoom;
    assert.ok(Math.abs(original - after) < 1e-10);
  }
});
test("pixel, line, and page wheel events normalize to the same distance", () => {
  assert.equal(wheelZoomFactor(48), wheelZoomFactor(3, 1));
  assert.equal(wheelZoomFactor(200), wheelZoomFactor(0.25, 2, false, 800));
  assert.ok(wheelZoomFactor(-2, 0, true) > 1);
  assert.ok(wheelZoomFactor(2, 0, true) < 1);
});
test("zoom bounds preserve pan when already at a limit", () => {
  assert.deepEqual(zoomAt(5, [10, 20], 2, [600, 200], [800, 500]), {
    zoom: 5,
    pan: [10, 20],
  });
  assert.deepEqual(zoomAt(0.8, [10, 20], 0.5, [600, 200], [800, 500]), {
    zoom: 0.8,
    pan: [10, 20],
  });
});
