import { describe, expect, it } from "vitest";
import { pipelineFor, statusLabel } from "./pipeline";
import type { Asset } from "./types";

const headshot: Asset = {
  id: "1",
  name: "HS",
  kind: "headshot",
  source: "photoshelter",
  year: 2025,
  folderId: "x",
  width: 1,
  height: 1,
  bytes: 1,
};

const movie: Asset = { ...headshot, id: "2", kind: "movie" };

describe("pipelineFor", () => {
  it("download skips adobe and alignment", () => {
    const steps = pipelineFor([headshot], "download").map((s) => s.status);
    expect(steps).toEqual(["queued", "transferring", "complete"]);
  });

  it("headshot process includes pupil alignment", () => {
    const steps = pipelineFor([headshot], "process").map((s) => s.status);
    expect(steps).toContain("aligning");
    expect(steps).toContain("cutting_out");
    expect(steps).not.toContain("sequencing");
  });

  it("movie process converts to a sequence first", () => {
    const steps = pipelineFor([movie], "process").map((s) => s.status);
    expect(steps.indexOf("sequencing")).toBeLessThan(steps.indexOf("cutting_out"));
    expect(steps).not.toContain("aligning");
  });

  it("labels statuses for the jobs rail", () => {
    expect(statusLabel("aligning")).toBe("Aligning pupils");
    expect(statusLabel("cutting_out")).toBe("Cutting out");
  });
});
