import type { ActionMode, Asset, JobStatus } from "./types";

export type PipelineStep = {
  status: JobStatus;
  ms: number;
  message: (count: number, kinds: string[]) => string;
};

export function pipelineFor(assets: Asset[], mode: ActionMode): PipelineStep[] {
  if (mode === "download") {
    return [
      {
        status: "queued",
        ms: 280,
        message: (n) => `Queued ${n} original${n === 1 ? "" : "s"} for download`,
      },
      {
        status: "transferring",
        ms: 700,
        message: (n) => `Fetching ${n} file${n === 1 ? "" : "s"} from source`,
      },
      {
        status: "complete",
        ms: 200,
        message: (n) => `Download ready · ${n} file${n === 1 ? "" : "s"}`,
      },
    ];
  }

  const kinds = new Set(assets.map((a) => a.kind));
  const steps: PipelineStep[] = [
    {
      status: "queued",
      ms: 350,
      message: (n) => `Created job record · ${n} image${n === 1 ? "" : "s"} queued`,
    },
    {
      status: "transferring",
      ms: 900,
        message: (n) => `Copying ${n} asset${n === 1 ? "" : "s"} into storage`,
    },
  ];

  if (kinds.has("movie")) {
    steps.push({
      status: "sequencing",
      ms: 1400,
      message: () => "Converting movie to image sequence",
    });
  }

  steps.push({
    status: "cutting_out",
    ms: 1600,
    message: (n) => `Cutout · ${n} frame${n === 1 ? "" : "s"}`,
  });

  if (kinds.has("headshot")) {
    steps.push({
      status: "aligning",
      ms: 1100,
      message: () =>
        "Image recognition · pupils located, inter-pupil distance locked, scale normalized",
    });
  }

  steps.push({
    status: "complete",
    ms: 250,
    message: (n) => `Processed ${n} asset${n === 1 ? "" : "s"}`,
  });

  return steps;
}

export function statusLabel(status: JobStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "transferring":
      return "Transferring";
    case "sequencing":
      return "Sequencing";
    case "cutting_out":
      return "Cutting out";
    case "aligning":
      return "Aligning pupils";
    case "complete":
      return "Complete";
    case "failed":
      return "Failed";
  }
}
