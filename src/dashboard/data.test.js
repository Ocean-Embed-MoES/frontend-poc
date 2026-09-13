import test from "node:test";
import assert from "node:assert/strict";
import {
  DEPTHS,
  LAYERS,
  sample,
  profile,
  history,
  dayIndex,
  shiftDate,
  colorAt,
  valueRange,
} from "./data.js";

test("history contains only unique available dates at the start of the dataset", () => {
  assert.equal(history(88, 15, 100, "2023-01-01").length, 1);
  const early = history(88, 15, 100, "2023-01-04");
  assert.deepEqual(
    early.map((p) => p.date),
    ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04"],
  );
  const full = history(88, 15, 100, "2023-06-15");
  assert.equal(full.length, 7);
  assert.equal(new Set(full.map((p) => p.date)).size, 7);
  assert.equal(full.at(-1).date, "2023-06-15");
});
test("regional trends use the selected variable at each sample date", () => {
  for (const layer of Object.keys(LAYERS))
    for (const row of history(65, 15, 0, "2023-06-15", layer)) {
      assert.equal(row.value, sample(65, 15, 0, row.date)[layer]);
    }
});
test("date navigation stays within the stated 2023 dataset", () => {
  assert.equal(dayIndex("2023-01-01"), 0);
  assert.equal(dayIndex("2023-12-31"), 364);
  assert.equal(shiftDate("2023-01-01", -1), "2023-01-01");
  assert.equal(shiftDate("2023-12-31", 1), "2023-12-31");
  assert.equal(shiftDate("2023-02-28", 1), "2023-03-01");
});
test("all profile depths use the same temperature field as the map", () => {
  const points = profile(88, 15, "2023-06-15");
  assert.deepEqual(
    points.map((p) => p.depth),
    DEPTHS,
  );
  for (const row of points) {
    assert.equal(
      row.value,
      sample(88, 15, row.depth, "2023-06-15").temperature,
    );
    assert.ok(Number.isFinite(row.reference));
  }
});
test("temperature legends encompass representative synthetic fields across depth and season", () => {
  for (const date of ["2023-01-01", "2023-06-15", "2023-09-15"])
    for (const depth of DEPTHS) {
      const [low, high] = valueRange("temperature", depth);
      for (let lon = 45; lon < 105; lon += 5)
        for (let lat = 5; lat < 30; lat += 5) {
          const value = sample(lon, lat, depth, date).temperature;
          assert.ok(
            value >= low && value <= high,
            `${value} outside [${low},${high}] at ${lon},${lat},${depth},${date}`,
          );
        }
    }
});
test("color scale clamps out-of-range values to finite RGB channels", () => {
  for (const value of [-100, 0, 25, 1000])
    assert.ok(
      colorAt(value, 0, 30).every(
        (c) => Number.isInteger(c) && c >= 0 && c <= 255,
      ),
    );
});
