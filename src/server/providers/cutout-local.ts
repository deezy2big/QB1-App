import { removeBackground } from "../image-ops";
import type { CutoutProvider } from "./types";

export class LocalCutout implements CutoutProvider {
  id = "local" as const;

  removeBackground(bytes: Buffer) {
    return removeBackground(bytes);
  }
}
