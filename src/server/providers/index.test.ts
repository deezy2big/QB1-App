import { describe, expect, it } from "vitest";
import { AdobeCutout } from "./cutout-adobe";
import { getProviders } from "./index";
import { ProviderNotConfiguredError } from "./not-configured";
import { S3Storage } from "./storage-s3";

describe("provider factory", () => {
  it("defaults to local adapters", () => {
    const p = getProviders();
    expect(p.storage.id).toBe("local");
    expect(p.cutout.id).toBe("local");
    expect(p.vision.id).toBe("local");
    expect(p.photoshelter.id).toBe("photoshelter");
    expect(p.apImages.id).toBe("ap");
    expect(p.auth.id).toBe("local");
  });

  it("Adobe and S3 throw until configured", async () => {
    await expect(new AdobeCutout().removeBackground(Buffer.alloc(0))).rejects.toBeInstanceOf(
      ProviderNotConfiguredError,
    );
    await expect(new S3Storage().get("x")).rejects.toBeInstanceOf(
      ProviderNotConfiguredError,
    );
  });
});
