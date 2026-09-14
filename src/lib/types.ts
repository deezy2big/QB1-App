export type AssetKind = "headshot" | "portrait" | "action" | "movie";
export type SourceKind = "photoshelter" | "ap" | "local";
export type ViewId = "photoshelter" | "ap" | "upload" | "jobs" | "analytics";
export type ActionMode = "process" | "download";

export type JobStatus =
  | "queued"
  | "transferring"
  | "cutting_out"
  | "sequencing"
  | "aligning"
  | "complete"
  | "failed";

export type Team = {
  id: string;
  name: string;
  abbr: string;
  city: string;
  primary: string;
  secondary: string;
};

export type Asset = {
  id: string;
  name: string;
  kind: AssetKind;
  source: SourceKind;
  teamId?: string;
  player?: string;
  number?: string;
  position?: string;
  caption?: string;
  year: number;
  folderId: string;
  width: number;
  height: number;
  bytes: number;
  takenAt?: string;
  fileKey?: string;
};

export type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  headshotWorkflow: boolean;
  teamId?: string;
};

export type JobEvent = {
  at: number;
  status: JobStatus;
  message: string;
};

export type JobOutput = {
  assetId: string;
  originalKey: string;
  processedKey?: string;
  sequencePrefix?: string;
  frameCount?: number;
};

export type Job = {
  id: string;
  createdAt: number;
  mode: ActionMode;
  status: JobStatus;
  assetIds: string[];
  events: JobEvent[];
  submittedBy: string;
  office: string;
  outputs: JobOutput[];
  error?: string;
};

export type Session = {
  name: string;
  email: string;
  office: string;
};
