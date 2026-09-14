export function wheelZoomFactor(
  deltaY,
  deltaMode = 0,
  ctrlKey = false,
  height = 800,
) {
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? height : 1);
  const bounded = Math.max(-240, Math.min(240, pixels));
  return Math.exp(-bounded * (ctrlKey ? 0.01 : 0.002));
}

// Preserve the geographic point under the cursor while scaling the projection.
export function zoomAt(zoom, pan, factor, anchor, size) {
  const next = Math.max(0.8, Math.min(5, zoom * factor));
  const ratio = next / zoom;
  return {
    zoom: next,
    pan: pan.map((offset, axis) => {
      const relative = anchor[axis] - size[axis] / 2;
      return relative - (relative - offset) * ratio;
    }),
  };
}
