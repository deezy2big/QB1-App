import { AdobeCutout } from "./cutout-adobe";
import { LocalCutout } from "./cutout-local";
import { LocalAuth, OktaAuth } from "./auth";
import { LocalApImages, LocalPhotoShelter } from "./source-catalog";
import { LocalUploadSource } from "./source-local";
import { ApImagesApi, PhotoShelterApi } from "./source-vendor";
import { LocalStorage } from "./storage-local";
import { S3Storage } from "./storage-s3";
import type { Providers } from "./types";
import { LocalVision } from "./vision-local";
import { RekognitionVision } from "./vision-rekognition";

function flag(name: string, fallback: string) {
  return (process.env[name] ?? fallback).trim().toLowerCase();
}

export function getProviders(): Providers {
  return {
    storage: flag("QB1_STORAGE", "local") === "s3" ? new S3Storage() : new LocalStorage(),
    cutout: flag("QB1_CUTOUT", "local") === "adobe" ? new AdobeCutout() : new LocalCutout(),
    vision:
      flag("QB1_VISION", "local") === "rekognition"
        ? new RekognitionVision()
        : new LocalVision(),
    photoshelter:
      flag("QB1_PHOTOSHELTER", "local") === "api"
        ? new PhotoShelterApi()
        : new LocalPhotoShelter(),
    apImages: flag("QB1_AP_IMAGES", "local") === "api" ? new ApImagesApi() : new LocalApImages(),
    localSource: new LocalUploadSource(),
    auth: flag("QB1_AUTH", "local") === "okta" ? new OktaAuth() : new LocalAuth(),
  };
}

export function sourceFor(source: "photoshelter" | "ap" | "local") {
  const p = getProviders();
  if (source === "photoshelter") return p.photoshelter;
  if (source === "ap") return p.apImages;
  return p.localSource;
}
