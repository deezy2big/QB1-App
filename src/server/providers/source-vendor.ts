import { ProviderNotConfiguredError, hasEnv } from "./not-configured";
import type { SourceProvider } from "./types";
import type { Asset as AssetRow } from "@/lib/types";

export class PhotoShelterApi implements SourceProvider {
  id = "photoshelter" as const;

  async getAsset(): Promise<AssetRow | undefined> {
    this.ensure();
  }

  async getBytes(): Promise<Buffer> {
    this.ensure();
  }

  private ensure(): never {
    if (!hasEnv("PHOTOSHELTER_API_KEY")) {
      throw new ProviderNotConfiguredError("Photo Shelter", [
        "PHOTOSHELTER_API_KEY",
        "PHOTOSHELTER_API_SECRET",
      ]);
    }
    throw new Error(
      "Photo Shelter is selected and an API key is present, but the live client is not wired yet. Keep QB1_PHOTOSHELTER=local until that lands.",
    );
  }
}

export class ApImagesApi implements SourceProvider {
  id = "ap" as const;

  async getAsset(): Promise<AssetRow | undefined> {
    this.ensure();
  }

  async getBytes(): Promise<Buffer> {
    this.ensure();
  }

  async search(): Promise<AssetRow[]> {
    this.ensure();
  }

  private ensure(): never {
    if (!hasEnv("AP_IMAGES_API_KEY")) {
      throw new ProviderNotConfiguredError("AP Images", ["AP_IMAGES_API_KEY"]);
    }
    throw new Error(
      "AP Images is selected and an API key is present, but the live client is not wired yet. Keep QB1_AP_IMAGES=local until that lands.",
    );
  }
}
