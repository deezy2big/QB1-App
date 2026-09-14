import { alignHeadshot, findPupils } from "../image-ops";
import type { PupilPair, VisionProvider } from "./types";

export class LocalVision implements VisionProvider {
  id = "local" as const;

  findPupils(bytes: Buffer) {
    return findPupils(bytes);
  }

  alignHeadshot(bytes: Buffer, pupils?: PupilPair) {
    return alignHeadshot(bytes, pupils);
  }
}
