import type { Asset, Folder } from "@/lib/types";

export type PupilPair = {
  left: { x: number; y: number };
  right: { x: number; y: number };
};

export interface StorageProvider {
  id: "local" | "s3";
  put(key: string, bytes: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  absPath?(key: string): string;
}

export interface CutoutProvider {
  id: "local" | "adobe";
  removeBackground(bytes: Buffer): Promise<Buffer>;
}

export interface VisionProvider {
  id: "local" | "rekognition";
  findPupils(bytes: Buffer): Promise<PupilPair>;
  alignHeadshot(bytes: Buffer, pupils?: PupilPair): Promise<Buffer>;
}

export interface SourceProvider {
  id: "local" | "photoshelter" | "ap";
  getAsset(id: string): Promise<Asset | undefined>;
  getBytes(id: string): Promise<Buffer>;
  listFolders?(): Promise<Folder[]>;
  search?(query: string): Promise<Asset[]>;
}

export interface AuthProvider {
  id: "local" | "okta";
  verify(token: string): Promise<{ email: string; name: string }>;
}

export type Providers = {
  storage: StorageProvider;
  cutout: CutoutProvider;
  vision: VisionProvider;
  photoshelter: SourceProvider;
  apImages: SourceProvider;
  localSource: SourceProvider;
  auth: AuthProvider;
};
