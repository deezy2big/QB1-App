import { ProviderNotConfiguredError, hasEnv } from "./not-configured";
import type { CutoutProvider } from "./types";

/**
 * Adobe Firefly / Photoshop cutout adapter.
 * Live IMS + Sensei calls stay unwired until the NFL Adobe account is connected.
 */
export class AdobeCutout implements CutoutProvider {
  id = "adobe" as const;

  async removeBackground(_bytes: Buffer): Promise<Buffer> {
    this.ensure();
  }

  private ensure(): never {
    if (!hasEnv("ADOBE_CLIENT_ID", "ADOBE_CLIENT_SECRET")) {
      throw new ProviderNotConfiguredError("Adobe cutout", [
        "ADOBE_CLIENT_ID",
        "ADOBE_CLIENT_SECRET",
      ]);
    }
    throw new Error(
      "Adobe cutout is selected and credentials are present, but the Firefly/Photoshop client is not wired yet. Keep QB1_CUTOUT=local until that lands.",
    );
  }
}
