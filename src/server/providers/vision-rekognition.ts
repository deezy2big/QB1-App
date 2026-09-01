import { ProviderNotConfiguredError, hasEnv } from "./not-configured";
import type { PupilPair, VisionProvider } from "./types";

/** AWS Rekognition face landmarks. Ready when AWS keys exist. */
export class RekognitionVision implements VisionProvider {
  id = "rekognition" as const;

  async findPupils(_bytes: Buffer): Promise<PupilPair> {
    this.ensure();
  }

  async alignHeadshot(_bytes: Buffer): Promise<Buffer> {
    this.ensure();
  }

  private ensure(): never {
    if (!hasEnv("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY")) {
      throw new ProviderNotConfiguredError("AWS Rekognition", [
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_REGION",
      ]);
    }
    throw new Error(
      "Rekognition is selected and credentials are present, but DetectFaces is not wired yet. Keep QB1_VISION=local until that lands.",
    );
  }
}
