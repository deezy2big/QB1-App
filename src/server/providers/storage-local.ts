import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataPath } from "../paths";
import type { StorageProvider } from "./types";

export class LocalStorage implements StorageProvider {
  id = "local" as const;

  absPath(key: string) {
    return dataPath(key);
  }

  async put(key: string, bytes: Buffer) {
    const full = this.absPath(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }

  async get(key: string) {
    return readFile(this.absPath(key));
  }

  async exists(key: string) {
    try {
      await stat(this.absPath(key));
      return true;
    } catch {
      return false;
    }
  }
}
