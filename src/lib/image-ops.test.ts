import { describe, expect, it } from "vitest";
import { portraitSvg, TARGET_PUPIL_Y } from "./portrait-svg";
import { alignHeadshot, findPupils, rasterizeSvg, removeBackground } from "@/server/image-ops";

describe("local cutout and alignment", () => {
  it("strips the magenta screen", async () => {
    const png = await rasterizeSvg(
      portraitSvg({
        name: "Test Player",
        number: "12",
        teamId: "sea",
        kind: "headshot",
        chroma: true,
      }),
    );
    const cut = await removeBackground(png);
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(cut).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    const cornerAlpha = data[3];
    expect(info.channels).toBe(4);
    expect(cornerAlpha).toBe(0);
  });

  it("finds two pupils and registers them onto the line", async () => {
    const png = await rasterizeSvg(
      portraitSvg({
        name: "Test Player",
        number: "12",
        teamId: "sea",
        kind: "headshot",
        chroma: true,
      }),
    );
    const cut = await removeBackground(png);
    const pupils = await findPupils(cut);
    expect(pupils.right.x).toBeGreaterThan(pupils.left.x);
    const aligned = await alignHeadshot(cut, pupils);
    const after = await findPupils(aligned);
    expect(Math.abs(after.left.y - TARGET_PUPIL_Y)).toBeLessThan(40);
    expect(Math.abs(after.right.y - TARGET_PUPIL_Y)).toBeLessThan(40);
  });
});
